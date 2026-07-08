const express = require('express');
const router = express.Router();
const upload = require('../../config/multer');
const { getSettings, upsertSettings } = require('../../controllers/finance/settingsController');

router.get('/', getSettings);
router.put('/', upload.single('logo'), upsertSettings);

module.exports = router;
