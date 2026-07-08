const express = require('express');
const router = express.Router();
const { getDashboard } = require('../../controllers/finance/dashboardController');

router.get('/', getDashboard);

module.exports = router;
