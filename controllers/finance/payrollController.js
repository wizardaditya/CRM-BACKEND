const { prisma } = require('../../config/database');
const { successResponse, errorResponse, paginatedResponse, getPagination, getPaginationMeta } = require('../../utils/apiResponse');

// GET /api/cfo/payroll
const getPayrolls = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const { month, year, isPaid, employeeId } = req.query;

    const where = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (isPaid !== undefined) where.isPaid = isPaid === 'true';
    if (employeeId) where.employeeId = employeeId;

    const [data, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: {
          employee: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        },
      }),
      prisma.payroll.count({ where }),
    ]);

    return paginatedResponse(res, data, getPaginationMeta(total, page, limit));
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/payroll/:id
const getPayroll = async (req, res) => {
  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: req.params.id },
      include: {
        employee: { select: { id: true, name: true, email: true, role: true, phone: true } },
      },
    });
    if (!payroll) return errorResponse(res, 'Payroll record not found', 404);
    return successResponse(res, payroll);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/cfo/payroll
const createPayroll = async (req, res) => {
  try {
    const {
      employeeId, month, year,
      basicSalary, hra = 0, allowances = 0, commission = 0, bonus = 0,
      pf = 0, esi = 0, tds = 0, otherDeductions = 0,
      notes,
    } = req.body;

    // Verify employee exists
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) return errorResponse(res, 'Employee not found', 404);

    // Check for duplicate
    const existing = await prisma.payroll.findUnique({
      where: { employeeId_month_year: { employeeId, month: parseInt(month), year: parseInt(year) } },
    });
    if (existing) return errorResponse(res, 'Payroll already exists for this month', 409);

    const grossSalary = basicSalary + hra + allowances + commission + bonus;
    const totalDeductions = pf + esi + tds + otherDeductions;
    const netSalary = grossSalary - totalDeductions;

    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        month: parseInt(month),
        year: parseInt(year),
        basicSalary,
        hra,
        allowances,
        commission,
        bonus,
        grossSalary,
        pf,
        esi,
        tds,
        otherDeductions,
        totalDeductions,
        netSalary,
        notes,
      },
      include: {
        employee: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return successResponse(res, payroll, 'Payroll created', 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/cfo/payroll/:id
const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.payroll.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, 'Payroll record not found', 404);
    if (existing.isPaid) return errorResponse(res, 'Cannot edit a paid payroll', 400);

    const {
      basicSalary, hra = 0, allowances = 0, commission = 0, bonus = 0,
      pf = 0, esi = 0, tds = 0, otherDeductions = 0, notes,
    } = req.body;

    const grossSalary = basicSalary + hra + allowances + commission + bonus;
    const totalDeductions = pf + esi + tds + otherDeductions;
    const netSalary = grossSalary - totalDeductions;

    const payroll = await prisma.payroll.update({
      where: { id },
      data: {
        basicSalary, hra, allowances, commission, bonus,
        grossSalary, pf, esi, tds, otherDeductions,
        totalDeductions, netSalary, notes,
      },
      include: {
        employee: { select: { id: true, name: true, email: true } },
      },
    });

    return successResponse(res, payroll, 'Payroll updated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PATCH /api/cfo/payroll/:id/mark-paid
const markPaid = async (req, res) => {
  try {
    const payroll = await prisma.payroll.update({
      where: { id: req.params.id },
      data: { isPaid: true, paidAt: new Date() },
    });
    return successResponse(res, payroll, 'Payroll marked as paid');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cfo/payroll/:id
const deletePayroll = async (req, res) => {
  try {
    const existing = await prisma.payroll.findUnique({ where: { id: req.params.id } });
    if (!existing) return errorResponse(res, 'Payroll not found', 404);
    if (existing.isPaid) return errorResponse(res, 'Cannot delete a paid payroll', 400);
    await prisma.payroll.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Payroll deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/cfo/payroll/employees - list all employees for dropdown
const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true, avatar: true },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, employees);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = { getPayrolls, getPayroll, createPayroll, updatePayroll, markPaid, deletePayroll, getEmployees };
