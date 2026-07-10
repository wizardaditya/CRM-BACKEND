const taskRepository  = require('../repositories/taskRepository');
const activityRepository = require('../repositories/activityRepository');
const notificationRepository = require('../repositories/notificationRepository');
const R = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');

exports.create = async (req, res, next) => {
  try {
    const toDateTime = (v) => v ? (String(v).includes('T') ? new Date(v) : new Date(`${v}T00:00:00.000Z`)) : undefined;
    const task = await taskRepository.create({
      ...req.body,
      dueDate:     toDateTime(req.body.dueDate),
      reminder:    toDateTime(req.body.reminder),
      createdById: req.user.id,
    });

    if (task.leadId) {
      await activityRepository.create({
        type: 'TASK', description: `Task created: ${task.title}`,
        leadId: task.leadId, taskId: task.id, userId: req.user.id,
      });
    }

    if (task.assignedToId && task.assignedToId !== req.user.id) {
      await notificationRepository.create({
        userId:  task.assignedToId,
        title:   'Task Assigned',
        message: `You have been assigned: "${task.title}"`,
        type:    'task_assigned',
        link:    `/tasks/${task.id}`,
      });
    }

    R.created(res, task, 'Task created');
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const where = {};
    if (req.query.status)     where.status      = req.query.status;
    if (req.query.priority)   where.priority     = req.query.priority;
    if (req.query.assignedTo) where.assignedToId = req.query.assignedTo;
    if (req.query.leadId)     where.leadId       = req.query.leadId;

    const [tasks, total] = await Promise.all([
      taskRepository.findAll({ skip, take: limit, where }),
      taskRepository.count(where),
    ]);
    R.paginated(res, tasks, buildMeta(total, page, limit));
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const task = await taskRepository.findById(req.params.id);
    if (!task) return R.notFound(res, 'Task not found');
    R.success(res, task);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await taskRepository.findById(req.params.id);
    if (!existing) return R.notFound(res, 'Task not found');

    const data = { ...req.body };
    if (data.status === 'COMPLETED' && !existing.completedAt) {
      data.completedAt = new Date();
    }

    const task = await taskRepository.update(req.params.id, data);
    R.success(res, task, 'Task updated');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    await taskRepository.delete(req.params.id);
    R.success(res, null, 'Task deleted');
  } catch (err) { next(err); }
};

exports.addComment = async (req, res, next) => {
  try {
    const comment = await taskRepository.addComment({
      taskId:   req.params.id,
      authorId: req.user.id,
      content:  req.body.content,
    });
    R.created(res, comment, 'Comment added');
  } catch (err) { next(err); }
};
