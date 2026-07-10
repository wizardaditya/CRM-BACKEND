/**
 * Extract pagination params from request query
 * Defaults: page=1, limit=25, max limit=100
 */
const getPagination = (query) => {
  const page  = Math.max(1, parseInt(query.page  || '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '25', 10)));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build pagination meta object
 */
const buildMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

module.exports = { getPagination, buildMeta };
