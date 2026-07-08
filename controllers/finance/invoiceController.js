const { prisma } = require('../../config/database');
const { generateNumber } = require('../../utils/counterHelper');
const { successResponse, errorResponse, paginatedResponse, getPagination, getPaginationMeta } = require('../../utils/apiResponse');

const calculateTotals = (items, discountType, discountValue, gstType, cgstRate = 9, sgstRate = 9, igstRate = 18) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice * (1 - (item.discountPct || 0) / 100);
  }, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') discountAmount = (subtotal * discountValue) / 100;
  else if (discountType === 'fixed') discountAmount = discountValue || 0;

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

// GET /api/cfo/invoices
const getInvoices = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const { search, status, contactId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: true,
          payments: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return paginatedResponse(res, data, getPaginationMeta(total, page, limit));
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/invoices/:id
const getInvoice = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        contact: true,
        items: true,
        payments: true,
      },
    });
    if (!invoice) return errorResponse(res, 'Invoice not found', 404);
    return successResponse(res, invoice);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/cfo/invoices
const createInvoice = async (req, res) => {
  try {
    const {
      title, contactId, dueDate, items, discountType, discountValue,
      gstType, cgstRate, sgstRate, igstRate, notes, terms,
    } = req.body;

    const settings = await prisma.financeSettings.findFirst();
    const prefix = settings?.invoicePrefix || 'INV';
    const invoiceNumber = await generateNumber('invoice', prefix);

    const totals = calculateTotals(items, discountType, discountValue, gstType, cgstRate, sgstRate, igstRate);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        title,
        contactId,
        dueDate: new Date(dueDate),
        status: 'DRAFT',
        discountType,
        discountValue: discountValue || 0,
        gstType: gstType || 'CGST_SGST',
        notes,
        terms,
        balanceDue: totals.grandTotal,
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

    return successResponse(res, invoice, 'Invoice created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/cfo/invoices/:id
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });
    if (!existing) return errorResponse(res, 'Invoice not found', 404);
    if (['PAID', 'CANCELLED'].includes(existing.status)) {
      return errorResponse(res, 'Cannot edit a paid or cancelled invoice', 400);
    }

    const {
      title, contactId, dueDate, items, discountType, discountValue,
      gstType, cgstRate, sgstRate, igstRate, notes, terms, status,
    } = req.body;

    const totals = calculateTotals(items, discountType, discountValue, gstType, cgstRate, sgstRate, igstRate);
    const amountPaid = existing.amountPaid;
    const balanceDue = totals.grandTotal - amountPaid;

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        title,
        contactId,
        dueDate: new Date(dueDate),
        status,
        discountType,
        discountValue: discountValue || 0,
        gstType: gstType || 'CGST_SGST',
        notes,
        terms,
        balanceDue,
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
      include: { contact: true, items: true, payments: true },
    });

    return successResponse(res, invoice, 'Invoice updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cfo/invoices/:id
const deleteInvoice = async (req, res) => {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!existing) return errorResponse(res, 'Invoice not found', 404);
    if (existing.status === 'PAID') return errorResponse(res, 'Cannot delete a paid invoice', 400);
    await prisma.invoice.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Invoice deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PATCH /api/cfo/invoices/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status },
    });
    return successResponse(res, invoice, 'Status updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, updateStatus };
