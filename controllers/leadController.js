const leadService = require('../services/leadService');
const R           = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');

exports.create = async (req, res, next) => {
  try {
    const lead = await leadService.create(req.body, req.user.id);
    R.created(res, lead, 'Lead created');
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const where    = leadService.buildWhereClause(req.query);
    const orderBy  = req.query.sortBy
      ? { [req.query.sortBy]: req.query.sortDir || 'asc' }
      : { createdAt: 'desc' };

    const [leads, total] = await Promise.all([
      leadService.getAll({ skip, take: limit, where, orderBy }),
      leadService.count(where),
    ]);

    R.paginated(res, leads, buildMeta(total, page, limit));
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const lead = await leadService.getById(req.params.id);
    R.success(res, lead);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const lead = await leadService.update(req.params.id, req.body, req.user.id);
    R.success(res, lead, 'Lead updated');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    await leadService.delete(req.params.id, req.user.id);
    R.success(res, null, 'Lead deleted');
  } catch (err) { next(err); }
};

exports.moveStage = async (req, res, next) => {
  try {
    const { status } = req.body;
    const lead = await leadService.moveStage(req.params.id, status, req.user.id);
    R.success(res, lead, 'Lead moved');
  } catch (err) { next(err); }
};

exports.addNote = async (req, res, next) => {
  try {
    const activity = await leadService.addNote(req.params.id, req.body.note, req.user.id);
    R.created(res, activity, 'Note added');
  } catch (err) { next(err); }
};

exports.getPipeline = async (req, res, next) => {
  try {
    const board = await leadService.getPipelineBoard();
    R.success(res, board);
  } catch (err) { next(err); }
};
