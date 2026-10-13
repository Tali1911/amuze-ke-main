
const express = require('express');
const { registerAdmin, login, getMe, logout } = require('../controllers/auth');

const router = express.Router();

// Protect middleware
const { protect, isSuperAdmin } = require('../middleware/auth');

router.post('/register', protect, isSuperAdmin, registerAdmin);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;
