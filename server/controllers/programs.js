
const Program = require('../models/Program');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { logAdminAction } = require('../utils/auditLogger');

// @desc    Get all programs
// @route   GET /api/programs
// @access  Public
exports.getPrograms = asyncHandler(async (req, res, next) => {
  const programs = await Program.find();

  res.status(200).json({
    success: true,
    count: programs.length,
    data: programs
  });
});

// @desc    Get single program
// @route   GET /api/programs/:id
// @access  Public
exports.getProgram = asyncHandler(async (req, res, next) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return next(new ErrorResponse(`Program not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: program
  });
});

// @desc    Create program
// @route   POST /api/programs
// @access  Private
exports.createProgram = asyncHandler(async (req, res, next) => {
  // Ensure rates are included in the request
  if (!req.body.rates) {
    req.body.rates = {
      halfDayMorning: 1500,
      halfDayAfternoon: 1500,
      fullDay: 2500
    };
  }
  
  const program = await Program.create(req.body);

  // Log admin action
  await logAdminAction(
    req.user.username,
    'create',
    'program',
    program._id.toString(),
    `Created new program: ${program.title}`
  );

  res.status(201).json({
    success: true,
    data: program
  });
});

// @desc    Update program
// @route   PUT /api/programs/:id
// @access  Private
exports.updateProgram = asyncHandler(async (req, res, next) => {
  let program = await Program.findById(req.params.id);

  if (!program) {
    return next(new ErrorResponse(`Program not found with id of ${req.params.id}`, 404));
  }

  // Ensure rates structure is preserved if not included in update
  if (!req.body.rates && program.rates) {
    req.body.rates = program.rates;
  }

  program = await Program.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // Log admin action
  await logAdminAction(
    req.user.username,
    'update',
    'program',
    program._id.toString(),
    `Updated program: ${program.title}`
  );

  res.status(200).json({
    success: true,
    data: program
  });
});

// @desc    Delete program
// @route   DELETE /api/programs/:id
// @access  Private
exports.deleteProgram = asyncHandler(async (req, res, next) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return next(new ErrorResponse(`Program not found with id of ${req.params.id}`, 404));
  }

  // Store program info before deleting
  const programTitle = program.title;
  const programId = program._id.toString();

  await program.deleteOne();

  // Log admin action
  await logAdminAction(
    req.user.username,
    'delete',
    'program',
    programId,
    `Deleted program: ${programTitle}`
  );

  res.status(200).json({
    success: true,
    data: {}
  });
});
