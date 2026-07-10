const path   = require('path');
const fs     = require('fs');
const prisma = require('../config/db');
const R      = require('../utils/apiResponse');
const activityRepository = require('../repositories/activityRepository');

exports.upload = async (req, res, next) => {
  try {
    if (!req.file) return R.error(res, 'No file uploaded', 400);

    const { leadId } = req.body;
    const fileRecord = await prisma.file.create({
      data: {
        originalName: req.file.originalname,
        storedName:   req.file.filename,
        mimeType:     req.file.mimetype,
        size:         req.file.size,
        url:          `/uploads/${req.file.filename}`,
        leadId:       leadId || null,
        uploadedById: req.user.id,
      },
    });

    if (leadId) {
      await activityRepository.create({
        type:        'FILE_UPLOAD',
        description: `File uploaded: ${req.file.originalname}`,
        leadId,
        userId: req.user.id,
      });
    }

    R.created(res, fileRecord, 'File uploaded');
  } catch (err) { next(err); }
};

exports.getByLead = async (req, res, next) => {
  try {
    const files = await prisma.file.findMany({
      where:   { leadId: req.params.leadId },
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
    R.success(res, files);
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!file) return R.notFound(res);

    // Remove physical file
    const filePath = path.join(__dirname, '..', 'uploads', file.storedName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.file.delete({ where: { id: req.params.id } });
    R.success(res, null, 'File deleted');
  } catch (err) { next(err); }
};
