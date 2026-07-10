const followupRepository = require('../repositories/followupRepository');
const activityRepository = require('../repositories/activityRepository');
const R = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');

exports.create = async (req, res, next) => {
  try {
    const toDateTime = (v) => v ? (String(v).includes('T') ? new Date(v) : new Date(`${v}T00:00:00.000Z`)) : undefined;
    const followup = await followupRepository.create({
      ...req.body,
      scheduledAt: toDateTime(req.body.scheduledAt),
      completedAt: toDateTime(req.body.completedAt),
      createdById: req.user.id,
    });

    if (followup.leadId) {
      await activityRepository.create({
        type: 'FOLLOWUP',
        description: `Follow-up scheduled: ${followup.type} on ${new Date(followup.scheduledAt).toLocaleDateString('en-IN')}`,
        leadId:     followup.leadId,
        followupId: followup.id,
        userId:     req.user.id,
      });
    }

    R.created(res, followup, 'Follow-up scheduled');
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.type)   where.type   = req.query.type;
    if (req.query.leadId) where.leadId = req.query.leadId;

    const [followups, total] = await Promise.all([
      followupRepository.findAll({ skip, take: limit, where }),
      followupRepository.count(where),
    ]);
    R.paginated(res, followups, buildMeta(total, page, limit));
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const followup = await followupRepository.findById(req.params.id);
    if (!followup) return R.notFound(res);
    R.success(res, followup);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const followup = await followupRepository.update(req.params.id, req.body);
    R.success(res, followup, 'Follow-up updated');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    await followupRepository.delete(req.params.id);
    R.success(res, null, 'Follow-up deleted');
  } catch (err) { next(err); }
};

exports.getCalendar = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return R.error(res, 'start and end query params required', 400);
    const userId = ['ADMIN','CEO','SALES_MANAGER'].includes(req.user.role) ? null : req.user.id;
    const data = await followupRepository.findByDateRange(new Date(start), new Date(end), userId);
    R.success(res, data);
  } catch (err) { next(err); }
};
