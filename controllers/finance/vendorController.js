const { prisma } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse, getPagination, getPaginationMeta } = require('../../utils/apiResponse');

// GET /api/cfo/vendors
const getVendors = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const { search, isActive } = req.query;

    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { gstin: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { purchaseOrders: true } },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    return paginatedResponse(res, data, getPaginationMeta(total, page, limit));
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/vendors/:id
const getVendor = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: true },
        },
      },
    });
    if (!vendor) return errorResponse(res, 'Vendor not found', 404);
    return successResponse(res, vendor);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/cfo/vendors
const createVendor = async (req, res) => {
  try {
    const {
      name, email, phone, company, address, city, state, country,
      pincode, gstin, pan, bankName, bankAccount, bankIfsc, notes,
    } = req.body;

    const vendor = await prisma.vendor.create({
      data: {
        name, email, phone, company, address, city, state, country,
        pincode, gstin, pan, bankName, bankAccount, bankIfsc, notes,
      },
    });

    return successResponse(res, vendor, 'Vendor created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/cfo/vendors/:id
const updateVendor = async (req, res) => {
  try {
    const existing = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!existing) return errorResponse(res, 'Vendor not found', 404);

    const {
      name, email, phone, company, address, city, state, country,
      pincode, gstin, pan, bankName, bankAccount, bankIfsc, notes, isActive,
    } = req.body;

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: {
        name, email, phone, company, address, city, state, country,
        pincode, gstin, pan, bankName, bankAccount, bankIfsc, notes, isActive,
      },
    });

    return successResponse(res, vendor, 'Vendor updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cfo/vendors/:id
const deleteVendor = async (req, res) => {
  try {
    const existing = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!existing) return errorResponse(res, 'Vendor not found', 404);
    await prisma.vendor.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Vendor deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = { getVendors, getVendor, createVendor, updateVendor, deleteVendor };
