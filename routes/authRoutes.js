const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const registerRules = [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').optional().isIn(['ADMIN','CEO','CFO','SALES_MANAGER','SALES_EXECUTIVE','MARKETING_MANAGER','MARKETING_EXECUTIVE','SUPPORT','HR']),
];

router.post('/register', protect, authorize('ADMIN'), registerRules, validate, ctrl.register);
router.post('/login',    loginRules, validate, ctrl.login);
router.post('/refresh',  ctrl.refresh);
router.post('/logout',   protect, ctrl.logout);
router.get( '/me',       protect, ctrl.me);
router.post('/forgot-password', [body('email').isEmail()], validate, ctrl.forgotPassword);
router.post('/reset-password',  [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
], validate, ctrl.resetPassword);
router.post('/change-password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], validate, ctrl.changePassword);

module.exports = router;
