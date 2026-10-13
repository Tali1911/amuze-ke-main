
const Contact = require('../models/Contact');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
exports.submitContactForm = asyncHandler(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  // Basic spam validation - reject if message contains suspicious links
  const spamKeywords = ['casino', 'viagra', 'lottery', 'prize', 'winner', 'buy now'];
  const containsSpam = spamKeywords.some(keyword => 
    message.toLowerCase().includes(keyword) || subject.toLowerCase().includes(keyword)
  );
  
  if (containsSpam) {
    return next(new ErrorResponse('Message detected as spam', 400));
  }

  // Rate limiting is handled by middleware
  // IP address tracking could be added here
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Create contact entry
  const contact = await Contact.create({
    name,
    email,
    subject,
    message,
    ipAddress // Store IP for tracking potential abuse
  });

  // Send notification email to admin
  try {
    await sendEmail({
      email: process.env.EMAIL_FROM,
      subject: `New Contact Form Submission: ${subject}`,
      emailType: 'notification',
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p><small>IP: ${ipAddress}</small></p>
      `
    });
  } catch (error) {
    console.log('Admin notification email could not be sent:', error);
    // Don't return an error, just continue
  }

  // Send auto-reply to user
  try {
    await sendEmail({
      email: email,
      subject: 'Thank you for contacting Forest Camp',
      emailType: 'transactional',
      recipientType: 'lead',
      html: `
        <h1>Thank You for Contacting Us</h1>
        <p>Dear ${name},</p>
        <p>We have received your message regarding "${subject}".</p>
        <p>Our team will review your inquiry and get back to you as soon as possible.</p>
        <p>Best regards,<br>Forest Camp Team</p>
      `
    });
  } catch (error) {
    console.log('Auto-reply email could not be sent:', error);
    // Don't return an error, just continue
  }

  res.status(201).json({
    success: true,
    data: contact
  });
});

// @desc    Get all contact submissions
// @route   GET /api/contact
// @access  Private
exports.getContactSubmissions = asyncHandler(async (req, res, next) => {
  const contacts = await Contact.find().sort('-createdAt');

  res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts
  });
});

// @desc    Get single contact submission
// @route   GET /api/contact/:id
// @access  Private
exports.getContactSubmission = asyncHandler(async (req, res, next) => {
  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return next(new ErrorResponse(`Contact submission not found with id of ${req.params.id}`, 404));
  }

  // Mark as read if it's unread
  if (contact.status === 'unread') {
    contact.status = 'read';
    await contact.save();
  }

  res.status(200).json({
    success: true,
    data: contact
  });
});

// @desc    Update contact submission (mark as read/replied)
// @route   PUT /api/contact/:id
// @access  Private
exports.updateContactStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status || !['unread', 'read', 'replied'].includes(status)) {
    return next(new ErrorResponse('Please provide a valid status', 400));
  }

  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return next(new ErrorResponse(`Contact submission not found with id of ${req.params.id}`, 404));
  }

  contact.status = status;
  await contact.save();

  res.status(200).json({
    success: true,
    data: contact
  });
});

// @desc    Reply to contact submission
// @route   POST /api/contact/:id/reply
// @access  Private
exports.replyToContact = asyncHandler(async (req, res, next) => {
  const { replyMessage } = req.body;

  if (!replyMessage) {
    return next(new ErrorResponse('Please provide a reply message', 400));
  }

  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return next(new ErrorResponse(`Contact submission not found with id of ${req.params.id}`, 404));
  }

  // Send reply email
  try {
    await sendEmail({
      email: contact.email,
      subject: `RE: ${contact.subject}`,
      emailType: 'transactional',
      recipientType: 'lead',
      html: `
        <h1>Response to Your Inquiry</h1>
        <p>Dear ${contact.name},</p>
        <p>Thank you for contacting Forest Camp. Here is our response to your inquiry:</p>
        <p>${replyMessage}</p>
        <p>If you have any further questions, please don't hesitate to reach out.</p>
        <p>Best regards,<br>Forest Camp Team</p>
        <hr>
        <p><small>Your original message:</small></p>
        <p><small>${contact.message}</small></p>
      `
    });

    // Update status to replied
    contact.status = 'replied';
    await contact.save();

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Delete contact submission
// @route   DELETE /api/contact/:id
// @access  Private
exports.deleteContactSubmission = asyncHandler(async (req, res, next) => {
  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return next(new ErrorResponse(`Contact submission not found with id of ${req.params.id}`, 404));
  }

  await contact.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
