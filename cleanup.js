require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  await prisma.lead.deleteMany({
    where: {
      leadNumber: {
        startsWith: 'A5X-TEST'
      }
    }
  });
  
  console.log('✅ Test data cleaned');
  
  const count = await prisma.lead.count();
  console.log('📊 Remaining leads:', count);
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());