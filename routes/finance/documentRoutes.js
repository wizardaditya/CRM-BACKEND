const express = require('express');
const router = express.Router();
const upload = require('../../config/multer');
const { getDocuments, getDocument, uploadDocument, deleteDocument } = require('../../controllers/finance/documentController');

router.get('/', getDocuments);
router.get('/:id', getDocument);
router.post('/', upload.single('file'), uploadDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
