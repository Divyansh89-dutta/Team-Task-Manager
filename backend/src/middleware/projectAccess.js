const Project = require('../models/Project');
const { asyncHandler } = require('../utils/helpers');

const requireProjectMember = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId || req.body.project);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }
  if (!project.isMember(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Access denied. Not a project member.' });
  }
  req.project = project;
  next();
});

const requireProjectAdmin = asyncHandler(async (req, res, next) => {
  const project = req.project || await Project.findById(req.params.projectId);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }
  if (!project.isAdmin(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
  }
  req.project = project;
  next();
});

module.exports = { requireProjectMember, requireProjectAdmin };
