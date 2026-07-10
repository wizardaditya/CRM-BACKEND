const prisma = require('../config/db');

const dashboardService = {
  /**
   * All KPI counts for the dashboard
   */
  getKpis: async (userId, role) => {
    const isAdmin = ['ADMIN', 'CEO', 'CFO', 'SALES_MANAGER'].includes(role);
    const userFilter = isAdmin ? {} : { assignedToId: userId };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalLeads,
      todayFollowups,
      overdueFollowups,
      totalContacts,
      confirmedLeads,
      expectedRevenue,
      closedRevenue,
      pendingTasks,
      upcomingMeetings,
    ] = await Promise.all([
      prisma.lead.count({ where: { isActive: true, ...userFilter } }),

      prisma.followup.count({
        where: {
          status:      'PENDING',
          scheduledAt: { gte: today, lt: tomorrow },
          ...(isAdmin ? {} : { createdById: userId }),
        },
      }),

      prisma.followup.count({
        where: {
          status:      'PENDING',
          scheduledAt: { lt: today },
          ...(isAdmin ? {} : { createdById: userId }),
        },
      }),

      prisma.contact.count(),

      prisma.lead.count({
        where: {
          status: { in: ['CONFIRMED'] },
          isActive: true,
          ...userFilter,
        },
      }),

      prisma.lead.aggregate({
        _sum: { expectedValue: true },
        where: { isActive: true, status: { notIn: ['LOST'] }, ...userFilter },
      }),

      prisma.lead.aggregate({
        _sum: { expectedValue: true },
        where: { isActive: true, status: { in: ['CONFIRMED'] }, ...userFilter },
      }),

      prisma.task.count({
        where: {
          status: { in: ['TODO', 'IN_PROGRESS'] },
          ...(isAdmin ? {} : { assignedToId: userId }),
        },
      }),

      prisma.followup.count({
        where: {
          type:   'MEETING',
          status: 'PENDING',
          scheduledAt: { gte: new Date() },
          ...(isAdmin ? {} : { createdById: userId }),
        },
      }),
    ]);

    return {
      totalLeads,
      todayFollowups,
      overdueFollowups,
      totalContacts,
      confirmedLeads,
      expectedRevenue: expectedRevenue._sum.expectedValue || 0,
      closedRevenue:   closedRevenue._sum.expectedValue   || 0,
      pendingTasks,
      upcomingMeetings,
    };
  },

  /**
   * Monthly lead count for the last 6 months
   */
  getMonthlyGrowth: async () => {
    const rows = await prisma.$queryRaw`
      SELECT
        TO_CHAR("createdAt", 'Mon YYYY') AS month,
        COUNT(*) AS count
      FROM leads
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR("createdAt", 'Mon YYYY'), DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `;
    return rows.map((r) => ({ month: r.month, count: Number(r.count) }));
  },

  /**
   * Revenue by month for last 6 months
   */
  getRevenueChart: async () => {
    const rows = await prisma.$queryRaw`
      SELECT
        TO_CHAR("createdAt", 'Mon YYYY') AS month,
        SUM("expectedValue") AS expected,
        SUM(CASE WHEN status = 'CONFIRMED' THEN "expectedValue" ELSE 0 END) AS confirmed
      FROM leads
      WHERE "createdAt" >= NOW() - INTERVAL '6 months' AND "isActive" = true
      GROUP BY TO_CHAR("createdAt", 'Mon YYYY'), DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `;
    return rows.map((r) => ({
      month:     r.month,
      expected:  Number(r.expected  || 0),
      confirmed: Number(r.confirmed || 0),
    }));
  },

  /**
   * Lead source distribution
   */
  getLeadSources: async () => {
    const rows = await prisma.$queryRaw`
      SELECT source, COUNT(*) AS count
      FROM leads
      WHERE "isActive" = true AND source IS NOT NULL
      GROUP BY source
      ORDER BY count DESC
    `;
    return rows.map((r) => ({ source: r.source, count: Number(r.count) }));
  },

  /**
   * Pipeline stage counts + values
   */
  getPipelineSummary: async () => {
    const rows = await prisma.lead.groupBy({
      by: ['status'],
      where: { isActive: true },
      _count: { id: true },
      _sum:   { expectedValue: true },
    });
    return rows.map((r) => ({
      status: r.status,
      count:  r._count.id,
      value:  r._sum.expectedValue || 0,
    }));
  },

  /**
   * Recent activities — last 10
   */
  getRecentActivities: async () =>
    prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        lead: { select: { id: true, leadNumber: true, organization: true } },
      },
    }),
};

module.exports = dashboardService;
