const prisma = require('../config/db');

const followupRepository = {
  create: (data) =>
    prisma.followup.create({
      data,
      include: {
        lead:      { select: { id: true, leadNumber: true, organization: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),

  findById: (id) =>
    prisma.followup.findUnique({
      where: { id },
      include: {
        lead:      { select: { id: true, leadNumber: true, organization: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    }),

  findAll: ({ skip, take, where, orderBy }) =>
    prisma.followup.findMany({
      skip, take, where,
      orderBy: orderBy || { scheduledAt: 'asc' },
      include: {
        lead:      { select: { id: true, leadNumber: true, organization: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    }),

  count: (where) => prisma.followup.count({ where }),

  update: (id, data) =>
    prisma.followup.update({ where: { id }, data }),

  delete: (id) => prisma.followup.delete({ where: { id } }),

  // For calendar — range query
  findByDateRange: (start, end, userId) =>
    prisma.followup.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        ...(userId ? { createdById: userId } : {}),
      },
      include: { lead: { select: { id: true, leadNumber: true, organization: true } } },
    }),
};

module.exports = followupRepository;
