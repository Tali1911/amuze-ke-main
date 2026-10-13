
const express = require('express');
const { getAdmins, getAdmin, updateAdmin, deleteAdmin } = require('../controllers/admin');

const router = express.Router();

// Protect middleware
const { protect, isSuperAdmin } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);
router.use(isSuperAdmin);

router.route('/')
  .get(getAdmins);

router.route('/:id')
  .get(getAdmin)
  .put(updateAdmin)
  .delete(deleteAdmin);

module.exports = router;
