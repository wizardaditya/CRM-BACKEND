require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSampleData() {
  console.log('🚀 Creating sample data to test system...\n');

  try {
    // Ensure admin user exists
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@a5xcrm.in' }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found. Creating...');
      const hashedPassword = await bcrypt.hash('Admin@1234', 12);
      const newAdmin = await prisma.user.create({
        data: {
          name: 'A5X Admin',
          email: 'admin@a5xcrm.in',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        },
      });
      console.log('✅ Admin user created:', newAdmin.email);
    }

    // Create a few sample leads to test
    console.log('📊 Creating sample leads...');
    
    const sampleLeads = [
      {
        organization: 'ABC School',
        contactPerson: 'John Principal',
        mobile: '9876543210',
        email: 'john@abcschool.com',
        status: 'NEW_LEAD',
        priority: 'HIGH',
        boards: 'CBSE',
        leadNumber: 'A5X-TEST-001'
      },
      {
        organization: 'XYZ College',
        contactPerson: 'Jane Director',
        mobile: '9876543211',
        email: 'jane@xyzcollege.com',
        status: 'CONTACTED',
        priority: 'MEDIUM',
        boards: 'ICSE',
        leadNumber: 'A5X-TEST-002'
      },
      {
        organization: 'PQR Academy',
        contactPerson: 'Bob Manager',
        mobile: '9876543212',
        email: 'bob@pqracademy.com',
        status: 'IN_DISCUSSION',
        priority: 'LOW',
        boards: 'MP Board',
        leadNumber: 'A5X-TEST-003'
      }
    ];

    for (const leadData of sampleLeads) {
      const lead = await prisma.lead.create({
        data: leadData
      });
      console.log(`✅ Created lead: ${lead.organization}`);
    }

    console.log('\n🎉 Sample data created successfully!');
    console.log('Now you can test the system and see if data appears.');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  }
}

createSampleData().catch(console.error).finally(() => prisma.$disconnect());