require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkDatabase(url, name) {
  console.log(`\n🔍 Checking ${name}...`);
  console.log(`URL: ${url.replace(/:[^:]*@/, ':****@')}`);
  
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url } }
    });
    
    await prisma.$connect();
    
    // Check leads count
    const leadsCount = await prisma.lead.count();
    console.log(`📊 Leads: ${leadsCount}`);
    
    if (leadsCount > 0) {
      const sampleLeads = await prisma.lead.findMany({
        take: 3,
        select: { organization: true, status: true, createdAt: true }
      });
      console.log('Sample leads:');
      sampleLeads.forEach(lead => {
        console.log(`   - ${lead.organization} (${lead.status})`);
      });
    }
    
    await prisma.$disconnect();
    return leadsCount;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return -1;
  }
}

async function main() {
  console.log('🔍 Checking all possible database connections...');
  
  // Current production URL
  const prodUrl = "postgresql://postgres.dftlddjmjusvqnczmdwv:Alpha%402509%4012@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
  await checkDatabase(prodUrl, "Current Production (Pooler)");
  
  // Direct connection (without pooler)
  const directUrl = "postgresql://postgres:Alpha%402509%4012@db.dftlddjmjusvqnczmdwv.supabase.co:5432/postgres";
  await checkDatabase(directUrl, "Direct Connection (No Pooler)");
  
  // Alternative URL format
  const altUrl = "postgresql://postgres.dftlddjmjusvqnczmdwv:Alpha%402509%4012@db.dftlddjmjusvqnczmdwv.supabase.co:5432/postgres";
  await checkDatabase(altUrl, "Alternative Format");
  
  console.log('\n✅ Database check complete!');
}

main().catch(console.error);