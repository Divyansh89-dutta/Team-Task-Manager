const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const cacheService = require('../services/cacheService');
const { asyncHandler, successResponse } = require('../utils/helpers');

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const cacheKey = `dashboard:${userId}`;

  const cached = await cacheService.get(cacheKey);
  if (cached) return successResponse(res, cached);

  const isGlobalAdmin = req.user.role === 'admin';
  const projectFilter = isGlobalAdmin
    ? { status: 'active' }
    : { $or: [{ owner: userId }, { 'members.user': userId }], status: 'active' };
  const userProjects = await Project.find(projectFilter).select('_id name color');

  const projectIds = userProjects.map((p) => p._id);

  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [
    tasksByStatus,
    overdueCount,
    dueSoonCount,
    recentActivity,
    weeklyTasksCreated,
    weeklyTasksCompleted,
    priorityBreakdown,
    tasksByAssignee,
  ] = await Promise.all([
    Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({
      project: { $in: projectIds },
      dueDate: { $lt: now },
      status: { $ne: 'done' },
    }),
    Task.countDocuments({
      project: { $in: projectIds },
      dueDate: { $gte: now, $lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
      status: { $ne: 'done' },
    }),
    Activity.find({ project: { $in: projectIds } })
      .populate('actor', 'name avatar')
      .populate('task', 'title identifier')
      .populate('project', 'name color')
      .sort({ createdAt: -1 })
      .limit(15)
      .lean(),
    Task.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          createdAt: { $gte: weekAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Task.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          status: 'done',
          completedAt: { $gte: weekAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Task.aggregate([
      { $match: { project: { $in: projectIds }, status: { $ne: 'done' } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: { project: { $in: projectIds }, assignee: { $ne: null } } },
      {
        $group: {
          _id: '$assignee',
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          total: 1,
          done: 1,
          'user._id': 1,
          'user.name': 1,
          'user.avatar': 1,
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const statusMap = tasksByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
  const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

  const stats = {
    overview: {
      total,
      todo: statusMap.todo || 0,
      inProgress: statusMap.in_progress || 0,
      inReview: statusMap.in_review || 0,
      done: statusMap.done || 0,
      overdue: overdueCount,
      dueSoon: dueSoonCount,
    },
    projects: userProjects,
    recentActivity,
    weeklyTrend: {
      created: weeklyTasksCreated,
      completed: weeklyTasksCompleted,
    },
    priorityBreakdown: priorityBreakdown.reduce(
      (acc, p) => ({ ...acc, [p._id]: p.count }),
      {}
    ),
    tasksByAssignee,
  };

  await cacheService.set(cacheKey, stats, 300);
  successResponse(res, stats);
});

exports.getMyTasks = asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  const filter = { assignee: req.user._id };
  if (status) filter.status = { $in: status.split(',') };
  if (priority) filter.priority = priority;

  const tasks = await Task.find(filter)
    .populate('project', 'name color identifier')
    .populate('creator', 'name avatar')
    .sort({ dueDate: 1, priority: 1, createdAt: -1 })
    .limit(50)
    .lean();

  successResponse(res, { tasks });
});
