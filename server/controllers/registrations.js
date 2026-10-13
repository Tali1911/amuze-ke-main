
const Registration = require('../models/Registration');
const Program = require('../models/Program');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Get all registrations
// @route   GET /api/registrations
// @access  Private
exports.getRegistrations = asyncHandler(async (req, res, next) => {
  const registrations = await Registration.find()
    .populate('programId', 'title startDate')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: registrations.length,
    data: registrations
  });
});

// @desc    Get single registration
// @route   GET /api/registrations/:id
// @access  Private
exports.getRegistration = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id)
    .populate('programId', 'title startDate duration rates');

  if (!registration) {
    return next(new ErrorResponse(`Registration not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: registration
  });
});

// @desc    Create registration
// @route   POST /api/registrations
// @access  Public
exports.createRegistration = asyncHandler(async (req, res, next) => {
  // Check if program exists
  const program = await Program.findById(req.body.programId);
  if (!program) {
    return next(new ErrorResponse(`Program not found with id of ${req.body.programId}`, 404));
  }

  // Check if phone is already registered with a different email
  const existingRegistration = await Registration.findOne({
    phone: req.body.phone,
    email: { $ne: req.body.email }
  });

  if (existingRegistration) {
    return next(new ErrorResponse('This phone number is already registered with another email address', 400));
  }

  // Calculate total amount based on all children's selections
  let totalAmount = 0;
  const children = req.body.children.map(child => {
    let childAmount = 0;
    switch (child.timeSlot) {
      case 'morning':
        childAmount = program.rates.halfDayMorning;
        break;
      case 'afternoon':
        childAmount = program.rates.halfDayAfternoon;
        break;
      case 'fullDay':
        childAmount = program.rates.fullDay;
        break;
      default:
        childAmount = program.rates.fullDay;
    }
    
    totalAmount += childAmount;
    
    return {
      ...child,
      amount: childAmount
    };
  });

  // Create registration with calculated amounts
  const registration = await Registration.create({
    parentName: req.body.parentName,
    email: req.body.email,
    phone: req.body.phone,
    programId: req.body.programId,
    children: children,
    totalAmount: totalAmount,
    paymentMethod: req.body.paymentMethod,
    paymentStatus: 'pending',
    poster: req.body.poster || null
  });

  // Send confirmation email
  try {
    let childrenInfo = registration.children.map((child, index) => {
      return `
        <p><strong>Child ${index + 1}: ${child.childName}</strong><br>
        Age: ${child.childAge}<br>
        Time Slot: ${child.timeSlot === 'morning' ? 'Morning (9am - 12:30pm)' : 
                     child.timeSlot === 'afternoon' ? 'Afternoon (12pm - 3pm)' : 
                     'Full Day (9am - 3pm)'}<br>
        Amount: KSh ${child.amount}</p>
      `;
    }).join('');

    await sendEmail({
      email: registration.email,
      subject: 'Forest Camp Registration Confirmation',
      emailType: 'confirmation',
      recipientType: 'registration',
      recipientId: registration._id.toString(),
      html: `
        <h1>Registration Confirmation</h1>
        <p>Dear ${registration.parentName},</p>
        <p>Thank you for registering your child(ren) for the ${program.title} program.</p>
        <p><strong>Program Details:</strong><br>
        Start Date: ${program.startDate}<br>
        Duration: ${program.duration}</p>
        
        <h2>Children Registered:</h2>
        ${childrenInfo}
        
        <p><strong>Total Amount: KSh ${totalAmount}</strong></p>
        <p><strong>Payment Status:</strong> ${registration.paymentStatus}</p>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>Forest Camp Team</p>
      `
    });
  } catch (error) {
    console.log('Email could not be sent:', error);
    // Don't return an error, just continue
  }

  res.status(201).json({
    success: true,
    data: registration
  });
});

// @desc    Update registration
// @route   PUT /api/registrations/:id
// @access  Private
exports.updateRegistration = asyncHandler(async (req, res, next) => {
  let registration = await Registration.findById(req.params.id);

  if (!registration) {
    return next(new ErrorResponse(`Registration not found with id of ${req.params.id}`, 404));
  }

  // Handle file upload if there is one
  if (req.files && req.files.poster) {
    const file = req.files.poster;

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Please upload an image file', 400));
    }

    // Check filesize
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD / 1000000}MB`, 400));
    }

    // Create custom filename
    file.name = `poster_${registration._id}${path.parse(file.name).ext}`;

    // Move file to upload path
    file.mv(`${process.env.FILE_UPLOAD_PATH}/posters/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse('Problem with file upload', 500));
      }

      // Update registration with poster path
      req.body.poster = `${process.env.FILE_UPLOAD_BASE_URL}/posters/${file.name}`;
      
      // Continue with update
      registration = await Registration.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      res.status(200).json({
        success: true,
        data: registration
      });
    });
  } else {
    // Just update without poster
    registration = await Registration.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: registration
    });
  }
});

// @desc    Delete registration
// @route   DELETE /api/registrations/:id
// @access  Private
exports.deleteRegistration = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id);

  if (!registration) {
    return next(new ErrorResponse(`Registration not found with id of ${req.params.id}`, 404));
  }

  await registration.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
