const { prisma } = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalRevenue,
      monthlyRevenue,
      totalExpenses,
      monthlyExpenses,
      pendingPayments,
      overdueInvoices,
      outstandingInvoices,
      payrollDue,
      recentPayments,
      revenueChartRaw,
      expenseChartRaw,
      clientChartRaw,
    ] = await Promise.all([
      // KPIs
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paymentDate: { gte: startOfYear } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paymentDate: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED', expenseDate: { gte: startOfYear } } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED', expenseDate: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.invoice.aggregate({ _sum: { balanceDue: true }, where: { status: { in: ['SENT', 'PARTIAL'] } } }),
      prisma.invoice.findMany({ where: { status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] }, dueDate: { lt: now } }, select: { id: true, balanceDue: true, invoiceNumber: true } }),
      prisma.invoice.aggregate({ _sum: { balanceDue: true }, where: { status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] } } }),
      prisma.payroll.findMany({ where: { month: now.getMonth() + 1, year: now.getFullYear(), isPaid: false }, select: { netSalary: true } }),

      // Recent payments — contact has firstName/lastName
      prisma.payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            include: {
              contact: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),

      // Revenue chart — PostgreSQL syntax
      prisma.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "paymentDate"), 'Mon YYYY') AS month,
          TO_CHAR(DATE_TRUNC('month', "paymentDate"), 'YYYY-MM') AS month_key,
          SUM(amount) AS revenue
        FROM payments
        WHERE status = 'PAID' AND "paymentDate" >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "paymentDate")
        ORDER BY DATE_TRUNC('month', "paymentDate") ASC
      `,

      // Expense chart
      prisma.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "expenseDate"), 'Mon YYYY') AS month,
          TO_CHAR(DATE_TRUNC('month', "expenseDate"), 'YYYY-MM') AS month_key,
          SUM(amount) AS expenses
        FROM expenses
        WHERE status = 'APPROVED' AND "expenseDate" >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "expenseDate")
        ORDER BY DATE_TRUNC('month', "expenseDate") ASC
      `,

      // Revenue by client — contacts have firstName + lastName
      prisma.$queryRaw`
        SELECT
          CONCAT(c."firstName", ' ', COALESCE(c."lastName", '')) AS client,
          SUM(p.amount) AS revenue
        FROM payments p
        JOIN invoices i ON i.id = p."invoiceId"
        JOIN contacts c ON c.id = i."contactId"
        WHERE p.status = 'PAID'
          AND EXTRACT(YEAR FROM p."paymentDate") = EXTRACT(YEAR FROM NOW())
        GROUP BY c."firstName", c."lastName"
        ORDER BY revenue DESC
        LIMIT 5
      `,
    ]);

    const toNum = (v) => (typeof v === 'bigint' ? Number(v) : parseFloat(v) || 0);

    const payrollDueAmount = payrollDue.reduce((s, p) => s + p.netSalary, 0);
    const overdueAmount    = overdueInvoices.reduce((s, i) => s + i.balanceDue, 0);
    const totalRevenueVal  = totalRevenue._sum.amount || 0;
    const totalExpensesVal = totalExpenses._sum.amount || 0;
    const profit           = totalRevenueVal - totalExpensesVal;
    const cashBalance      = totalRevenueVal - totalExpensesVal - payrollDueAmount;

    // Normalize recent payments contact name
    const recentActivity = recentPayments.map((p) => ({
      ...p,
      invoice: p.invoice ? {
        ...p.invoice,
        contact: p.invoice.contact ? {
          ...p.invoice.contact,
          name: `${p.invoice.contact.firstName || ''} ${p.invoice.contact.lastName || ''}`.trim(),
        } : null,
      } : null,
    }));

    return successResponse(res, {
      kpis: {
        totalRevenue:        totalRevenueVal,
        monthlyRevenue:      monthlyRevenue._sum.amount || 0,
        expectedRevenue:     (outstandingInvoices._sum.balanceDue || 0) + totalRevenueVal,
        totalExpenses:       totalExpensesVal,
        monthlyExpenses:     monthlyExpenses._sum.amount || 0,
        profit,
        pendingPayments:     pendingPayments._sum.balanceDue || 0,
        overdueAmount,
        overdueCount:        overdueInvoices.length,
        outstandingInvoices: outstandingInvoices._sum.balanceDue || 0,
        payrollDue:          payrollDueAmount,
        cashBalance,
      },
      charts: {
        monthlyRevenue:  revenueChartRaw.map((r) => ({ month: r.month, revenue: toNum(r.revenue) })),
        monthlyExpenses: expenseChartRaw.map((r) => ({ month: r.month, expenses: toNum(r.expenses) })),
        revenueByClient: clientChartRaw.map((r)  => ({ client: r.client, revenue: toNum(r.revenue) })),
      },
      recentActivity,
    }, 'Dashboard data fetched');

  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = { getDashboard };
