
const express = require('express');
const { 
  getPrograms, 
  getProgram, 
  createProgram, 
  updateProgram, 
  deleteProgram 
} = require('../controllers/programs');

const router = express.Router();

// Protect middleware
const { protect } = require('../middleware/auth');

router.route('/')
  .get(getPrograms)
  .post(protect, createProgram);

router.route('/:id')
  .get(getProgram)
  .put(protect, updateProgram)
  .delete(protect, deleteProgram);

module.exports = router;
