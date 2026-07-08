const { prisma } = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const parseRange = (from, to) => ({
  gte: from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1),
  lte: to ? new Date(to) : new Date(),
});

// GET /api/cfo/reports/revenue
const getRevenueReport = async (req, res) => {
  try {
    const { from, to, groupBy = 'month' } = req.query;
    const range = parseRange(from, to);

    const payments = await prisma.payment.findMany({
      where: { status: 'PAID', paymentDate: range },
      include: {
        invoice: {
          include: { contact: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
      orderBy: { paymentDate: 'asc' },
    });

    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    return successResponse(res, { payments, total });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/reports/expenses
const getExpenseReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const range = parseRange(from, to);

    const expenses = await prisma.expense.findMany({
      where: { status: 'APPROVED', expenseDate: range },
      include: {
        submittedBy: { select: { name: true } },
      },
      orderBy: { expenseDate: 'asc' },
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    return successResponse(res, { expenses, total, byCategory });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/reports/profit-loss
const getProfitLoss = async (req, res) => {
  try {
    const { from, to } = req.query;
    const range = parseRange(from, to);

    const [revenueData, expenseData] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', paymentDate: range },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: 'APPROVED', expenseDate: range },
      }),
    ]);

    const revenue = revenueData._sum.amount || 0;
    const expenses = expenseData._sum.amount || 0;
    const profit = revenue - expenses;
    const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

    return successResponse(res, { revenue, expenses, profit, profitMargin });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/reports/cash-flow
const getCashFlow = async (req, res) => {
  try {
    const { from, to } = req.query;
    const range = parseRange(from, to);

    const [inflow, outflow] = await Promise.all([
      prisma.payment.findMany({
        where: { status: 'PAID', paymentDate: range },
        select: { amount: true, paymentDate: true },
        orderBy: { paymentDate: 'asc' },
      }),
      prisma.expense.findMany({
        where: { status: 'APPROVED', expenseDate: range },
        select: { amount: true, expenseDate: true },
        orderBy: { expenseDate: 'asc' },
      }),
    ]);

    const totalInflow = inflow.reduce((sum, p) => sum + p.amount, 0);
    const totalOutflow = outflow.reduce((sum, e) => sum + e.amount, 0);
    const netCashFlow = totalInflow - totalOutflow;

    return successResponse(res, { inflow, outflow, totalInflow, totalOutflow, netCashFlow });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/reports/outstanding
const getOutstandingReport = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const total = invoices.reduce((sum, i) => sum + i.balanceDue, 0);
    const overdue = invoices.filter((i) => new Date(i.dueDate) < new Date());
    const overdueTotal = overdue.reduce((sum, i) => sum + i.balanceDue, 0);

    return successResponse(res, { invoices, total, overdueCount: overdue.length, overdueTotal });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/reports/payroll
const getPayrollReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: { select: { name: true, email: true, role: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const totalGross = payrolls.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const totalDeductions = payrolls.reduce((sum, p) => sum + p.totalDeductions, 0);

    return successResponse(res, { payrolls, totalGross, totalNet, totalDeductions });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/reports/invoices
const getInvoiceReport = async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const range = parseRange(from, to);

    const where = { issueDate: range };
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        payments: true,
      },
      orderBy: { issueDate: 'asc' },
    });

    const totals = {
      count: invoices.length,
      grandTotal: invoices.reduce((sum, i) => sum + i.grandTotal, 0),
      amountPaid: invoices.reduce((sum, i) => sum + i.amountPaid, 0),
      balanceDue: invoices.reduce((sum, i) => sum + i.balanceDue, 0),
    };

    return successResponse(res, { invoices, totals });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  getRevenueReport,
  getExpenseReport,
  getProfitLoss,
  getCashFlow,
  getOutstandingReport,
  getPayrollReport,
  getInvoiceReport,
};
