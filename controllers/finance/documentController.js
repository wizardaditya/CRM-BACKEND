const { prisma } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse, getPagination, getPaginationMeta } = require('../../utils/apiResponse');
const fs = require('fs');
const path = require('path');

// GET /api/cfo/documents
const getDocuments = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const { search, type } = req.query;

    const where = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.financeDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.financeDocument.count({ where }),
    ]);

    return paginatedResponse(res, data, getPaginationMeta(total, page, limit));
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/documents/:id
const getDocument = async (req, res) => {
  try {
    const doc = await prisma.financeDocument.findUnique({
      where: { id: req.params.id },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!doc) return errorResponse(res, 'Document not found', 404);
    return successResponse(res, doc);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/cfo/documents
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);

    const { title, type, description } = req.body;

    const doc = await prisma.financeDocument.create({
      data: {
        title: title || req.file.originalname,
        type: type || 'OTHER',
        fileUrl: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description,
        uploadedById: req.user.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return successResponse(res, doc, 'Document uploaded', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cfo/documents/:id
const deleteDocument = async (req, res) => {
  try {
    const doc = await prisma.financeDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return errorResponse(res, 'Document not found', 404);

    // Delete physical file
    const filePath = path.join(__dirname, '../../', doc.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.financeDocument.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Document deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = { getDocuments, getDocument, uploadDocument, deleteDocument };
