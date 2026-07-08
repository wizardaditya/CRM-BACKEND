const { prisma } = require('../../config/database');
const { generateNumber } = require('../../utils/counterHelper');
const { successResponse, errorResponse, paginatedResponse, getPagination, getPaginationMeta } = require('../../utils/apiResponse');

// GET /api/cfo/purchase-orders
const getPurchaseOrders = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const { search, status, vendorId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { id: true, name: true, company: true, email: true } },
          items: true,
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return paginatedResponse(res, data, getPaginationMeta(total, page, limit));
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/purchase-orders/:id
const getPurchaseOrder = async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { vendor: true, items: true },
    });
    if (!po) return errorResponse(res, 'Purchase order not found', 404);
    return successResponse(res, po);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/cfo/purchase-orders
const createPurchaseOrder = async (req, res) => {
  try {
    const { vendorId, expectedDelivery, items, notes } = req.body;

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) return errorResponse(res, 'Vendor not found', 404);

    const settings = await prisma.financeSettings.findFirst();
    const prefix = settings?.purchaseOrderPrefix || 'PO';
    const poNumber = await generateNumber('purchase_order', prefix);

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      return sum + (lineTotal * (item.taxRate || 0)) / 100;
    }, 0);
    const grandTotal = subtotal + taxAmount;

    const invoiceAttachment = req.file ? `/uploads/${req.file.filename}` : null;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        grandTotal,
        notes,
        invoiceAttachment,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            amount: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { vendor: true, items: true },
    });

    return successResponse(res, po, 'Purchase order created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/cfo/purchase-orders/:id
const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, 'Purchase order not found', 404);
    if (['DELIVERED', 'CANCELLED'].includes(existing.status)) {
      return errorResponse(res, 'Cannot edit delivered/cancelled purchase order', 400);
    }

    const { vendorId, expectedDelivery, items, notes, status } = req.body;
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice * (item.taxRate || 0)) / 100;
    }, 0);
    const grandTotal = subtotal + taxAmount;
    const invoiceAttachment = req.file ? `/uploads/${req.file.filename}` : existing.invoiceAttachment;

    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        vendorId,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        status,
        subtotal,
        taxAmount,
        grandTotal,
        notes,
        invoiceAttachment,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            amount: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { vendor: true, items: true },
    });

    return successResponse(res, po, 'Purchase order updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cfo/purchase-orders/:id
const deletePurchaseOrder = async (req, res) => {
  try {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return errorResponse(res, 'Purchase order not found', 404);
    await prisma.purchaseOrder.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Purchase order deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder };
