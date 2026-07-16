require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkProductionDB() {
  console.log('🔍 Checking PRODUCTION database for your 130+ leads...\n');
  
  // This is likely the production URL your deployed app is using
  const productionUrl = "postgresql://postgres.dftlddjmjusvqnczmdwv:Alpha%402509%4012@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
  
  try {
    console.log('🌐 Connecting to PRODUCTION database...');
    const prisma = new PrismaClient({
      datasources: { db: { url: productionUrl } }
    });
    
    await prisma.$connect();
    console.log('✅ Connected to production database!');
    
    // Count leads
    const leadCount = await prisma.lead.count();
    console.log(`\n🎉 LEADS FOUND: ${leadCount}`);
    
    if (leadCount > 0) {
      console.log('\n📋 Your leads are HERE! Showing first 10:');
      const leads = await prisma.lead.findMany({
        take: 10,
        select: { 
          leadNumber: true,
          organization: true, 
          contactPerson: true, 
          status: true, 
          mobile: true,
          createdAt: true 
        },
        orderBy: { createdAt: 'desc' }
      });
      
      leads.forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.leadNumber} - ${lead.organization} (${lead.contactPerson}) - ${lead.mobile} - ${lead.status}`);
      });
      
      console.log(`\n✅ FOUND YOUR DATA! Total: ${leadCount} leads`);
      console.log('🔄 Now switching your local .env to use the PRODUCTION database...');
    } else {
      console.log('❌ No leads found in production database either');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Production database check failed:', error.message);
    
    // Try alternative production URLs
    console.log('\n🔍 Trying alternative production database URLs...');
    
    const altUrls = [
      "postgresql://postgres:Alpha%402509%4012@db.dftlddjmjusvqnczmdwv.supabase.co:5432/postgres",
      "postgresql://postgres.dftlddjmjusvqnczmdwv:Alpha%402509%4012@db.dftlddjmjusvqnczmdwv.supabase.co:5432/postgres"
    ];
    
    for (let i = 0; i < altUrls.length; i++) {
      try {
        const altPrisma = new PrismaClient({
          datasources: { db: { url: altUrls[i] } }
        });
        
        await altPrisma.$connect();
        const altCount = await altPrisma.lead.count();
        console.log(`Database ${i + 1}: ${altCount} leads`);
        
        if (altCount > 100) {
          console.log(`🎉 FOUND YOUR DATA IN DATABASE ${i + 1}! ${altCount} leads`);
          console.log(`Correct URL: ${altUrls[i]}`);
        }
        
        await altPrisma.$disconnect();
      } catch (err) {
        console.log(`Database ${i + 1} failed: ${err.message}`);
      }
    }
  }
}

checkProductionDB().catch(console.error);