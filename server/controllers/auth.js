
const Admin = require('../models/Admin');
const ErrorResponse = require('../utils/errorResponse');
const { logAdminAction } = require('../utils/auditLogger');
const asyncHandler = require('../middleware/async');

// @desc    Register admin user
// @route   POST /api/auth/register
// @access  Private/SuperAdmin
exports.registerAdmin = asyncHandler(async (req, res, next) => {
  const { username, email, password, isSuperAdmin } = req.body;

  // Create user
  const user = await Admin.create({
    username,
    email,
    password,
    isSuperAdmin: isSuperAdmin || false
  });

  // Log admin creation
  await logAdminAction(
    req.user.username,
    'create',
    'admin',
    user._id.toString(),
    `Created new admin user: ${username}`
  );

  res.status(201).json({
    success: true,
    data: {
      id: user._id,
      username: user.username,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      createdAt: user.createdAt
    }
  });
});

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  // Validate username & password
  if (!username || !password) {
    return next(new ErrorResponse('Please provide a username and password', 400));
  }

  // Check for user
  const user = await Admin.findOne({ username }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Log successful login
  await logAdminAction(
    username,
    'login',
    'admin',
    user._id.toString(),
    'Admin user logged in'
  );

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// @desc    Logout admin / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {}
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin
    }
  });
};
