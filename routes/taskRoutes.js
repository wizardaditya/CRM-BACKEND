const router   = require('express').Router();
const ctrl     = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

router.use(protect);
router.get   ('/',              ctrl.getAll);
router.post  ('/',              [body('title').trim().notEmpty()], validate, ctrl.create);
router.get   ('/:id',           ctrl.getById);
router.put   ('/:id',           ctrl.update);
router.delete('/:id',           ctrl.delete);
router.post  ('/:id/comments',  [body('content').trim().notEmpty()], validate, ctrl.addComment);

module.exports = router;
