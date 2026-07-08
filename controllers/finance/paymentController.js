const { prisma } = require('../../config/database');
const { generateNumber } = require('../../utils/counterHelper');
const { successResponse, errorResponse, paginatedResponse, getPagination, getPaginationMeta } = require('../../utils/apiResponse');

// GET /api/cfo/payments
const getPayments = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const { search, status, invoiceId, paymentMode } = req.query;

    const where = {};
    if (status) where.status = status;
    if (invoiceId) where.invoiceId = invoiceId;
    if (paymentMode) where.paymentMode = paymentMode;
    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { invoice: { contact: { firstName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            include: { contact: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return paginatedResponse(res, data, getPaginationMeta(total, page, limit));
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/payments/:id
const getPayment = async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        invoice: { include: { contact: true, items: true } },
      },
    });
    if (!payment) return errorResponse(res, 'Payment not found', 404);
    return successResponse(res, payment);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/cfo/payments
const createPayment = async (req, res) => {
  try {
    const { invoiceId, amount, paymentDate, paymentMode, reference, notes } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) return errorResponse(res, 'Invoice not found', 404);
    if (invoice.status === 'CANCELLED') return errorResponse(res, 'Cannot record payment for cancelled invoice', 400);
    if (invoice.balanceDue <= 0) return errorResponse(res, 'Invoice already fully paid', 400);
    if (amount > invoice.balanceDue) {
      return errorResponse(res, `Amount exceeds balance due (${invoice.balanceDue})`, 400);
    }

    const paymentNumber = await generateNumber('payment', 'PAY');

    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId,
        amount,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMode: paymentMode || 'CASH',
        status: 'PAID',
        reference,
        notes,
      },
    });

    // Update invoice amounts
    const newAmountPaid = invoice.amountPaid + amount;
    const newBalanceDue = invoice.grandTotal - newAmountPaid;
    let newStatus = invoice.status;

    if (newBalanceDue <= 0) {
      newStatus = 'PAID';
    } else if (newAmountPaid > 0) {
      newStatus = 'PARTIAL';
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus,
      },
    });

    return successResponse(res, payment, 'Payment recorded', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/cfo/payments/:id/refund
const refundPayment = async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { invoice: true },
    });

    if (!payment) return errorResponse(res, 'Payment not found', 404);
    if (payment.status === 'REFUNDED') return errorResponse(res, 'Payment already refunded', 400);

    const updatedPayment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { status: 'REFUNDED' },
    });

    // Revert invoice amounts
    const invoice = payment.invoice;
    const newAmountPaid = invoice.amountPaid - payment.amount;
    const newBalanceDue = invoice.grandTotal - newAmountPaid;
    let newStatus = newAmountPaid <= 0 ? 'SENT' : 'PARTIAL';

    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        amountPaid: Math.max(0, newAmountPaid),
        balanceDue: newBalanceDue,
        status: newStatus,
      },
    });

    return successResponse(res, updatedPayment, 'Payment refunded');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cfo/payments/:id
const deletePayment = async (req, res) => {
  try {
    const existing = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!existing) return errorResponse(res, 'Payment not found', 404);
    await prisma.payment.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Payment deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = { getPayments, getPayment, createPayment, refundPayment, deletePayment };
