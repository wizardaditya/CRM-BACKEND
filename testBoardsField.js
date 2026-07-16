require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBoardsField() {
  console.log('🧪 Testing boards field...\n');
  
  try {
    // Get admin user
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@a5xcrm.in' } });
    
    // Create a test lead with boards field
    const testLead = await prisma.lead.create({
      data: {
        leadNumber: 'A5X-TEST-BOARDS',
        organization: 'Test School for Boards Field',
        contactPerson: 'Test Principal',
        designation: 'Principal',
        mobile: '9999999999',
        email: 'test@testschool.com',
        city: 'Jabalpur',
        state: 'Madhya Pradesh',
        country: 'India',
        industry: 'Education',
        source: 'Database',
        interestedService: 'Coding Program',
        boards: 'CBSE',  // This should work now
        status: 'NEW_LEAD',
        priority: 'MEDIUM',
        expectedValue: 50000,
        probability: 25,
        remarks: 'Test lead to verify boards field is working',
        createdById: adminUser?.id || null,
        isActive: true,
      }
    });
    
    console.log('✅ Test lead created successfully!');
    console.log(`📋 Lead: ${testLead.organization}`);
    console.log(`🏫 Board: ${testLead.boards}`);
    console.log(`🆔 Lead ID: ${testLead.id}`);
    
    // Now try to update the boards field
    const updatedLead = await prisma.lead.update({
      where: { id: testLead.id },
      data: { boards: 'ICSE' }
    });
    
    console.log(`\n✅ Board updated successfully from CBSE to ${updatedLead.boards}`);
    
    // Clean up - delete test lead
    await prisma.lead.delete({ where: { id: testLead.id } });
    console.log('🧹 Test lead cleaned up');
    
    console.log('\n🎉 BOARDS FIELD IS WORKING PERFECTLY!');
    console.log('✅ Create with boards: SUCCESS');
    console.log('✅ Update boards: SUCCESS');
    console.log('✅ Edit form should work now');
    
  } catch (error) {
    console.error('❌ Error testing boards field:', error.message);
  }
}

testBoardsField().catch(console.error).finally(() => prisma.$disconnect());