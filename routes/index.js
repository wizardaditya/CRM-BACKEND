const router = require('express').Router();

router.use('/auth',          require('./authRoutes'));
router.use('/dashboard',     require('./dashboardRoutes'));
router.use('/leads',         require('./leadRoutes'));
router.use('/contacts',      require('./contactRoutes'));
router.use('/tasks',         require('./taskRoutes'));
router.use('/followups',     require('./followupRoutes'));
router.use('/files',         require('./fileRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/users',         require('./userRoutes'));


router.use('/cfo', require('./finance/index'));

module.exports = router;
