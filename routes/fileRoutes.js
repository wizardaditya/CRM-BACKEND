const router = require('express').Router();
const ctrl   = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

router.use(protect);
router.post  ('/',              upload.single('file'), ctrl.upload);
router.get   ('/lead/:leadId',  ctrl.getByLead);
router.delete('/:id',           ctrl.delete);

module.exports = router;
