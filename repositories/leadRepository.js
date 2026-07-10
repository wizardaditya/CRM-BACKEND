const prisma = require('../config/db');

const leadRepository = {
  create: (data) =>
    prisma.lead.create({
      data,
      include: { assignedTo: { select: { id: true, name: true, email: true } }, createdBy: { select: { id: true, name: true } } },
    }),

  findById: (id) =>
    prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy:  { select: { id: true, name: true } },
        contacts:   true,
        tasks:      { orderBy: { dueDate: 'asc' } },
        followups:  { orderBy: { scheduledAt: 'asc' } },
        activities: { orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatar: true } } } },
        files:      true,
        company:    true,
      },
    }),

  findAll: ({ skip, take, where, orderBy }) =>
    prisma.lead.findMany({
      skip, take, where,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        _count: { select: { tasks: true, followups: true, files: true } },
      },
    }),

  count: (where) => prisma.lead.count({ where }),

  update: (id, data) => {
    // Strip out relations, readonly fields & anything Prisma won't accept as scalar input
    const {
      id: _id,
      leadNumber,
      createdAt,
      updatedAt,
      assignedTo,
      createdBy,
      contacts,
      tasks,
      followups,
      activities,
      files,
      company,
      companyId,
      createdById,
      assignedToId,
      _count,
      ...scalars
    } = data;

    const cleanData = { ...scalars };

    // Wire up the relation properly
    if (assignedToId) {
      cleanData.assignedTo = { connect: { id: assignedToId } };
    }

    return prisma.lead.update({
      where: { id },
      data: cleanData,
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });
  },

  delete: (id) => prisma.lead.delete({ where: { id } }),

  // For pipeline board — group by status
  groupByStatus: async () => {
    const leads = await prisma.lead.findMany({
      where: { isActive: true },
      select: {
        id: true, leadNumber: true, organization: true,
        contactPerson: true, status: true, priority: true,
        expectedValue: true, probability: true,
        assignedTo: { select: { name: true, avatar: true } },
      },
    });
    // Group in JS (avoids Prisma groupBy limitation with relations)
    return leads.reduce((acc, lead) => {
      (acc[lead.status] = acc[lead.status] || []).push(lead);
      return acc;
    }, {});
  },
};

module.exports = leadRepository;
