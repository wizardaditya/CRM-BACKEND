require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deepSearch() {
  console.log('🔍 DEEP SEARCH for your original 130+ leads...\n');
  
  try {
    // Check if there are any records in any table that might contain lead data
    console.log('🔍 Searching ALL tables for any data...');
    
    const allTableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename, 
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;
    
    console.log('📊 Table sizes:');
    allTableSizes.forEach(table => {
      console.log(`   ${table.tablename}: ${table.size}`);
    });
    
    // Check for any tables with substantial data
    const largestTable = allTableSizes[0];
    if (largestTable && largestTable.bytes > 1000) {
      console.log(`\n🔍 Largest table is: ${largestTable.tablename} (${largestTable.size})`);
      
      // If it's not leads, maybe data was moved there
      if (largestTable.tablename !== 'leads') {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${largestTable.tablename}`;
        console.log(`   Records in ${largestTable.tablename}: ${count[0]?.count || 0}`);
      }
    }
    
    // Check if there are any migration logs or history
    console.log('\n🔍 Checking migration history...');
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at 
      FROM _prisma_migrations 
      ORDER BY started_at DESC 
      LIMIT 10;
    `;
    
    console.log('📝 Recent migrations:');
    migrations.forEach(migration => {
      console.log(`   ${migration.started_at}: ${migration.migration_name}`);
    });
    
    // Check auth.users table - maybe your leads are linked there somehow
    console.log('\n🔍 Checking auth schema...');
    try {
      const authUsers = await prisma.$queryRaw`SELECT COUNT(*) as count FROM auth.users`;
      console.log(`👥 Auth users: ${authUsers[0]?.count || 0}`);
    } catch (e) {
      console.log('❌ Cannot access auth schema');
    }
    
  } catch (error) {
    console.error('❌ Deep search failed:', error.message);
  }
  
  console.log('\n🚨 URGENT: Check your Supabase dashboard for:');
  console.log('   1. Point-in-time recovery/backups');
  console.log('   2. Database logs');
  console.log('   3. SQL Editor to manually query for data');
}

deepSearch().catch(console.error).finally(() => prisma.$disconnect());