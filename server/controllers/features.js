
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Feature = require('../models/Feature');
const auditLogger = require('../utils/auditLogger');

// @desc    Get all features
// @route   GET /api/features
// @access  Private
exports.getFeatures = asyncHandler(async (req, res, next) => {
  const features = await Feature.find();
  
  res.status(200).json({
    success: true,
    data: features
  });
});

// @desc    Get single feature
// @route   GET /api/features/:id
// @access  Private
exports.getFeature = asyncHandler(async (req, res, next) => {
  const feature = await Feature.findById(req.params.id);
  
  if (!feature) {
    return next(
      new ErrorResponse(`Feature not found with id of ${req.params.id}`, 404)
    );
  }
  
  res.status(200).json({
    success: true,
    data: feature
  });
});

// @desc    Create new feature
// @route   POST /api/features
// @access  Private (Super Admin only)
exports.createFeature = asyncHandler(async (req, res, next) => {
  // Add admin user to req.body
  req.body.updatedBy = req.admin.id;
  
  const feature = await Feature.create(req.body);
  
  // Log the action
  auditLogger.log({
    adminId: req.admin.id,
    action: 'create',
    entity: 'feature',
    entityId: feature._id,
    details: `Created feature: ${feature.name}`
  });
  
  res.status(201).json({
    success: true,
    data: feature
  });
});

// @desc    Update feature
// @route   PUT /api/features/:id
// @access  Private
exports.updateFeature = asyncHandler(async (req, res, next) => {
  let feature = await Feature.findById(req.params.id);
  
  if (!feature) {
    return next(
      new ErrorResponse(`Feature not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Update the updatedBy and updatedAt fields
  req.body.updatedBy = req.admin.id;
  req.body.updatedAt = Date.now();
  
  feature = await Feature.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  // Log the action
  auditLogger.log({
    adminId: req.admin.id,
    action: 'update',
    entity: 'feature',
    entityId: feature._id,
    details: `Updated feature: ${feature.name}, Enabled: ${feature.enabled}`
  });
  
  res.status(200).json({
    success: true,
    data: feature
  });
});

// @desc    Toggle feature status
// @route   PATCH /api/features/:id/toggle
// @access  Private
exports.toggleFeature = asyncHandler(async (req, res, next) => {
  let feature = await Feature.findById(req.params.id);
  
  if (!feature) {
    return next(
      new ErrorResponse(`Feature not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Toggle the enabled status
  feature = await Feature.findByIdAndUpdate(
    req.params.id,
    {
      enabled: !feature.enabled,
      updatedBy: req.admin.id,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  // Log the action
  auditLogger.log({
    adminId: req.admin.id,
    action: 'toggle',
    entity: 'feature',
    entityId: feature._id,
    details: `Toggled feature: ${feature.name} to ${feature.enabled ? 'enabled' : 'disabled'}`
  });
  
  res.status(200).json({
    success: true,
    data: feature
  });
});

// @desc    Initialize default features
// @route   POST /api/features/init
// @access  Private (Super Admin only)
exports.initializeFeatures = asyncHandler(async (req, res, next) => {
  const defaultFeatures = [
    {
      key: 'galleryEnabled',
      name: 'Photo Gallery',
      description: 'Enable or disable the photo gallery on the website.',
      enabled: true,
      updatedBy: req.admin.id
    },
    {
      key: 'testimonialsEnabled',
      name: 'Testimonials Section',
      description: 'Show or hide testimonials from parents and participants.',
      enabled: true,
      updatedBy: req.admin.id
    },
    {
      key: 'blogEnabled',
      name: 'Blog',
      description: 'Enable or disable the blog section (coming soon).',
      enabled: false,
      updatedBy: req.admin.id
    },
    {
      key: 'showRecruitment',
      name: 'Recruitment Section',
      description: 'Show or hide the "Join Our Team" recruitment section.',
      enabled: false,
      updatedBy: req.admin.id
    }
  ];
  
  // Delete any existing features
  await Feature.deleteMany({});
  
  // Create the default features
  const features = await Feature.insertMany(defaultFeatures);
  
  // Log the action
  auditLogger.log({
    adminId: req.admin.id,
    action: 'initialize',
    entity: 'features',
    entityId: 'system',
    details: 'Initialized default features'
  });
  
  res.status(201).json({
    success: true,
    data: features,
    count: features.length
  });
});
