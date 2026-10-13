
const express = require('express');
const { 
  getAnnouncements, 
  getAnnouncement, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} = require('../controllers/announcements');

const router = express.Router();

// Protect middleware
const { protect } = require('../middleware/auth');

router.route('/')
  .get(getAnnouncements)
  .post(protect, createAnnouncement);

router.route('/:id')
  .get(getAnnouncement)
  .put(protect, updateAnnouncement)
  .delete(protect, deleteAnnouncement);

module.exports = router;
