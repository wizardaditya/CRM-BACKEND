const prisma = require('../config/db');

const activityRepository = {
  create: (data) =>
    prisma.activity.create({
      data,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    }),

  findByLead: (leadId, { skip = 0, take = 50 } = {}) =>
    prisma.activity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      skip, take,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    }),

  countByLead: (leadId) =>
    prisma.activity.count({ where: { leadId } }),
};

module.exports = activityRepository;
