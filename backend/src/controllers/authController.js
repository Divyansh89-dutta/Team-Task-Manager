const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, successResponse } = require('../utils/helpers');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  return res.status(statusCode).json({
    success: true,
    token,
    data: { user: user.toSafeObject() },
  });
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered.' });
  }

  const user = await User.create({ name, email, password });
  createAndSendToken(user, 201, res);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account deactivated.' });
  }

  user.lastSeen = new Date();
  await user.save({ validateBeforeSave: false });

  createAndSendToken(user, 200, res);
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  successResponse(res, { user: user.toSafeObject() });
});

exports.updateMe = asyncHandler(async (req, res) => {
  if (req.body.password) {
    return res.status(400).json({
      success: false,
      message: 'Use /change-password to update your password.',
    });
  }

  const allowed = ['name', 'avatar', 'preferences'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  successResponse(res, { user: user.toSafeObject() });
});
