const router   = require('express').Router();
const ctrl     = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

router.use(protect);
router.get   ('/',     ctrl.getAll);
router.post  ('/',     [body('firstName').trim().notEmpty()], validate, ctrl.create);
router.get   ('/:id',  ctrl.getById);
router.put   ('/:id',  ctrl.update);
router.delete('/:id',  ctrl.delete);

module.exports = router;
