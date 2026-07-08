const express = require('express');
const router = express.Router();
const {
  getQuotations, getQuotation, createQuotation, updateQuotation,
  deleteQuotation, convertToInvoice, updateStatus,
} = require('../../controllers/finance/quotationController');

router.get('/', getQuotations);
router.get('/:id', getQuotation);
router.post('/', createQuotation);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);
router.post('/:id/convert', convertToInvoice);
router.patch('/:id/status', updateStatus);

module.exports = router;
