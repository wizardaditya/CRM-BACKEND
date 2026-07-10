const prisma = require('../config/db');

const notificationRepository = {
  create: (data) => prisma.notification.create({ data }),

  createMany: (dataArray) =>
    prisma.notification.createMany({ data: dataArray }),

  findByUser: (userId, { skip = 0, take = 20 } = {}) =>
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip, take,
    }),

  countUnread: (userId) =>
    prisma.notification.count({ where: { userId, isRead: false } }),

  markRead: (id, userId) =>
    prisma.notification.update({
      where: { id },
      data: { isRead: true },
    }),

  markAllRead: (userId) =>
    prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    }),
};

module.exports = notificationRepository;
