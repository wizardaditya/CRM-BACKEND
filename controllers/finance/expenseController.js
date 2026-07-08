const { prisma } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse, getPagination, getPaginationMeta } = require('../../utils/apiResponse');

// GET /api/cfo/expenses
const getExpenses = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const { search, status, category, month, year } = req.query;

    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.expenseDate = { gte: start, lte: end };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          submittedBy: { select: { id: true, name: true, email: true, avatar: true } },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return paginatedResponse(res, data, getPaginationMeta(total, page, limit));
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/expenses/:id
const getExpense = async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!expense) return errorResponse(res, 'Expense not found', 404);
    return successResponse(res, expense);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/cfo/expenses
const createExpense = async (req, res) => {
  try {
    const { title, description, amount, category, expenseDate, notes } = req.body;
    const billUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount: parseFloat(amount),
        category: category || 'MISC',
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        billUrl,
        submittedById: req.user.id,
        notes,
        status: 'PENDING',
      },
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return successResponse(res, expense, 'Expense created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/cfo/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, 'Expense not found', 404);
    if (existing.status !== 'PENDING') {
      return errorResponse(res, 'Only pending expenses can be edited', 400);
    }

    const { title, description, amount, category, expenseDate, notes } = req.body;
    const billUrl = req.file ? `/uploads/${req.file.filename}` : existing.billUrl;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        title,
        description,
        amount: parseFloat(amount),
        category,
        expenseDate: expenseDate ? new Date(expenseDate) : existing.expenseDate,
        billUrl,
        notes,
      },
      include: {
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return successResponse(res, expense, 'Expense updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PATCH /api/cfo/expenses/:id/approve
const approveExpense = async (req, res) => {
  try {
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date(),
      },
    });
    return successResponse(res, expense, 'Expense approved');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PATCH /api/cfo/expenses/:id/reject
const rejectExpense = async (req, res) => {
  try {
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        notes: req.body.reason || expense.notes,
      },
    });
    return successResponse(res, expense, 'Expense rejected');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cfo/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const existing = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!existing) return errorResponse(res, 'Expense not found', 404);
    await prisma.expense.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Expense deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = { getExpenses, getExpense, createExpense, updateExpense, approveExpense, rejectExpense, deleteExpense };
