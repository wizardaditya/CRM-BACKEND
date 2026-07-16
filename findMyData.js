require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function findMyData() {
  console.log('🔍 SEARCHING FOR YOUR 130+ LEADS...\n');
  
  // Try multiple database connection strings that might have your data
  const possibleDatabases = [
    // Current
    "postgresql://postgres:Alpha%402509%4012@db.dftlddjmjusvqnczmdwv.supabase.co:5432/postgres",
    // With pooler
    "postgresql://postgres.dftlddjmjusvqnczmdwv:Alpha%402509%4012@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
    // Different schema
    "postgresql://postgres:Alpha%402509%4012@db.dftlddjmjusvqnczmdwv.supabase.co:5432/postgres?schema=public",
    // Different encoding
    "postgresql://postgres:Alpha%402509%4012@db.dftlddjmjusvqnczmdwv.supabase.co:5432/postgres?sslmode=require",
  ];

  for (let i = 0; i < possibleDatabases.length; i++) {
    const dbUrl = possibleDatabases[i];
    console.log(`\n🔍 Checking database ${i + 1}...`);
    
    try {
      const prisma = new PrismaClient({
        datasources: { db: { url: dbUrl } }
      });
      
      await prisma.$connect();
      
      // Count leads
      const leadCount = await prisma.lead.count();
      console.log(`📊 Leads found: ${leadCount}`);
      
      if (leadCount > 10) {  // If we find substantial data
        console.log(`🎉 FOUND YOUR DATA! ${leadCount} leads in database ${i + 1}`);
        
        // Show sample leads
        const sampleLeads = await prisma.lead.findMany({
          take: 5,
          select: { 
            organization: true, 
            contactPerson: true, 
            status: true, 
            createdAt: true,
            leadNumber: true 
          },
          orderBy: { createdAt: 'desc' }
        });
        
        console.log('\nSample leads:');
        sampleLeads.forEach(lead => {
          console.log(`   ${lead.leadNumber} - ${lead.organization} (${lead.contactPerson}) - ${lead.status}`);
        });
        
        console.log(`\n✅ CORRECT DATABASE URL: ${dbUrl}`);
        break;
      }
      
      await prisma.$disconnect();
      
    } catch (error) {
      console.log(`❌ Database ${i + 1} failed: ${error.message}`);
    }
  }
  
  console.log('\n🔍 Search complete.');
}

findMyData().catch(console.error);