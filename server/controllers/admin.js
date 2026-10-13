
const Admin = require('../models/Admin');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { logAdminAction } = require('../utils/auditLogger');

// @desc    Get all admins
// @route   GET /api/admin
// @access  Private/SuperAdmin
exports.getAdmins = asyncHandler(async (req, res, next) => {
  const admins = await Admin.find().select('-password');

  res.status(200).json({
    success: true,
    count: admins.length,
    data: admins
  });
});

// @desc    Get single admin
// @route   GET /api/admin/:id
// @access  Private/SuperAdmin
exports.getAdmin = asyncHandler(async (req, res, next) => {
  const admin = await Admin.findById(req.params.id).select('-password');

  if (!admin) {
    return next(new ErrorResponse(`Admin not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: admin
  });
});

// @desc    Update admin
// @route   PUT /api/admin/:id
// @access  Private/SuperAdmin
exports.updateAdmin = asyncHandler(async (req, res, next) => {
  // Extract fields that are allowed to be updated
  const { username, email, password, isSuperAdmin } = req.body;
  const updateData = {};

  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (typeof isSuperAdmin !== 'undefined') updateData.isSuperAdmin = isSuperAdmin;

  // Find admin to update
  let admin = await Admin.findById(req.params.id);

  if (!admin) {
    return next(new ErrorResponse(`Admin not found with id of ${req.params.id}`, 404));
  }

  // Update admin
  admin = await Admin.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  // If password was provided, update it separately
  if (password) {
    admin.password = password;
    await admin.save();
  }

  // Log the update
  await logAdminAction(
    req.user.username,
    'update',
    'admin',
    admin._id.toString(),
    `Updated admin user: ${admin.username}`
  );

  res.status(200).json({
    success: true,
    data: {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      isSuperAdmin: admin.isSuperAdmin,
      createdAt: admin.createdAt
    }
  });
});

// @desc    Delete admin
// @route   DELETE /api/admin/:id
// @access  Private/SuperAdmin
exports.deleteAdmin = asyncHandler(async (req, res, next) => {
  const admin = await Admin.findById(req.params.id);

  if (!admin) {
    return next(new ErrorResponse(`Admin not found with id of ${req.params.id}`, 404));
  }

  // Prevent deletion of the last super admin
  if (admin.isSuperAdmin) {
    const superAdminCount = await Admin.countDocuments({ isSuperAdmin: true });
    if (superAdminCount <= 1) {
      return next(new ErrorResponse('Cannot delete the last super admin', 400));
    }
  }

  // Log before deleting
  const adminUsername = admin.username;
  const adminId = admin._id.toString();

  await admin.deleteOne();

  // Log the deletion
  await logAdminAction(
    req.user.username,
    'delete',
    'admin',
    adminId,
    `Deleted admin user: ${adminUsername}`
  );

  res.status(200).json({
    success: true,
    data: {}
  });
});
