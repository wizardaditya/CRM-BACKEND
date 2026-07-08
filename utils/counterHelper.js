const { prisma } = require('../config/database');

/**
 * Generate the next sequential number for invoices, quotations, etc.
 * Format: PREFIX-YEAR-SEQUENCE  e.g. INV-2026-0001
 */
const generateNumber = async (type, prefix) => {
  const year = new Date().getFullYear();

  const counter = await prisma.financeCounter.upsert({
    where: { name: type },
    update: { current: { increment: 1 }, year },
    create: { name: type, prefix, current: 1, year },
  });

  if (counter.year !== year) {
    await prisma.financeCounter.update({
      where: { name: type },
      data: { current: 1, year },
    });
    return `${prefix}-${year}-0001`;
  }

  const seq = String(counter.current).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
};

module.exports = { generateNumber };
