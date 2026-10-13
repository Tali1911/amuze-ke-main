
const Registration = require('../models/Registration');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sendEmail = require('../utils/sendEmail');

// @desc    Create payment checkout session
// @route   POST /api/payment/:registrationId
// @access  Public
exports.createCheckoutSession = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.params.registrationId)
    .populate('programId', 'title');

  if (!registration) {
    return next(new ErrorResponse(`Registration not found with id of ${req.params.registrationId}`, 404));
  }

  // Already paid
  if (registration.paymentStatus === 'completed') {
    return next(new ErrorResponse('This registration has already been paid for', 400));
  }

  // Create Stripe checkout session
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Forest Camp - ${registration.programId.title}`,
              description: `Registration for ${registration.childName}`
            },
            unit_amount: Math.round(registration.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        registration_id: registration._id.toString(),
      },
      mode: 'payment',
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/payment-cancel`,
    });

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Stripe error:', error);
    return next(new ErrorResponse('Error creating payment session', 500));
  }
});

// @desc    Process M-Pesa payment
// @route   POST /api/payment/mpesa/:registrationId
// @access  Public
exports.processMpesaPayment = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;
  const registration = await Registration.findById(req.params.registrationId);

  if (!registration) {
    return next(new ErrorResponse(`Registration not found with id of ${req.params.registrationId}`, 404));
  }

  // Already paid
  if (registration.paymentStatus === 'completed') {
    return next(new ErrorResponse('This registration has already been paid for', 400));
  }

  // In a real implementation, you would integrate with M-Pesa API here
  // This is a mock implementation
  
  // Simulate processing
  if (!phone) {
    return next(new ErrorResponse('Phone number is required for M-Pesa payment', 400));
  }

  // Update registration payment status
  registration.paymentMethod = 'mpesa';
  registration.paymentStatus = 'completed';
  registration.paymentId = `MPESA-${Date.now()}`;
  await registration.save();

  // Send payment confirmation email
  try {
    await sendEmail({
      email: registration.email,
      subject: 'Payment Confirmation - Forest Camp',
      emailType: 'confirmation',
      recipientType: 'registration',
      recipientId: registration._id.toString(),
      html: `
        <h1>Payment Confirmation</h1>
        <p>Dear ${registration.parentName},</p>
        <p>Your payment of KSh ${registration.amount} for ${registration.childName}'s registration has been received.</p>
        <p>Payment Reference: ${registration.paymentId}</p>
        <p>Thank you for choosing Forest Camp!</p>
        <p>Best regards,<br>Forest Camp Team</p>
      `
    });
  } catch (error) {
    console.log('Payment confirmation email could not be sent:', error);
  }

  res.status(200).json({
    success: true,
    data: registration
  });
});

// @desc    Handle Stripe webhook
// @route   POST /api/payment/webhook
// @access  Public
exports.stripeWebhook = asyncHandler(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, // You need to access the raw body data
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Extract the registration ID from metadata
      const registrationId = session.metadata.registration_id;
      
      if (registrationId) {
        // Update registration payment status
        const registration = await Registration.findById(registrationId);
        
        if (registration) {
          registration.paymentStatus = 'completed';
          registration.paymentId = session.id;
          await registration.save();
          
          // Send payment confirmation email
          try {
            await sendEmail({
              email: registration.email,
              subject: 'Payment Confirmation - Forest Camp',
              emailType: 'confirmation',
              recipientType: 'registration',
              recipientId: registration._id.toString(),
              html: `
                <h1>Payment Confirmation</h1>
                <p>Dear ${registration.parentName},</p>
                <p>Your payment for ${registration.childName}'s registration has been received.</p>
                <p>Payment Reference: ${session.id}</p>
                <p>Thank you for choosing Forest Camp!</p>
                <p>Best regards,<br>Forest Camp Team</p>
              `
            });
          } catch (error) {
            console.log('Payment confirmation email could not be sent:', error);
          }
        }
      }
      break;
      
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
});

// @desc    Verify payment status
// @route   GET /api/payment/verify/:registrationId
// @access  Public
exports.verifyPaymentStatus = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.params.registrationId);

  if (!registration) {
    return next(new ErrorResponse(`Registration not found with id of ${req.params.registrationId}`, 404));
  }

  res.status(200).json({
    success: true,
    data: {
      paymentStatus: registration.paymentStatus,
      paymentMethod: registration.paymentMethod,
      paymentId: registration.paymentId
    }
  });
});

// @desc    Mark payment as completed (admin only)
// @route   PUT /api/payment/manual/:registrationId
// @access  Private
exports.manualPaymentUpdate = asyncHandler(async (req, res, next) => {
  const { paymentStatus, paymentId, paymentMethod } = req.body;
  
  const registration = await Registration.findById(req.params.registrationId);

  if (!registration) {
    return next(new ErrorResponse(`Registration not found with id of ${req.params.registrationId}`, 404));
  }

  // Update payment information
  if (paymentStatus) registration.paymentStatus = paymentStatus;
  if (paymentId) registration.paymentId = paymentId;
  if (paymentMethod) registration.paymentMethod = paymentMethod;
  
  await registration.save();

  res.status(200).json({
    success: true,
    data: registration
  });
});
