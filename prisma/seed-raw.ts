/**
 * Prisma Seed Script - CV Aswi Sentosa (Raw SQL Version)
 * 
 * Seed data untuk:
 * - JenisKaryawan (Driver, Karyawan Tetap, Harian)
 * - User (dummy users untuk karyawan)
 * - Karyawan (data karyawan CV Aswi Sentosa)
 * 
 * Cara menjalankan:
 * npm run db:seed
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Mulai seeding database...\n');

  // Create connection
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  try {
    // Hash password untuk semua user dummy
    const defaultPassword = await bcrypt.hash('password123', 10);

    // ========================================
    // 1. SEED JENIS KARYAWAN
    // ========================================
    console.log('📋 Seeding JenisKaryawan...');

    await connection.execute(`
      INSERT IGNORE INTO jenis_karyawan (id, nama_jenis, jam_masuk, jam_pulang, created_at, updated_at)
      VALUES 
        (1, 'Driver', '08:00:00', '17:00:00', NOW(), NOW()),
        (2, 'Karyawan Tetap', '08:00:00', '17:00:00', NOW(), NOW()),
        (3, 'Harian', '07:00:00', '16:00:00', NOW(), NOW())
    `);
    console.log('  ✅ Driver, Karyawan Tetap, Harian\n');

    // ========================================
    // 2. DATA KARYAWAN CV ASWI SENTOSA
    // ========================================
    console.log('👥 Seeding Karyawan...\n');

    const karyawanData = [
      // DRIVER
      { nip: 'DRV001', nama: 'Budi Santoso', alamat: 'Jl. Mawar No. 12, Surabaya', no_hp: '081234567801', jenis_karyawan_id: 1, status: 'AKTIF', email: 'budi.santoso@cvaswisentosa.com' },
      { nip: 'DRV002', nama: 'Ahmad Yani', alamat: 'Jl. Melati No. 45, Surabaya', no_hp: '081234567802', jenis_karyawan_id: 1, status: 'AKTIF', email: 'ahmad.yani@cvaswisentosa.com' },
      { nip: 'DRV003', nama: 'Slamet Riyadi', alamat: 'Jl. Anggrek No. 78, Sidoarjo', no_hp: '081234567803', jenis_karyawan_id: 1, status: 'AKTIF', email: 'slamet.riyadi@cvaswisentosa.com' },
      { nip: 'DRV004', nama: 'Dedi Kurniawan', alamat: 'Jl. Kenanga No. 23, Surabaya', no_hp: '081234567804', jenis_karyawan_id: 1, status: 'AKTIF', email: 'dedi.kurniawan@cvaswisentosa.com' },
      { nip: 'DRV005', nama: 'Hendra Wijaya', alamat: 'Jl. Dahlia No. 56, Gresik', no_hp: '081234567805', jenis_karyawan_id: 1, status: 'NONAKTIF', email: 'hendra.wijaya@cvaswisentosa.com' },

      // KARYAWAN TETAP
      { nip: 'KRY001', nama: 'Siti Nurhaliza', alamat: 'Jl. Flamboyan No. 89, Surabaya', no_hp: '081234567806', jenis_karyawan_id: 2, status: 'AKTIF', email: 'siti.nurhaliza@cvaswisentosa.com' },
      { nip: 'KRY002', nama: 'Rina Kusuma', alamat: 'Jl. Teratai No. 34, Surabaya', no_hp: '081234567807', jenis_karyawan_id: 2, status: 'AKTIF', email: 'rina.kusuma@cvaswisentosa.com' },
      { nip: 'KRY003', nama: 'Bambang Sugiarto', alamat: 'Jl. Cempaka No. 67, Sidoarjo', no_hp: '081234567808', jenis_karyawan_id: 2, status: 'AKTIF', email: 'bambang.sugiarto@cvaswisentosa.com' },
      { nip: 'KRY004', nama: 'Dewi Anggraini', alamat: 'Jl. Kamboja No. 91, Surabaya', no_hp: '081234567809', jenis_karyawan_id: 2, status: 'AKTIF', email: 'dewi.anggraini@cvaswisentosa.com' },
      { nip: 'KRY005', nama: 'Eko Prasetyo', alamat: 'Jl. Sakura No. 12, Surabaya', no_hp: '081234567810', jenis_karyawan_id: 2, status: 'AKTIF', email: 'eko.prasetyo@cvaswisentosa.com' },
      { nip: 'KRY006', nama: 'Fitri Handayani', alamat: 'Jl. Tulip No. 45, Gresik', no_hp: '081234567811', jenis_karyawan_id: 2, status: 'AKTIF', email: 'fitri.handayani@cvaswisentosa.com' },
      { nip: 'KRY007', nama: 'Gunawan Setiawan', alamat: 'Jl. Bougenville No. 78, Surabaya', no_hp: '081234567812', jenis_karyawan_id: 2, status: 'AKTIF', email: 'gunawan.setiawan@cvaswisentosa.com' },
      { nip: 'KRY008', nama: 'Hesti Wulandari', alamat: 'Jl. Lavender No. 23, Sidoarjo', no_hp: '081234567813', jenis_karyawan_id: 2, status: 'NONAKTIF', email: 'hesti.wulandari@cvaswisentosa.com' },

      // HARIAN
      { nip: 'HRN001', nama: 'Agus Salim', alamat: 'Jl. Kemuning No. 56, Surabaya', no_hp: '081234567814', jenis_karyawan_id: 3, status: 'AKTIF', email: 'agus.salim@cvaswisentosa.com' },
      { nip: 'HRN002', nama: 'Rudi Hartono', alamat: 'Jl. Kenari No. 89, Surabaya', no_hp: '081234567815', jenis_karyawan_id: 3, status: 'AKTIF', email: 'rudi.hartono@cvaswisentosa.com' },
      { nip: 'HRN003', nama: 'Sri Mulyani', alamat: 'Jl. Seroja No. 34, Gresik', no_hp: '081234567816', jenis_karyawan_id: 3, status: 'AKTIF', email: 'sri.mulyani@cvaswisentosa.com' },
      { nip: 'HRN004', nama: 'Tono Sugianto', alamat: 'Jl. Palem No. 67, Sidoarjo', no_hp: '081234567817', jenis_karyawan_id: 3, status: 'AKTIF', email: 'tono.sugianto@cvaswisentosa.com' },
      { nip: 'HRN005', nama: 'Udin Setiawan', alamat: 'Jl. Cemara No. 91, Surabaya', no_hp: '081234567818', jenis_karyawan_id: 3, status: 'AKTIF', email: 'udin.setiawan@cvaswisentosa.com' },
      { nip: 'HRN006', nama: 'Vina Safitri', alamat: 'Jl. Beringin No. 12, Surabaya', no_hp: '081234567819', jenis_karyawan_id: 3, status: 'AKTIF', email: 'vina.safitri@cvaswisentosa.com' },
      { nip: 'HRN007', nama: 'Wahyu Hidayat', alamat: 'Jl. Jati No. 45, Gresik', no_hp: '081234567820', jenis_karyawan_id: 3, status: 'AKTIF', email: 'wahyu.hidayat@cvaswisentosa.com' },
      { nip: 'HRN008', nama: 'Yuni Astuti', alamat: 'Jl. Akasia No. 78, Surabaya', no_hp: '081234567821', jenis_karyawan_id: 3, status: 'NONAKTIF', email: 'yuni.astuti@cvaswisentosa.com' },
      { nip: 'HRN009', nama: 'Zainudin Rahman', alamat: 'Jl. Mahoni No. 23, Sidoarjo', no_hp: '081234567822', jenis_karyawan_id: 3, status: 'AKTIF', email: 'zainudin.rahman@cvaswisentosa.com' },
      { nip: 'HRN010', nama: 'Ani Yulianti', alamat: 'Jl. Pinus No. 56, Surabaya', no_hp: '081234567823', jenis_karyawan_id: 3, status: 'AKTIF', email: 'ani.yulianti@cvaswisentosa.com' },
    ];

    // Create users and karyawan
    for (const data of karyawanData) {
      // Check if user already exists
      const [existingUser] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [data.email]
      );

      let userId;
      if ((existingUser as any[]).length > 0) {
        userId = (existingUser as any[])[0].id;
      } else {
        // Create user
        const [userResult] = await connection.execute(
          'INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [data.nama, data.email, defaultPassword, 'USER']
        );
        userId = (userResult as any).insertId;
      }

      // Check if karyawan already exists
      const [existingKaryawan] = await connection.execute(
        'SELECT id FROM karyawan WHERE nip = ?',
        [data.nip]
      );

      if ((existingKaryawan as any[]).length === 0) {
        // Create karyawan
        await connection.execute(
          'INSERT INTO karyawan (user_id, nip, nama, alamat, no_hp, jenis_karyawan_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [userId, data.nip, data.nama, data.alamat, data.no_hp, data.jenis_karyawan_id, data.status]
        );
      }

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
  } finally {
    await connection.end();
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  });
