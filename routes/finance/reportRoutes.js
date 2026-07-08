const express = require('express');
const router = express.Router();
const {
  getRevenueReport, getExpenseReport, getProfitLoss,
  getCashFlow, getOutstandingReport, getPayrollReport, getInvoiceReport,
} = require('../../controllers/finance/reportController');

router.get('/revenue', getRevenueReport);
router.get('/expenses', getExpenseReport);
router.get('/profit-loss', getProfitLoss);
router.get('/cash-flow', getCashFlow);
router.get('/outstanding', getOutstandingReport);
router.get('/payroll', getPayrollReport);
router.get('/invoices', getInvoiceReport);

module.exports = router;
