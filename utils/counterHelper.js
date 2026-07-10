const prisma = require("../config/db");

const generateNumber = async (type, prefix) => {
  const year = new Date().getFullYear();
  const counter = await prisma.financeCounter.upsert({
    where: { name: type },
    update: { current: { increment: 1 }, year },
    create: { name: type, prefix, current: 1, year },
  });
  if (counter.year !== year) {
    await prisma.financeCounter.update({ where: { name: type }, data: { current: 1, year } });
    return `${prefix}-${year}-0001`;
  }
  return `${prefix}-${year}-${String(counter.current).padStart(4, "0")}`;
};

module.exports = { generateNumber };