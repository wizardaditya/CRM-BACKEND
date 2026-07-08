const { prisma } = require('../../config/database');
const { generateNumber } = require('../../utils/counterHelper');
const { successResponse, errorResponse, paginatedResponse, getPagination, getPaginationMeta } = require('../../utils/apiResponse');

// Helper to calculate totals
const calculateTotals = (items, discountType, discountValue, gstType, cgstRate = 9, sgstRate = 9, igstRate = 18) => {
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice * (1 - (item.discountPct || 0) / 100);
    return sum + lineTotal;
  }, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (subtotal * discountValue) / 100;
  } else if (discountType === 'fixed') {
    discountAmount = discountValue || 0;
  }

  const taxableAmount = subtotal - discountAmount;

  let cgstAmount = 0, sgstAmount = 0, igstAmount = 0, taxAmount = 0;
  if (gstType === 'CGST_SGST') {
    cgstAmount = (taxableAmount * cgstRate) / 100;
    sgstAmount = (taxableAmount * sgstRate) / 100;
    taxAmount = cgstAmount + sgstAmount;
  } else if (gstType === 'IGST') {
    igstAmount = (taxableAmount * igstRate) / 100;
    taxAmount = igstAmount;
  }

  const grandTotal = taxableAmount + taxAmount;
  return { subtotal, discountAmount, taxableAmount, cgstAmount, sgstAmount, igstAmount, taxAmount, grandTotal };
};

// GET /api/cfo/quotations
const getQuotations = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const { search, status, contactId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;
    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: true,
        },
      }),
      prisma.quotation.count({ where }),
    ]);

    return paginatedResponse(res, data, getPaginationMeta(total, page, limit));
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/quotations/:id
const getQuotation = async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        contact: true,
        items: true,
      },
    });
    if (!quotation) return errorResponse(res, 'Quotation not found', 404);
    return successResponse(res, quotation);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/cfo/quotations
const createQuotation = async (req, res) => {
  try {
    const {
      title, contactId, expiryDate, items, discountType, discountValue,
      gstType, cgstRate, sgstRate, igstRate, notes, terms,
    } = req.body;

    const settings = await prisma.financeSettings.findFirst();
    const prefix = settings?.quotationPrefix || 'QT';
    const quotationNumber = await generateNumber('quotation', prefix);

    const totals = calculateTotals(items, discountType, discountValue, gstType, cgstRate, sgstRate, igstRate);

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        title,
        contactId,
        expiryDate: new Date(expiryDate),
        status: 'DRAFT',
        discountType,
        discountValue: discountValue || 0,
        gstType: gstType || 'CGST_SGST',
        notes,
        terms,
        ...totals,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPct: item.discountPct || 0,
            taxRate: item.taxRate || 0,
            amount: item.quantity * item.unitPrice * (1 - (item.discountPct || 0) / 100),
          })),
        },
      },
      include: { contact: true, items: true },
    });

    return successResponse(res, quotation, 'Quotation created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/cfo/quotations/:id
const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, 'Quotation not found', 404);
    if (existing.convertedToInvoice) {
      return errorResponse(res, 'Cannot edit a converted quotation', 400);
    }

    const {
      title, contactId, expiryDate, items, discountType, discountValue,
      gstType, cgstRate, sgstRate, igstRate, notes, terms, status,
    } = req.body;

    const totals = calculateTotals(items, discountType, discountValue, gstType, cgstRate, sgstRate, igstRate);

    // Delete old items and recreate
    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        title,
        contactId,
        expiryDate: new Date(expiryDate),
        status,
        discountType,
        discountValue: discountValue || 0,
        gstType: gstType || 'CGST_SGST',
        notes,
        terms,
        ...totals,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPct: item.discountPct || 0,
            taxRate: item.taxRate || 0,
            amount: item.quantity * item.unitPrice * (1 - (item.discountPct || 0) / 100),
          })),
        },
      },
      include: { contact: true, items: true },
    });

    return successResponse(res, quotation, 'Quotation updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cfo/quotations/:id
const deleteQuotation = async (req, res) => {
  try {
    const existing = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!existing) return errorResponse(res, 'Quotation not found', 404);
    await prisma.quotation.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Quotation deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/cfo/quotations/:id/convert
const convertToInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!quotation) return errorResponse(res, 'Quotation not found', 404);
    if (quotation.convertedToInvoice) return errorResponse(res, 'Already converted to invoice', 400);
    if (quotation.status !== 'ACCEPTED') {
      return errorResponse(res, 'Only accepted quotations can be converted', 400);
    }

    const settings = await prisma.financeSettings.findFirst();
    const prefix = settings?.invoicePrefix || 'INV';
    const invoiceNumber = await generateNumber('invoice', prefix);

    const { dueDate } = req.body;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        title: quotation.title,
        contactId: quotation.contactId,
        quotationId: quotation.id,
        dueDate: new Date(dueDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        subtotal: quotation.subtotal,
        discountType: quotation.discountType,
        discountValue: quotation.discountValue,
        discountAmount: quotation.discountAmount,
        taxableAmount: quotation.taxableAmount,
        gstType: quotation.gstType,
        cgstAmount: quotation.cgstAmount,
        sgstAmount: quotation.sgstAmount,
        igstAmount: quotation.igstAmount,
        taxAmount: quotation.taxAmount,
        grandTotal: quotation.grandTotal,
        balanceDue: quotation.grandTotal,
        notes: quotation.notes,
        terms: quotation.terms,
        items: {
          create: quotation.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPct: item.discountPct,
            taxRate: item.taxRate,
            amount: item.amount,
          })),
        },
      },
      include: { contact: true, items: true },
    });

    await prisma.quotation.update({
      where: { id },
      data: { convertedToInvoice: true, invoiceId: invoice.id },
    });

    return successResponse(res, invoice, 'Converted to invoice', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PATCH /api/cfo/quotations/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status },
    });
    return successResponse(res, quotation, 'Status updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  convertToInvoice,
  updateStatus,
};
