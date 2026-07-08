require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CFO user...');

  const password = await bcrypt.hash('Admin@1234', 12);

  // CFO user
  const cfo = await prisma.user.upsert({
    where: { email: 'cfo@a5xcrm.com' },
    update: { role: 'CFO' },
    create: {
      name: 'CFO User',
      email: 'cfo@a5xcrm.com',
      password,
      role: 'CFO',
      isActive: true,
    },
  });
  console.log('✅ CFO user:', cfo.email);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@a5xcrm.com' },
    update: { role: 'ADMIN' },
    create: {
      name: 'Admin User',
      email: 'admin@a5xcrm.com',
      password,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user:', admin.email);

  // Finance settings
  const existing = await prisma.financeSettings.findFirst();
  if (!existing) {
    await prisma.financeSettings.create({
      data: {
        companyName: 'A5X Technologies Pvt Ltd',
        companyEmail: 'accounts@a5xcrm.com',
        companyPhone: '+91 98765 43210',
        currency: 'INR',
        currencySymbol: '₹',
        invoicePrefix: 'INV',
        quotationPrefix: 'QT',
        purchaseOrderPrefix: 'PO',
        defaultTaxRate: 18,
        gstType: 'CGST_SGST',
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
      },
    });
    console.log('✅ Finance settings created');
  } else {
    console.log('✅ Finance settings already exist');
  }

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────');
  console.log('CFO Login:   cfo@a5xcrm.com   / Admin@1234');
  console.log('Admin Login: admin@a5xcrm.com / Admin@1234');
  console.log('─────────────────────────────────');
}

main().catch(console.error).finally(() => prisma.$disconnect());
