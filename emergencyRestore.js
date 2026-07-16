require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function emergencyRestore() {
  console.log('🚨 EMERGENCY DATA RESTORATION...\n');
  
  try {
    // Check if there are any hidden tables or schemas
    const tables = await prisma.$queryRaw`
      SELECT schemaname, tablename, tableowner
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
      ORDER BY schemaname, tablename;
    `;
    
    console.log('📋 All available tables:');
    console.log(tables);
    
    // Check if there are any backup tables
    const backupTables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE tablename LIKE '%backup%' OR tablename LIKE '%old%' OR tablename LIKE '%bak%'
      OR tablename LIKE '%leads%';
    `;
    
    console.log('\n🔄 Backup/old tables:');
    console.log(backupTables);
    
    // Check if data exists but is soft-deleted or in different status
    const hiddenLeads = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM leads 
      WHERE 1=1;  -- Get all records regardless of status
    `;
    
    console.log('\n📊 Total records in leads table (including deleted):');
    console.log(hiddenLeads);
    
    // Check if there are any recent drops or truncates in logs
    console.log('\n🔍 Checking for recent schema changes...');
    
  } catch (error) {
    console.error('❌ Emergency restore failed:', error.message);
  }
}

emergencyRestore().catch(console.error).finally(() => prisma.$disconnect());