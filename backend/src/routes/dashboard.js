const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getDashboardStats, getMyTasks } = require('../controllers/dashboardController');

router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/my-tasks', getMyTasks);

module.exports = router;
