require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Checking database data...\n');

  // Check users
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true }
  });
  console.log('👥 Users:', users.length);
  users.forEach(user => {
    console.log(`   - ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
  });

  // Check leads
  const leads = await prisma.lead.findMany({
    select: { id: true, organization: true, status: true, createdAt: true }
  });
  console.log('\n📊 Leads:', leads.length);
  leads.slice(0, 5).forEach(lead => {
    console.log(`   - ${lead.organization} - ${lead.status} - ${lead.createdAt.toDateString()}`);
  });

  // Check contacts
  const contacts = await prisma.contact.count();
  console.log('\n👤 Contacts:', contacts);

  // Check tasks
  const tasks = await prisma.task.count();
  console.log('✅ Tasks:', tasks);

  // Check activities
  const activities = await prisma.activity.count();
  console.log('🔔 Activities:', activities);

  console.log('\n✅ Data check complete!');
}

checkData().catch(console.error).finally(() => prisma.$disconnect());