const router   = require('express').Router();
const ctrl     = require('../controllers/leadController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

const createRules = [
  body('organization').trim().notEmpty().withMessage('Organization is required'),
  body('contactPerson').trim().notEmpty().withMessage('Contact person is required'),
  body('mobile').trim().notEmpty().withMessage('Mobile is required'),
];

router.use(protect);

router.get   ('/pipeline',      ctrl.getPipeline);
router.get   ('/',              ctrl.getAll);
router.post  ('/',              createRules, validate, ctrl.create);
router.get   ('/:id',           ctrl.getById);
router.put   ('/:id',           ctrl.update);
router.delete('/:id',           ctrl.delete);
router.patch ('/:id/stage',     [body('status').notEmpty()], validate, ctrl.moveStage);
router.post  ('/:id/notes',     [body('note').trim().notEmpty()], validate, ctrl.addNote);

module.exports = router;
