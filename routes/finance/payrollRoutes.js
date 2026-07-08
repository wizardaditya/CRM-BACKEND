const express = require('express');
const router = express.Router();
const {
  getPayrolls, getPayroll, createPayroll, updatePayroll,
  markPaid, deletePayroll, getEmployees,
} = require('../../controllers/finance/payrollController');

router.get('/employees', getEmployees);
router.get('/', getPayrolls);
router.get('/:id', getPayroll);
router.post('/', createPayroll);
router.put('/:id', updatePayroll);
router.patch('/:id/mark-paid', markPaid);
router.delete('/:id', deletePayroll);

module.exports = router;
