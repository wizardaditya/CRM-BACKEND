const prisma = require('../config/db');

/**
 * Generate the next sequential lead number: A5X-0001, A5X-0002 …
 */
const generateLeadNumber = async () => {
  const last = await prisma.lead.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { leadNumber: true },
  });

  if (!last || !last.leadNumber) return 'A5X-0001';

  const num = parseInt(last.leadNumber.replace('A5X-', ''), 10);
  return `A5X-${String(num + 1).padStart(4, '0')}`;
};

module.exports = { generateLeadNumber };
