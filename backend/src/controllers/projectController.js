const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const User = require('../models/User');
const cacheService = require('../services/cacheService');
const { getSocketIO } = require('../services/socketService');
const { asyncHandler, successResponse, getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

exports.getProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, search } = req.query;

  const isGlobalAdmin = req.user.role === 'admin';
  const filter = isGlobalAdmin
    ? {}
    : { $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] };
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  successResponse(res, {
    projects,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

exports.getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');

  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  if (!project.isMember(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  successResponse(res, { project });
});

exports.createProject = asyncHandler(async (req, res) => {
  const project = await Project.create({
    ...req.body,
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'admin' }],
  });

  await Activity.create({
    type: 'project_created',
    actor: req.user._id,
    project: project._id,
    meta: { projectName: project.name },
  });

  await cacheService.invalidate(`dashboard:${req.user._id}`);

  const io = getSocketIO();
  io?.to(`user:${req.user._id}`).emit('project:created', project);

  successResponse(res, { project }, 'Project created', 201);
});

exports.updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  if (!project.isAdmin(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  Object.assign(project, req.body);
  await project.save();

  await Activity.create({
    type: 'project_updated',
    actor: req.user._id,
    project: project._id,
    meta: { changes: Object.keys(req.body) },
  });

  await cacheService.invalidate(`project:${project._id}`);
  const io = getSocketIO();
  io?.to(`project:${project._id}`).emit('project:updated', project);

  successResponse(res, { project });
});

exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  if (project.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the owner can delete a project.' });
  }

  await Promise.all([
    Task.deleteMany({ project: project._id }),
    Activity.deleteMany({ project: project._id }),
    project.deleteOne(),
  ]);

  await cacheService.invalidate(`dashboard:${req.user._id}`);
  const io = getSocketIO();
  io?.to(`project:${project._id}`).emit('project:deleted', { projectId: project._id });

  successResponse(res, null, 'Project deleted');
});

exports.addMember = asyncHandler(async (req, res) => {
  const { email, role = 'member' } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  if (!project.isMember(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You must be a project member to invite others.' });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  if (project.isMember(user._id)) {
    return res.status(409).json({ success: false, message: 'User is already a member.' });
  }

  project.members.push({ user: user._id, role });
  await project.save();

  await Activity.create({
    type: 'member_added',
    actor: req.user._id,
    project: project._id,
    meta: { addedUser: user.name },
  });

  // Notify the added user
  try {
    const notif = await Notification.create({
      recipient: user._id,
      type: 'project_invitation',
      title: 'Added to project',
      message: `${req.user.name} added you to "${project.name}"`,
      actor: req.user._id,
      project: project._id,
      link: `/projects/${project._id}`,
    });
    await notif.populate([
      { path: 'actor', select: 'name email avatar' },
      { path: 'project', select: 'name color' },
    ]);
    getSocketIO()?.to(`user:${user._id.toString()}`).emit('notification:new', notif);
  } catch (_) { /* best-effort */ }

  const io = getSocketIO();
  io?.to(`project:${project._id}`).emit('project:member_added', {
    projectId: project._id,
    user: user.toSafeObject(),
  });

  await project.populate([
    { path: 'owner', select: 'name email avatar' },
    { path: 'members.user', select: 'name email avatar' },
  ]);
  successResponse(res, { project }, 'Member added');
});

exports.removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  if (!project.isAdmin(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  const memberIndex = project.members.findIndex(
    (m) => m.user.toString() === req.params.userId
  );
  if (memberIndex === -1) {
    return res.status(404).json({ success: false, message: 'Member not found.' });
  }

  project.members.splice(memberIndex, 1);
  await project.save();

  const io = getSocketIO();
  io?.to(`project:${project._id}`).emit('project:member_removed', {
    projectId: project._id,
    userId: req.params.userId,
  });

  successResponse(res, null, 'Member removed');
});

exports.getProjectStats = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const cacheKey = `project:stats:${projectId}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return successResponse(res, cached);

  const [taskStats, recentActivity] = await Promise.all([
    Task.aggregate([
      { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Activity.find({ project: projectId })
      .populate('actor', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const stats = {
    tasksByStatus: taskStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    recentActivity,
  };

  await cacheService.set(cacheKey, stats, 120);
  successResponse(res, stats);
});
