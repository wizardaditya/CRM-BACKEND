const express = require('express');
const router = express.Router();
const upload = require('../../config/multer');
const {
  getPurchaseOrders, getPurchaseOrder, createPurchaseOrder,
  updatePurchaseOrder, deletePurchaseOrder,
} = require('../../controllers/finance/purchaseOrderController');

router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.post('/', upload.single('invoice'), createPurchaseOrder);
router.put('/:id', upload.single('invoice'), updatePurchaseOrder);
router.delete('/:id', deletePurchaseOrder);

module.exports = router;
