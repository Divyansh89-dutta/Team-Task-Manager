const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const {
  getTasks, getTask, createTask, updateTask,
  deleteTask, reorderTasks, addComment,
} = require('../controllers/taskController');

router.use(protect);
router.get('/', getTasks);
router.post('/', validate(schemas.createTask), createTask);
router.post('/reorder', reorderTasks);
router.get('/:id', getTask);
router.put('/:id', validate(schemas.updateTask), updateTask);
router.patch('/:id', validate(schemas.updateTask), updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/comments', validate(schemas.addComment), addComment);

module.exports = router;
