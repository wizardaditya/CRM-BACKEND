const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool optimization for production
  __internal: {
    engine: {
      connectTimeout: process.env.NODE_ENV === 'production' ? 5000 : 10000,
      queryTimeout: process.env.NODE_ENV === 'production' ? 10000 : 30000,
    },
  },
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;
