# 📊 Database Seeding - CV Aswi Sentosa

Dokumentasi untuk seed data karyawan CV Aswi Sentosa ke database.

## 📁 File Seed

- **File:** [prisma/seed-raw.ts](prisma/seed-raw.ts)
- **Method:** Raw SQL dengan mysql2 (karena Prisma 7.x memerlukan adapter untuk seed script)

## 🎯 Data yang Di-seed

### 1. Jenis Karyawan (3 types)

| ID | Nama Jenis | Jam Masuk | Jam Pulang |
|----|------------|-----------|------------|
| 1  | Driver | 08:00 | 17:00 |
| 2  | Karyawan Tetap | 08:00 | 17:00 |
| 3  | Harian | 07:00 | 16:00 |

### 2. Karyawan & User (23 orang)

#### 🚗 Driver (5 orang)

| NIP | Nama | Status | Email |
|-----|------|--------|-------|
| DRV001 | Budi Santoso | AKTIF | budi.santoso@cvaswisentosa.com |
| DRV002 | Ahmad Yani | AKTIF | ahmad.yani@cvaswisentosa.com |
| DRV003 | Slamet Riyadi | AKTIF | slamet.riyadi@cvaswisentosa.com |
| DRV004 | Dedi Kurniawan | AKTIF | dedi.kurniawan@cvaswisentosa.com |
| DRV005 | Hendra Wijaya | NONAKTIF | hendra.wijaya@cvaswisentosa.com |

#### 👔 Karyawan Tetap (8 orang)

| NIP | Nama | Status | Email |
|-----|------|--------|-------|
| KRY001 | Siti Nurhaliza | AKTIF | siti.nurhaliza@cvaswisentosa.com |
| KRY002 | Rina Kusuma | AKTIF | rina.kusuma@cvaswisentosa.com |
| KRY003 | Bambang Sugiarto | AKTIF | bambang.sugiarto@cvaswisentosa.com |
| KRY004 | Dewi Anggraini | AKTIF | dewi.anggraini@cvaswisentosa.com |
| KRY005 | Eko Prasetyo | AKTIF | eko.prasetyo@cvaswisentosa.com |
| KRY006 | Fitri Handayani | AKTIF | fitri.handayani@cvaswisentosa.com |
| KRY007 | Gunawan Setiawan | AKTIF | gunawan.setiawan@cvaswisentosa.com |
| KRY008 | Hesti Wulandari | NONAKTIF | hesti.wulandari@cvaswisentosa.com |

#### 📅 Harian (10 orang)

| NIP | Nama | Status | Email |
|-----|------|--------|-------|
| HRN001 | Agus Salim | AKTIF | agus.salim@cvaswisentosa.com |
| HRN002 | Rudi Hartono | AKTIF | rudi.hartono@cvaswisentosa.com |
| HRN003 | Sri Mulyani | AKTIF | sri.mulyani@cvaswisentosa.com |
| HRN004 | Tono Sugianto | AKTIF | tono.sugianto@cvaswisentosa.com |
| HRN005 | Udin Setiawan | AKTIF | udin.setiawan@cvaswisentosa.com |
| HRN006 | Vina Safitri | AKTIF | vina.safitri@cvaswisentosa.com |
| HRN007 | Wahyu Hidayat | AKTIF | wahyu.hidayat@cvaswisentosa.com |
| HRN008 | Yuni Astuti | NONAKTIF | yuni.astuti@cvaswisentosa.com |
| HRN009 | Zainudin Rahman | AKTIF | zainudin.rahman@cvaswisentosa.com |
| HRN010 | Ani Yulianti | AKTIF | ani.yulianti@cvaswisentosa.com |

## 🚀 Cara Menjalankan Seed

### Metode 1: Menggunakan npm script (Recommended)

```bash
npm run db:seed
```

### Metode 2: Langsung dengan tsx

```bash
tsx prisma/seed-raw.ts
```

## 🔑 Kredensial Login

Semua karyawan memiliki akun user dengan:
- **Role:** USER
- **Password:** password123

Contoh login:
```
Email: budi.santoso@cvaswisentosa.com
Password: password123
```

## ✨ Fitur Seed Script

1. **Idempotent** - Aman dijalankan berulang kali (menggunakan `INSERT IGNORE` dan checking)
2. **Automatic User Creation** - Membuat user dummy otomatis untuk setiap karyawan
3. **Password Hashing** - Password di-hash dengan bcrypt
4. **Relational Data** - Menghubungkan karyawan dengan jenis_karyawan dan user
5. **Status Management** - Mendukung status AKTIF dan NONAKTIF

## 📊 Database Schema

```
users
├── id (BigInt, PK)
├── name
├── email (unique)
├── password (bcrypt hashed)
├── role (USER)
└── ...

jenis_karyawan
├── id (BigInt, PK)
├── nama_jenis
├── jam_masuk
├── jam_pulang
└── ...

karyawan
├── id (BigInt, PK)
├── user_id (FK → users.id)
├── nip (unique)
├── nama
├── alamat
├── no_hp
├── jenis_karyawan_id (FK → jenis_karyawan.id)
├── status (AKTIF/NONAKTIF)
└── ...
```

## 🔄 Reset & Re-seed

Jika ingin reset database dan seed ulang:

```bash
# ⚠️ HATI-HATI: Ini akan menghapus semua data!
npx prisma migrate reset

# Kemudian seed ulang
npm run db:seed
```

## 📝 Catatan Teknis

### Kenapa Raw SQL?

Prisma 7.x menggunakan arsitektur baru yang memerlukan database adapter untuk koneksi langsung. Karena complexity dari setup adapter, seed script menggunakan raw SQL dengan mysql2 driver yang lebih straightforward dan reliable.

### File seed.ts vs seed-raw.ts

- **seed.ts** - Versi Prisma Client (tidak berfungsi dengan Prisma 7.x tanpa adapter)
- **seed-raw.ts** - Versi Raw SQL (working solution, digunakan oleh npm script)

## 🐛 Troubleshooting

### Error: Can't connect to MySQL server

Pastikan MySQL server berjalan dan `DATABASE_URL` di `.env` benar.

```bash
# Check MySQL status
# Windows: Services → MySQL
# Linux/Mac: sudo systemctl status mysql
```

### Error: Table doesn't exist

Jalankan migrations terlebih dahulu:

```bash
npx prisma migrate dev
```

### Error: Duplicate entry

Seed script sudah handle duplicate, tapi jika ada error spesifik, coba reset database:

```bash
npx prisma migrate reset
npm run db:seed
```

## 📖 References

- [Prisma Seeding Documentation](https://www.prisma.io/docs/guides/migrate/seed-database)
- [MySQL2 Driver](https://github.com/sidorares/node-mysql2)
- [bcryptjs Documentation](https://www.npmjs.com/package/bcryptjs)

---

**Status:** ✅ Working & Tested  
**Last Updated:** 31 Januari 2026
