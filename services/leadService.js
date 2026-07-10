const leadRepository      = require('../repositories/leadRepository');
const activityRepository  = require('../repositories/activityRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { generateLeadNumber } = require('../utils/leadNumber');

/**
 * Convert a YYYY-MM-DD string to a full ISO DateTime.
 * Prisma DateTime fields require a full ISO-8601 string.
 */
const toDateTime = (val) => {
  if (!val) return undefined;
  // Already a full ISO string
  if (String(val).includes('T')) return new Date(val);
  // Date-only string like "2026-08-08" → convert to UTC midnight
  return new Date(`${val}T00:00:00.000Z`);
};

const leadService = {
  create: async (data, userId) => {
    const leadNumber = await generateLeadNumber();

    const lead = await leadRepository.create({
      ...data,
      leadNumber,
      createdById:       userId,
      assignedToId:      data.assignedToId || userId,
      // Convert date strings to proper DateTime
      expectedCloseDate: toDateTime(data.expectedCloseDate),
      lastContact:       toDateTime(data.lastContact),
      nextFollowup:      toDateTime(data.nextFollowup),
    });

    await activityRepository.create({
      type:        'NOTE',
      description: 'Lead created',
      leadId:      lead.id,
      userId,
    });

    // Notify assigned user if different from creator
    if (lead.assignedToId && lead.assignedToId !== userId) {
      await notificationRepository.create({
        userId:  lead.assignedToId,
        title:   'New Lead Assigned',
        message: `You have been assigned lead: ${lead.organization}`,
        type:    'lead_assigned',
        link:    `/leads/${lead.id}`,
      });
    }

    return lead;
  },

  getAll: async ({ skip, take, where, orderBy }) =>
    leadRepository.findAll({ skip, take, where, orderBy }),

  count: (where) => leadRepository.count(where),

  getById: async (id) => {
    const lead = await leadRepository.findById(id);
    if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });
    return lead;
  },

  update: async (id, data, userId) => {
    const existing = await leadRepository.findById(id);
    if (!existing) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

    // Convert date strings to proper DateTime objects
    const cleanData = {
      ...data,
      expectedCloseDate: toDateTime(data.expectedCloseDate),
      lastContact:       toDateTime(data.lastContact),
      nextFollowup:      toDateTime(data.nextFollowup),
    };

    const lead = await leadRepository.update(id, cleanData);

    // Log status change
    if (data.status && data.status !== existing.status) {
      await activityRepository.create({
        type:        'STATUS_CHANGE',
        description: `Status changed from "${existing.status}" to "${data.status}"`,
        leadId:      id,
        userId,
        metadata:    { from: existing.status, to: data.status },
      });
    } else {
      await activityRepository.create({
        type:        'NOTE',
        description: 'Lead updated',
        leadId:      id,
        userId,
      });
    }

    // Notify new assignee
    if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
      await notificationRepository.create({
        userId:  data.assignedToId,
        title:   'Lead Reassigned',
        message: `Lead "${existing.organization}" has been assigned to you`,
        type:    'lead_assigned',
        link:    `/leads/${id}`,
      });
    }

    return lead;
  },

  delete: async (id, userId) => {
    const existing = await leadRepository.findById(id);
    if (!existing) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });
    return leadRepository.delete(id);
  },

  getPipelineBoard: () => leadRepository.groupByStatus(),

  moveStage: async (id, newStatus, userId) => {
    return leadService.update(id, { status: newStatus }, userId);
  },

  addNote: async (leadId, note, userId) => {
    const lead = await leadRepository.findById(leadId);
    if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

    return activityRepository.create({
      type:        'NOTE',
      description: note,
      leadId,
      userId,
    });
  },

  buildWhereClause: (query) => {
    const where = { isActive: true };
    if (query.status)    where.status    = query.status;
    if (query.priority)  where.priority  = query.priority;
    if (query.assignedTo) where.assignedToId = query.assignedTo;
    if (query.city)      where.city      = { contains: query.city,  mode: 'insensitive' };
    if (query.source)    where.source    = query.source;

    if (query.minValue || query.maxValue) {
      where.expectedValue = {};
      if (query.minValue) where.expectedValue.gte = parseFloat(query.minValue);
      if (query.maxValue) where.expectedValue.lte = parseFloat(query.maxValue);
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to)   where.createdAt.lte = new Date(query.to);
    }

    if (query.search) {
      where.OR = [
        { organization:   { contains: query.search, mode: 'insensitive' } },
        { contactPerson:  { contains: query.search, mode: 'insensitive' } },
        { email:          { contains: query.search, mode: 'insensitive' } },
        { mobile:         { contains: query.search, mode: 'insensitive' } },
        { leadNumber:     { contains: query.search, mode: 'insensitive' } },
        { city:           { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  },
};

module.exports = leadService;
