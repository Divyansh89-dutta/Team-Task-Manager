const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const {
  getProjects, getProject, createProject, updateProject,
  deleteProject, addMember, removeMember, getProjectStats,
} = require('../controllers/projectController');

router.use(protect);
router.get('/', getProjects);
router.post('/', validate(schemas.createProject), createProject);
router.get('/:id', getProject);
router.put('/:id', validate(schemas.updateProject), updateProject);
router.delete('/:id', deleteProject);
router.get('/:id/stats', getProjectStats);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
