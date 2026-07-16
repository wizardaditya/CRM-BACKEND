require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickRecover() {
  console.log('🚨 EMERGENCY DATA RECOVERY...\n');

  try {
    // Check if there are any tables with different names
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%lead%'
      ORDER BY table_name;
    `;
    
    console.log('📋 Lead-related tables:');
    console.log(result);

    // Check if there are any records in leads table with different filters
    const allLeads = await prisma.$queryRaw`SELECT COUNT(*) as count FROM leads`;
    console.log('\n📊 Total leads (raw query):', allLeads[0]?.count || 0);

    // Check if leads exist but are marked as inactive
    const inactiveLeads = await prisma.lead.count({ where: { isActive: false } });
    console.log('🔒 Inactive leads:', inactiveLeads);

    // Check all leads regardless of status
    const totalLeads = await prisma.lead.count();
    console.log('📈 Total leads (Prisma):', totalLeads);

    // Check recent activity in case data was recently deleted
    const recentActivities = await prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { type: true, description: true, createdAt: true }
    });
    
    console.log('\n🔔 Recent activities:');
    recentActivities.forEach(activity => {
      console.log(`   ${activity.createdAt.toISOString()} - ${activity.type}: ${activity.description}`);
    });

  } catch (error) {
    console.error('❌ Recovery check failed:', error.message);
  }
}

quickRecover().catch(console.error).finally(() => prisma.$disconnect());