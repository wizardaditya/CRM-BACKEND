const prisma = require('../config/db');

const userRepository = {
  findByEmail: (email) =>
    prisma.user.findUnique({ where: { email } }),

  findById: (id) =>
    prisma.user.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    }),

  create: (data) => prisma.user.create({ data }),

  update: (id, data) =>
    prisma.user.update({ where: { id }, data }),

  findAll: ({ skip, take, where, orderBy }) =>
    prisma.user.findMany({
      skip, take, where,
      orderBy: orderBy || { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, avatar: true, phone: true,
        lastLogin: true, createdAt: true,
      },
    }),

  count: (where) => prisma.user.count({ where }),

  delete: (id) => prisma.user.delete({ where: { id } }),
};

module.exports = userRepository;
