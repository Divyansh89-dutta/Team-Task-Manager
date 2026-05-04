const User = require('../models/User');
const { asyncHandler, successResponse } = require('../utils/helpers');

exports.getUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { isActive: true };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter)
    .select('name email avatar role lastSeen')
    .sort({ name: 1 })
    .limit(50);

  successResponse(res, { users });
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  successResponse(res, { user });
});

exports.updateUser = asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const allowed = ['name', 'avatar', 'preferences'];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  successResponse(res, { user: user.toSafeObject() });
});
