
const express = require('express');
const { 
  getRegistrations, 
  getRegistration, 
  createRegistration, 
  updateRegistration, 
  deleteRegistration 
} = require('../controllers/registrations');

const router = express.Router();

// Protect middleware
const { protect } = require('../middleware/auth');

// For file uploads
const path = require('path');

router.route('/')
  .get(protect, getRegistrations)
  .post(createRegistration);

router.route('/:id')
  .get(protect, getRegistration)
  .put(protect, updateRegistration)
  .delete(protect, deleteRegistration);

// Add a specific route for program registrations
router.post('/program/:programId', createRegistration);

module.exports = router;
