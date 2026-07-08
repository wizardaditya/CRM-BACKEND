const express = require('express');
const router = express.Router();

const { authenticate } = require('../../middleware/auth');
const { cfoAccess } = require('../../middleware/auth');

// All CFO routes require authentication + CFO/ADMIN role
router.use(authenticate, cfoAccess);

router.use('/dashboard', require('./dashboardRoutes'));
router.use('/quotations', require('./quotationRoutes'));
router.use('/invoices', require('./invoiceRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/expenses', require('./expenseRoutes'));
router.use('/payroll', require('./payrollRoutes'));
router.use('/vendors', require('./vendorRoutes'));
router.use('/purchase-orders', require('./purchaseOrderRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/documents', require('./documentRoutes'));
router.use('/settings', require('./settingsRoutes'));

module.exports = router;
