
const express = require('express');
const { 
  submitContactForm, 
  getContactSubmissions, 
  getContactSubmission, 
  updateContactStatus, 
  replyToContact, 
  deleteContactSubmission 
} = require('../controllers/contact');

const router = express.Router();

// Protect middleware
const { protect } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimit');

router.route('/')
  .post(contactLimiter, submitContactForm)
  .get(protect, getContactSubmissions);

router.route('/:id')
  .get(protect, getContactSubmission)
  .put(protect, updateContactStatus)
  .delete(protect, deleteContactSubmission);

router.route('/:id/reply')
  .post(protect, replyToContact);

module.exports = router;
