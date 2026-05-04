const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const cacheService = require('../services/cacheService');
const { getSocketIO } = require('../services/socketService');
const { asyncHandler, successResponse, getPaginationParams, buildPaginationMeta } = require('../utils/helpers');

const emitTaskEvent = (event, projectId, data) => {
  const io = getSocketIO();
  io?.to(`project:${projectId}`).emit(event, data);
};

// Best-effort: create, populate, and socket-emit a notification
const emitNotification = async (data, recipientId) => {
  try {
    const notif = await Notification.create(data);
    await notif.populate([
      { path: 'actor', select: 'name email avatar' },
      { path: 'project', select: 'name color' },
      { path: 'task', select: 'title identifier' },
    ]);
    getSocketIO()?.to(`user:${recipientId.toString()}`).emit('notification:new', notif);
  } catch (_) { /* notifications are best-effort */ }
};

exports.getTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { projectId, status, priority, assignee, search, sortBy = 'order', sortDir = 'asc' } = req.query;

  const isGlobalAdmin = req.user.role === 'admin';
  const projectFilter = isGlobalAdmin
    ? {}
    : { $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] };
  if (projectId) projectFilter._id = projectId;
  const userProjects = await Project.find(projectFilter).select('_id');
  const projectIds = userProjects.map((p) => p._id);

  const filter = { project: { $in: projectIds } };
  if (status) filter.status = { $in: status.split(',') };
  if (priority) filter.priority = { $in: priority.split(',') };
  if (assignee) filter.assignee = assignee;
  if (search) filter.$text = { $search: search };

  const sortOptions = { [sortBy]: sortDir === 'desc' ? -1 : 1 };

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('project', 'name color identifier')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    Task.countDocuments(filter),
  ]);

  successResponse(res, { tasks, pagination: buildPaginationMeta(total, page, limit) });
});

exports.getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email avatar')
    .populate('creator', 'name email avatar')
    .populate('project', 'name color identifier')
    .populate('comments.author', 'name email avatar');

  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const project = await Project.findById(task.project);
  if (req.user.role !== 'admin' && !project?.isMember(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  successResponse(res, { task });
});

exports.createTask = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.body.project);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  if (req.user.role !== 'admin' && !project.isMember(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const maxOrderTask = await Task.findOne({ project: req.body.project, status: req.body.status || 'todo' })
    .sort({ order: -1 })
    .select('order');

  const task = await Task.create({
    ...req.body,
    creator: req.user._id,
    order: (maxOrderTask?.order ?? -1) + 1,
  });

  await Project.findByIdAndUpdate(req.body.project, { $inc: { taskCount: 1 } });

  await Activity.create({
    type: 'task_created',
    actor: req.user._id,
    project: req.body.project,
    task: task._id,
    meta: { taskTitle: task.title },
  });

  if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
    await emitNotification({
      recipient: task.assignee,
      type: 'task_assigned',
      title: 'New task assigned',
      message: `${req.user.name} assigned you "${task.title}"`,
      actor: req.user._id,
      project: task.project,
      task: task._id,
      link: `/projects/${task.project}`,
    }, task.assignee);
  }

  await task.populate([
    { path: 'assignee', select: 'name email avatar' },
    { path: 'creator', select: 'name email avatar' },
    { path: 'project', select: 'name color identifier' },
  ]);

  await cacheService.invalidate(`dashboard:${req.user._id}`);
  emitTaskEvent('task:created', task.project._id, { task });

  successResponse(res, { task }, 'Task created', 201);
});

exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const project = await Project.findById(task.project);
  if (req.user.role !== 'admin' && !project?.isMember(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const prevStatus = task.status;
  const prevAssignee = task.assignee?.toString();

  Object.assign(task, req.body);
  await task.save();

  const activityMeta = { taskTitle: task.title, changes: Object.keys(req.body) };

  if (req.body.status && req.body.status !== prevStatus) {
    activityMeta.fromStatus = prevStatus;
    activityMeta.toStatus = req.body.status;

    if (req.body.status === 'done') {
      await Project.findByIdAndUpdate(task.project, { $inc: { completedTaskCount: 1 } });
    } else if (prevStatus === 'done') {
      await Project.findByIdAndUpdate(task.project, { $inc: { completedTaskCount: -1 } });
    }

    await Activity.create({
      type: 'task_status_changed',
      actor: req.user._id,
      project: task.project,
      task: task._id,
      meta: activityMeta,
    });

    const currentAssigneeId = task.assignee?._id?.toString() || task.assignee?.toString();
    if (currentAssigneeId && currentAssigneeId !== req.user._id.toString()) {
      await emitNotification({
        recipient: currentAssigneeId,
        type: 'task_status_changed',
        title: 'Task status updated',
        message: `"${task.title}" moved to ${req.body.status.replace('_', ' ')}`,
        actor: req.user._id,
        project: task.project,
        task: task._id,
        link: `/projects/${task.project}`,
      }, currentAssigneeId);
    }
  } else {
    await Activity.create({
      type: 'task_updated',
      actor: req.user._id,
      project: task.project,
      task: task._id,
      meta: activityMeta,
    });
  }

  if (req.body.assignee && req.body.assignee !== prevAssignee) {
    const newAssigneeId = req.body.assignee;
    if (newAssigneeId !== req.user._id.toString()) {
      await emitNotification({
        recipient: newAssigneeId,
        type: 'task_assigned',
        title: 'Task reassigned to you',
        message: `${req.user.name} reassigned "${task.title}" to you`,
        actor: req.user._id,
        project: task.project,
        task: task._id,
        link: `/projects/${task.project}`,
      }, newAssigneeId);
    }
  }

  await task.populate([
    { path: 'assignee', select: 'name email avatar' },
    { path: 'creator', select: 'name email avatar' },
    { path: 'project', select: 'name color identifier' },
  ]);

  await cacheService.invalidate(`dashboard:${req.user._id}`);
  emitTaskEvent('task:updated', task.project._id, { task });

  successResponse(res, { task });
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  const project = await Project.findById(task.project);
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admins can delete tasks.' });
  }

  const wasCompleted = task.status === 'done';
  await task.deleteOne();

  await Project.findByIdAndUpdate(task.project, {
    $inc: {
      taskCount: -1,
      ...(wasCompleted && { completedTaskCount: -1 }),
    },
  });

  await Activity.create({
    type: 'task_deleted',
    actor: req.user._id,
    project: task.project,
    meta: { taskTitle: task.title },
  });

  await cacheService.invalidate(`dashboard:${req.user._id}`);
  emitTaskEvent('task:deleted', task.project, { taskId: task._id });

  successResponse(res, null, 'Task deleted');
});

exports.reorderTasks = asyncHandler(async (req, res) => {
  const { tasks } = req.body;

  const bulkOps = tasks.map(({ id, order, status }) => ({
    updateOne: {
      filter: { _id: id },
      update: { order, status },
    },
  }));

  await Task.bulkWrite(bulkOps);

  const io = getSocketIO();
  if (req.body.projectId) {
    io?.to(`project:${req.body.projectId}`).emit('task:reordered', { tasks });
  }

  successResponse(res, null, 'Tasks reordered');
});

exports.addComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

  task.comments.push({ author: req.user._id, content: req.body.content });
  await task.save();

  await task.populate('comments.author', 'name email avatar');
  const newComment = task.comments[task.comments.length - 1];

  await Activity.create({
    type: 'task_comment',
    actor: req.user._id,
    project: task.project,
    task: task._id,
    meta: { taskTitle: task.title },
  });

  // Notify assignee and creator (deduplicated, skip commenter)
  const commentRecipients = new Set();
  if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
    commentRecipients.add(task.assignee.toString());
  }
  if (task.creator && task.creator.toString() !== req.user._id.toString()) {
    commentRecipients.add(task.creator.toString());
  }
  for (const recipientId of commentRecipients) {
    await emitNotification({
      recipient: recipientId,
      type: 'task_comment',
      title: 'New comment',
      message: `${req.user.name} commented on "${task.title}"`,
      actor: req.user._id,
      project: task.project,
      task: task._id,
      link: `/projects/${task.project}`,
    }, recipientId);
  }

  emitTaskEvent('task:commented', task.project, { taskId: task._id, comment: newComment });

  successResponse(res, { comment: newComment }, 'Comment added', 201);
});
