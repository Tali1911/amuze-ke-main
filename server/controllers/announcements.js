
const Announcement = require('../models/Announcement');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { logAdminAction } = require('../utils/auditLogger');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
exports.getAnnouncements = asyncHandler(async (req, res, next) => {
  const announcements = await Announcement.find().sort('-createdAt');

  res.status(200).json({
    success: true,
    count: announcements.length,
    data: announcements
  });
});

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Public
exports.getAnnouncement = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return next(new ErrorResponse(`Announcement not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: announcement
  });
});

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private
exports.createAnnouncement = asyncHandler(async (req, res, next) => {
  // We can now handle poster uploads from the frontend
  const announcement = await Announcement.create(req.body);

  // Log admin action
  await logAdminAction(
    req.user.username,
    'create',
    'announcement',
    announcement._id.toString(),
    `Created new announcement: ${announcement.title}`
  );

  res.status(201).json({
    success: true,
    data: announcement
  });
});

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private
exports.updateAnnouncement = asyncHandler(async (req, res, next) => {
  let announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return next(new ErrorResponse(`Announcement not found with id of ${req.params.id}`, 404));
  }

  announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log admin action
  await logAdminAction(
    req.user.username,
    'update',
    'announcement',
    announcement._id.toString(),
    `Updated announcement: ${announcement.title}`
  );

  res.status(200).json({
    success: true,
    data: announcement
  });
});

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private
exports.deleteAnnouncement = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return next(new ErrorResponse(`Announcement not found with id of ${req.params.id}`, 404));
  }

  // Store announcement info before deleting
  const announcementTitle = announcement.title;
  const announcementId = announcement._id.toString();

  await announcement.deleteOne();

  // Log admin action
  await logAdminAction(
    req.user.username,
    'delete',
    'announcement',
    announcementId,
    `Deleted announcement: ${announcementTitle}`
  );

  res.status(200).json({
    success: true,
    data: {}
  });
});
