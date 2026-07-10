const prisma = require('../config/db');

const taskRepository = {
  create: (data) =>
    prisma.task.create({
      data,
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        createdBy:  { select: { id: true, name: true } },
        lead:       { select: { id: true, leadNumber: true, organization: true } },
      },
    }),

  findById: (id) =>
    prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        createdBy:  { select: { id: true, name: true } },
        lead:       { select: { id: true, leadNumber: true, organization: true } },
        comments:   true,
      },
    }),

  findAll: ({ skip, take, where, orderBy }) =>
    prisma.task.findMany({
      skip, take, where,
      orderBy: orderBy || { dueDate: 'asc' },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        lead:       { select: { id: true, leadNumber: true, organization: true } },
        _count: { select: { comments: true } },
      },
    }),

  count: (where) => prisma.task.count({ where }),

  update: (id, data) =>
    prisma.task.update({ where: { id }, data }),

  delete: (id) => prisma.task.delete({ where: { id } }),

  addComment: (data) => prisma.taskComment.create({ data }),
};

module.exports = taskRepository;
