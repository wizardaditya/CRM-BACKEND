const prisma = require('../config/db');
const R = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');

exports.create = async (req, res, next) => {
  try {
    const contact = await prisma.contact.create({
      data: req.body,
      include: { lead: { select: { id: true, leadNumber: true, organization: true } } },
    });
    R.created(res, contact, 'Contact created');
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const where = {};
    if (req.query.leadId)    where.leadId    = req.query.leadId;
    if (req.query.companyId) where.companyId = req.query.companyId;
    if (req.query.search) {
      where.OR = [
        { firstName:   { contains: req.query.search, mode: 'insensitive' } },
        { lastName:    { contains: req.query.search, mode: 'insensitive' } },
        { email:       { contains: req.query.search, mode: 'insensitive' } },
        { mobile:      { contains: req.query.search, mode: 'insensitive' } },
        { designation: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        skip, take: limit, where,
        orderBy: { createdAt: 'desc' },
        include: {
          lead:    { select: { id: true, leadNumber: true, organization: true } },
          company: { select: { id: true, name: true } },
        },
      }),
      prisma.contact.count({ where }),
    ]);
    R.paginated(res, contacts, buildMeta(total, page, limit));
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        lead:    true,
        company: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!contact) return R.notFound(res);
    R.success(res, contact);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data:  req.body,
    });
    R.success(res, contact, 'Contact updated');
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    await prisma.contact.delete({ where: { id: req.params.id } });
    R.success(res, null, 'Contact deleted');
  } catch (err) { next(err); }
};
