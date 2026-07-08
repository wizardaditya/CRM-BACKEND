const express = require('express');
const router = express.Router();
const { getPayments, getPayment, createPayment, refundPayment, deletePayment } = require('../../controllers/finance/paymentController');

router.get('/', getPayments);
router.get('/:id', getPayment);
router.post('/', createPayment);
router.post('/:id/refund', refundPayment);
router.delete('/:id', deletePayment);

module.exports = router;
