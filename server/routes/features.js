
const express = require('express');
const {
  getFeatures,
  getFeature,
  createFeature,
  updateFeature,
  toggleFeature,
  initializeFeatures
} = require('../controllers/features');

const router = express.Router();

// Protect middleware
const { protect, isSuperAdmin } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

// Routes accessible by all admins
router.get('/', getFeatures);
router.get('/:id', getFeature);
router.patch('/:id/toggle', toggleFeature);

// Routes accessible only by super admins
router.post('/', isSuperAdmin, createFeature);
router.put('/:id', isSuperAdmin, updateFeature);
router.post('/init', isSuperAdmin, initializeFeatures);

module.exports = router;
