const router = require('express').Router();
const ctrl   = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/kpis',             ctrl.getKpis);
router.get('/monthly-growth',   ctrl.getMonthlyGrowth);
router.get('/revenue-chart',    ctrl.getRevenueChart);
router.get('/lead-sources',     ctrl.getLeadSources);
router.get('/pipeline-summary', ctrl.getPipelineSummary);
router.get('/recent-activities',ctrl.getRecentActivities);

module.exports = router;
