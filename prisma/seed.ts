/**
 * Prisma Seed Script - CV Aswi Sentosa
 * 
 * Seed data untuk:
 * - JenisKaryawan (Driver, Karyawan Tetap, Harian)
 * - User (dummy users untuk karyawan)
 * - Karyawan (data karyawan CV Aswi Sentosa)
 * 
 * Cara menjalankan:
 * npm run db:seed
 */

import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Mulai seeding database...\n');

  // Hash password untuk semua user dummy
  const defaultPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // ========================================
  // 0. SEED ADMIN USER
  // ========================================
  console.log('👤 Seeding Admin User...');
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@admin.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('  ✅ Admin: admin@admin.com / admin123\n');

  // ========================================
  // 1. SEED JENIS KARYAWAN
  // ========================================
  console.log('📋 Seeding JenisKaryawan...');

  const jenisDriver = await prisma.jenisKaryawan.upsert({
    where: { id: 1n },
    update: { toleransi_terlambat: 15 },
    create: {
      id: 1n,
      nama_jenis: 'Driver',
      jam_masuk: new Date('2000-01-01T08:00:00'),
      jam_pulang: new Date('2000-01-01T17:00:00'),
      toleransi_terlambat: 15,
    },
  });
  console.log('  ✅ Driver');

  const jenisKaryawanTetap = await prisma.jenisKaryawan.upsert({
    where: { id: 2n },
    update: { toleransi_terlambat: 15 },
    create: {
      id: 2n,
      nama_jenis: 'Karyawan Tetap',
      jam_masuk: new Date('2000-01-01T08:00:00'),
      jam_pulang: new Date('2000-01-01T17:00:00'),
      toleransi_terlambat: 15,
    },
  });
  console.log('  ✅ Karyawan Tetap');

  const jenisHarian = await prisma.jenisKaryawan.upsert({
    where: { id: 3n },
    update: { toleransi_terlambat: 10 },
    create: {
      id: 3n,
      nama_jenis: 'Harian',
      jam_masuk: new Date('2000-01-01T07:00:00'),
      jam_pulang: new Date('2000-01-01T16:00:00'),
      toleransi_terlambat: 10,
    },
  });
  console.log('  ✅ Harian');

  // Tambah jenis karyawan baru
  const jenisSupir = await prisma.jenisKaryawan.upsert({
    where: { id: 4n },
    update: { toleransi_terlambat: 30 },
    create: {
      id: 4n,
      nama_jenis: 'Supir',
      jam_masuk: new Date('2000-01-01T06:00:00'),
      jam_pulang: new Date('2000-01-01T18:00:00'),
      toleransi_terlambat: 30,
    },
  });
  console.log('  ✅ Supir');

  const jenisKurir = await prisma.jenisKaryawan.upsert({
    where: { id: 5n },
    update: { toleransi_terlambat: 15 },
    create: {
      id: 5n,
      nama_jenis: 'Kurir',
      jam_masuk: new Date('2000-01-01T07:00:00'),
      jam_pulang: new Date('2000-01-01T17:00:00'),
      toleransi_terlambat: 15,
    },
  });
  console.log('  ✅ Kurir\n');

  // ========================================
  // 2. DATA KARYAWAN CV ASWI SENTOSA
  // ========================================
  console.log('👥 Seeding Karyawan...\n');

  const karyawanData = [
    // DRIVER
    {
      nip: 'DRV001',
      nama: 'Budi Santoso',
      alamat: 'Jl. Mawar No. 12, Surabaya',
      no_hp: '081234567801',
      jenis_karyawan_id: jenisDriver.id,
      status: 'AKTIF' as const,
      email: 'budi.santoso@cvaswisentosa.com',
    },
    {
      nip: 'DRV002',
      nama: 'Ahmad Yani',
      alamat: 'Jl. Melati No. 45, Surabaya',
      no_hp: '081234567802',
      jenis_karyawan_id: jenisDriver.id,
      status: 'AKTIF' as const,
      email: 'ahmad.yani@cvaswisentosa.com',
    },
    {
      nip: 'DRV003',
      nama: 'Slamet Riyadi',
      alamat: 'Jl. Anggrek No. 78, Sidoarjo',
      no_hp: '081234567803',
      jenis_karyawan_id: jenisDriver.id,
      status: 'AKTIF' as const,
      email: 'slamet.riyadi@cvaswisentosa.com',
    },
    {
      nip: 'DRV004',
      nama: 'Dedi Kurniawan',
      alamat: 'Jl. Kenanga No. 23, Surabaya',
      no_hp: '081234567804',
      jenis_karyawan_id: jenisDriver.id,
      status: 'AKTIF' as const,
      email: 'dedi.kurniawan@cvaswisentosa.com',
    },
    {
      nip: 'DRV005',
      nama: 'Hendra Wijaya',
      alamat: 'Jl. Dahlia No. 56, Gresik',
      no_hp: '081234567805',
      jenis_karyawan_id: jenisDriver.id,
      status: 'NONAKTIF' as const,
      email: 'hendra.wijaya@cvaswisentosa.com',
    },

    // KARYAWAN TETAP
    {
      nip: 'KRY001',
      nama: 'Siti Nurhaliza',
      alamat: 'Jl. Flamboyan No. 89, Surabaya',
      no_hp: '081234567806',
      jenis_karyawan_id: jenisKaryawanTetap.id,
      status: 'AKTIF' as const,
      email: 'siti.nurhaliza@cvaswisentosa.com',
    },
    {
      nip: 'KRY002',
      nama: 'Rina Kusuma',
      alamat: 'Jl. Teratai No. 34, Surabaya',
      no_hp: '081234567807',
      jenis_karyawan_id: jenisKaryawanTetap.id,
      status: 'AKTIF' as const,
      email: 'rina.kusuma@cvaswisentosa.com',
    },
    {
      nip: 'KRY003',
      nama: 'Bambang Sugiarto',
      alamat: 'Jl. Cempaka No. 67, Sidoarjo',
      no_hp: '081234567808',
      jenis_karyawan_id: jenisKaryawanTetap.id,
      status: 'AKTIF' as const,
      email: 'bambang.sugiarto@cvaswisentosa.com',
    },
    {
      nip: 'KRY004',
      nama: 'Dewi Anggraini',
      alamat: 'Jl. Kamboja No. 91, Surabaya',
      no_hp: '081234567809',
      jenis_karyawan_id: jenisKaryawanTetap.id,
      status: 'AKTIF' as const,
      email: 'dewi.anggraini@cvaswisentosa.com',
    },
    {
      nip: 'KRY005',
      nama: 'Eko Prasetyo',
      alamat: 'Jl. Sakura No. 12, Surabaya',
      no_hp: '081234567810',
      jenis_karyawan_id: jenisKaryawanTetap.id,
      status: 'AKTIF' as const,
      email: 'eko.prasetyo@cvaswisentosa.com',
    },
    {
      nip: 'KRY006',
      nama: 'Fitri Handayani',
      alamat: 'Jl. Tulip No. 45, Gresik',
      no_hp: '081234567811',
      jenis_karyawan_id: jenisKaryawanTetap.id,
      status: 'AKTIF' as const,
      email: 'fitri.handayani@cvaswisentosa.com',
    },
    {
      nip: 'KRY007',
      nama: 'Gunawan Setiawan',
      alamat: 'Jl. Bougenville No. 78, Surabaya',
      no_hp: '081234567812',
      jenis_karyawan_id: jenisKaryawanTetap.id,
      status: 'AKTIF' as const,
      email: 'gunawan.setiawan@cvaswisentosa.com',
    },
    {
      nip: 'KRY008',
      nama: 'Hesti Wulandari',
      alamat: 'Jl. Lavender No. 23, Sidoarjo',
      no_hp: '081234567813',
      jenis_karyawan_id: jenisKaryawanTetap.id,
      status: 'NONAKTIF' as const,
      email: 'hesti.wulandari@cvaswisentosa.com',
    },

    // HARIAN
    {
      nip: 'HRN001',
      nama: 'Agus Salim',
      alamat: 'Jl. Kemuning No. 56, Surabaya',
      no_hp: '081234567814',
      jenis_karyawan_id: jenisHarian.id,
      status: 'AKTIF' as const,
      email: 'agus.salim@cvaswisentosa.com',
    },
    {
      nip: 'HRN002',
      nama: 'Rudi Hartono',
      alamat: 'Jl. Kenari No. 89, Surabaya',
      no_hp: '081234567815',
      jenis_karyawan_id: jenisHarian.id,
      status: 'AKTIF' as const,
      email: 'rudi.hartono@cvaswisentosa.com',
    },
    {
      nip: 'HRN003',
      nama: 'Sri Mulyani',
      alamat: 'Jl. Seroja No. 34, Gresik',
      no_hp: '081234567816',
      jenis_karyawan_id: jenisHarian.id,
      status: 'AKTIF' as const,
      email: 'sri.mulyani@cvaswisentosa.com',
    },
    {
      nip: 'HRN004',
      nama: 'Tono Sugianto',
      alamat: 'Jl. Palem No. 67, Sidoarjo',
      no_hp: '081234567817',
      jenis_karyawan_id: jenisHarian.id,
      status: 'AKTIF' as const,
      email: 'tono.sugianto@cvaswisentosa.com',
    },
    {
      nip: 'HRN005',
      nama: 'Udin Setiawan',
      alamat: 'Jl. Cemara No. 91, Surabaya',
      no_hp: '081234567818',
      jenis_karyawan_id: jenisHarian.id,
      status: 'AKTIF' as const,
      email: 'udin.setiawan@cvaswisentosa.com',
    },
    {
      nip: 'HRN006',
      nama: 'Vina Safitri',
      alamat: 'Jl. Beringin No. 12, Surabaya',
      no_hp: '081234567819',
      jenis_karyawan_id: jenisHarian.id,
      status: 'AKTIF' as const,
      email: 'vina.safitri@cvaswisentosa.com',
    },
    {
      nip: 'HRN007',
      nama: 'Wahyu Hidayat',
      alamat: 'Jl. Jati No. 45, Gresik',
      no_hp: '081234567820',
      jenis_karyawan_id: jenisHarian.id,
      status: 'AKTIF' as const,
      email: 'wahyu.hidayat@cvaswisentosa.com',
    },
    {
      nip: 'HRN008',
      nama: 'Yuni Astuti',
      alamat: 'Jl. Akasia No. 78, Surabaya',
      no_hp: '081234567821',
      jenis_karyawan_id: jenisHarian.id,
      status: 'NONAKTIF' as const,
      email: 'yuni.astuti@cvaswisentosa.com',
    },
    {
      nip: 'HRN009',
      nama: 'Zainudin Rahman',
      alamat: 'Jl. Mahoni No. 23, Sidoarjo',
      no_hp: '081234567822',
      jenis_karyawan_id: jenisHarian.id,
      status: 'AKTIF' as const,
      email: 'zainudin.rahman@cvaswisentosa.com',
    },
    {
      nip: 'HRN010',
      nama: 'Ani Yulianti',
      alamat: 'Jl. Pinus No. 56, Surabaya',
      no_hp: '081234567823',
      jenis_karyawan_id: jenisHarian.id,
      status: 'AKTIF' as const,
      email: 'ani.yulianti@cvaswisentosa.com',
    },
  ];

  // Create users and karyawan
  for (const data of karyawanData) {
    // Create user dummy
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        name: data.nama,
        email: data.email,
        password: defaultPassword,
        role: 'USER',
      },
    });

    // Create karyawan
    await prisma.karyawan.upsert({
      where: { nip: data.nip },
      update: {},
      create: {
        user_id: user.id,
        nip: data.nip,
        nama: data.nama,
        alamat: data.alamat,
        no_hp: data.no_hp,
        jenis_karyawan_id: data.jenis_karyawan_id,
        status: data.status,
      },
    });

    console.log(`  ✅ ${data.nip} - ${data.nama} (${data.status})`);
  }

  console.log('\n🎉 Seeding selesai!');
  console.log('\n📊 Summary:');
  console.log(`  - JenisKaryawan: 3 types`);
  console.log(`  - Users: ${karyawanData.length} users`);
  console.log(`  - Karyawan: ${karyawanData.length} karyawan`);
  console.log(`    • Driver: 5 orang (4 aktif, 1 nonaktif)`);
  console.log(`    • Karyawan Tetap: 8 orang (7 aktif, 1 nonaktif)`);
  console.log(`    • Harian: 10 orang (8 aktif, 2 nonaktif)`);
  console.log('\n🔑 Default password untuk semua user: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
