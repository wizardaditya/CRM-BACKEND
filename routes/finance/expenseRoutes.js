const express = require('express');
const router = express.Router();
const upload = require('../../config/multer');
const {
  getExpenses, getExpense, createExpense, updateExpense,
  approveExpense, rejectExpense, deleteExpense,
} = require('../../controllers/finance/expenseController');

router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', upload.single('bill'), createExpense);
router.put('/:id', upload.single('bill'), updateExpense);
router.patch('/:id/approve', approveExpense);
router.patch('/:id/reject', rejectExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
