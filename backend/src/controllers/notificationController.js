const Notification = require('../models/Notification');
const { asyncHandler, successResponse, getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

exports.getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { unread } = req.query;

  const filter = { recipient: req.user._id };
  if (unread === 'true') filter.read = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('actor', 'name avatar')
      .populate('project', 'name color')
      .populate('task', 'title identifier')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
  ]);

  successResponse(res, {
    notifications,
    unreadCount,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });

  await notification.markAsRead();
  successResponse(res, { notification });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { read: true, readAt: new Date() }
  );
  successResponse(res, null, 'All notifications marked as read');
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });
  successResponse(res, null, 'Notification deleted');
});
