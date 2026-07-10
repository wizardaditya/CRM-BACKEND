const userRepository = require('../repositories/userRepository');
const R = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const where = {};
    if (req.query.role)   where.role     = req.query.role;
    if (req.query.search) {
      where.OR = [
        { name:  { contains: req.query.search, mode: 'insensitive' } },
        { email: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      userRepository.findAll({ skip, take: limit, where }),
      userRepository.count(where),
    ]);
    R.paginated(res, users, buildMeta(total, page, limit));
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.params.id);
    if (!user) return R.notFound(res, 'User not found');
    const { password, refreshToken, ...safeUser } = user;
    R.success(res, safeUser);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    // Prevent password change via this route
    const { password, refreshToken, ...data } = req.body;
    const user = await userRepository.update(req.params.id, data);
    R.success(res, user, 'User updated');
  } catch (err) { next(err); }
};

exports.deactivate = async (req, res, next) => {
  try {
    await userRepository.update(req.params.id, { isActive: false });
    R.success(res, null, 'User deactivated');
  } catch (err) { next(err); }
};

exports.getDropdown = async (req, res, next) => {
  try {
    const users = await userRepository.findAll({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    R.success(res, users);
  } catch (err) { next(err); }
};
