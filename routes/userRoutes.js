const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/',             authorize('ADMIN','CEO','SALES_MANAGER'), ctrl.getAll);
router.get('/dropdown',     ctrl.getDropdown);
router.get('/:id',          ctrl.getById);
router.put('/:id',          authorize('ADMIN'), ctrl.update);
router.patch('/:id/deactivate', authorize('ADMIN'), ctrl.deactivate);

module.exports = router;
