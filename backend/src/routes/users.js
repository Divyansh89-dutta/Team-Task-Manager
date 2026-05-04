const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { getUsers, getUser, updateUser } = require('../controllers/userController');

router.use(protect);
router.get('/', getUsers);
router.get('/:id', getUser);
router.patch('/:id', validate(schemas.updateUser), updateUser);

module.exports = router;
