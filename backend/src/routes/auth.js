const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { register, login, getMe, updateMe } = require('../controllers/authController');

router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.get('/me', protect, getMe);
router.patch('/me', protect, validate(schemas.updateUser), updateMe);

module.exports = router;
