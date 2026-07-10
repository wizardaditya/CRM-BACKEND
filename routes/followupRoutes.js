const router   = require('express').Router();
const ctrl     = require('../controllers/followupController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

router.use(protect);
router.get   ('/calendar',  ctrl.getCalendar);
router.get   ('/',          ctrl.getAll);
router.post  ('/',          [
  body('type').isIn(['CALL','MEETING','DEMO','EMAIL','WHATSAPP','VISIT']),
  body('scheduledAt').isISO8601(),
], validate, ctrl.create);
router.get   ('/:id',       ctrl.getById);
router.put   ('/:id',       ctrl.update);
router.delete('/:id',       ctrl.delete);

module.exports = router;
