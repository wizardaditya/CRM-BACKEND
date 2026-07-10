const prisma = require("../../config/db");
const { success, error } = require("../../utils/apiResponse");

const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalRevenue, monthlyRevenue, totalExpenses, monthlyExpenses,
      pendingPayments, overdueInvoices, outstandingInvoices, payrollDue, recentPayments,
    ] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paymentDate: { gte: startOfYear } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paymentDate: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { status: "APPROVED", expenseDate: { gte: startOfYear } } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { status: "APPROVED", expenseDate: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.invoice.aggregate({ _sum: { balanceDue: true }, where: { status: { in: ["SENT", "PARTIAL"] } } }),
      prisma.invoice.findMany({ where: { status: { in: ["SENT","PARTIAL","OVERDUE"] }, dueDate: { lt: now } }, select: { id: true, balanceDue: true, invoiceNumber: true } }),
      prisma.invoice.aggregate({ _sum: { balanceDue: true }, where: { status: { in: ["SENT","PARTIAL","OVERDUE"] } } }),
      prisma.payroll.findMany({ where: { month: now.getMonth()+1, year: now.getFullYear(), isPaid: false }, select: { netSalary: true } }),
      prisma.payment.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { invoice: { include: { contact: { select: { id: true, firstName: true, lastName: true } } } } } }),
    ]);

    const toNum = (v) => (typeof v === "bigint" ? Number(v) : parseFloat(v) || 0);
    const payrollDueAmt  = payrollDue.reduce((s, p) => s + p.netSalary, 0);
    const overdueAmt     = overdueInvoices.reduce((s, i) => s + i.balanceDue, 0);
    const totalRev       = totalRevenue._sum.amount || 0;
    const totalExp       = totalExpenses._sum.amount || 0;

    const recentActivity = recentPayments.map((p) => ({
      ...p,
      invoice: p.invoice ? {
        ...p.invoice,
        contact: p.invoice.contact ? {
          ...p.invoice.contact,
          name: ((p.invoice.contact.firstName || "") + " " + (p.invoice.contact.lastName || "")).trim(),
        } : null,
      } : null,
    }));

    return success(res, {
      kpis: {
        totalRevenue: totalRev, monthlyRevenue: monthlyRevenue._sum.amount || 0,
        expectedRevenue: (outstandingInvoices._sum.balanceDue || 0) + totalRev,
        totalExpenses: totalExp, monthlyExpenses: monthlyExpenses._sum.amount || 0,
        profit: totalRev - totalExp,
        pendingPayments: pendingPayments._sum.balanceDue || 0,
        overdueAmount: overdueAmt, overdueCount: overdueInvoices.length,
        outstandingInvoices: outstandingInvoices._sum.balanceDue || 0,
        payrollDue: payrollDueAmt,
        cashBalance: totalRev - totalExp - payrollDueAmt,
      },
      charts: { monthlyRevenue: [], monthlyExpenses: [], revenueByClient: [] },
      recentActivity,
    }, "Dashboard data fetched");
  } catch (e) { return error(res, e.message); }
};
module.exports = { getDashboard };