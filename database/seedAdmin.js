/**
 * seedAdmin.js — Run this once on production to create the default admin user
 * Usage: node database/seedAdmin.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin user for main CRM...');

  const password = await bcrypt.hash('Admin@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@a5xcrm.in' },
    update: { isActive: true },
    create: {
      name:     'A5X Admin',
      email:    'admin@a5xcrm.in',
      password,
      role:     'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin user:', admin.email);
  console.log('─────────────────────────────────');
  console.log('Login Email:    admin@a5xcrm.in');
  console.log('Login Password: Admin@1234');
  console.log('─────────────────────────────────');
}

main().catch(console.error).finally(() => prisma.$disconnect());
