/**
 * Script untuk membuat user test dengan password yang sudah di-hash
 * Jalankan dengan: npx tsx scripts/create-test-user.ts
 * 
 * Install tsx jika belum: npm install -D tsx
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🚀 Membuat user test...\n');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // User 1: Admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: password123`);
    console.log(`   Role: ${admin.role}\n`);

    // User 2: Owner
    const owner = await prisma.user.upsert({
      where: { email: 'owner@example.com' },
      update: {},
      create: {
        name: 'Owner User',
        email: 'owner@example.com',
        password: hashedPassword,
        role: 'OWNER',
      },
    });

    console.log('✅ Owner user created:');
    console.log(`   Email: ${owner.email}`);
    console.log(`   Password: password123`);
    console.log(`   Role: ${owner.role}\n`);

    // User 3: Regular User
    const user = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        name: 'Regular User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'USER',
      },
    });

    console.log('✅ Regular user created:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: password123`);
    console.log(`   Role: ${user.role}\n`);

    console.log('🎉 Semua user test berhasil dibuat!');
    console.log('\n📝 Gunakan kredensial berikut untuk login:');
    console.log('   Admin: admin@example.com / password123');
    console.log('   Owner: owner@example.com / password123');
    console.log('   User:  user@example.com / password123');
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
