# 🚀 Project Tugas Akhir - API Authentication

Proyek Next.js dengan Prisma MySQL dan JWT Authentication yang siap produksi.

## 📁 Struktur Folder

```
projecttuagsakhir/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── auth/
│   │       ├── login/           # POST /api/auth/login
│   │       ├── logout/          # POST /api/auth/logout
│   │       └── me/              # GET /api/auth/me
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/                         # Utility libraries
│   ├── jwt.ts                   # JWT helper functions
│   └── prisma.ts                # Prisma client instance
├── prisma/                      # Database schema & migrations
│   ├── schema.prisma
│   └── migrations/
├── scripts/                     # Utility scripts
│   └── create-test-user.ts      # Script untuk membuat user test
├── middleware.ts                # Route protection middleware
├── .env                         # Environment variables
├── .env.example                 # Environment variables template
├── test-login.html              # UI test untuk login API
└── API_LOGIN_DOCS.md            # Dokumentasi lengkap API

```

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** MySQL dengan Prisma ORM
- **Authentication:** JWT + HTTP-only cookies
- **Password Hashing:** bcryptjs
- **Language:** TypeScript
- **Styling:** Tailwind CSS

## 📦 Instalasi

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Setup Database

Edit [.env](.env) dan sesuaikan `DATABASE_URL`:

```env
DATABASE_URL="mysql://root:@localhost:3306/db_cvaswisentosa"
```

### 3. Generate JWT Secret (Penting!)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy hasil output dan paste ke [.env](.env):

```env
JWT_SECRET="hasil_generate_di_atas"
JWT_EXPIRES_IN="7d"
```

### 4. Run Prisma Migrations

```bash
npx prisma migrate dev
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Seed Database dengan Data Karyawan

```bash
npm run db:seed
```

Script ini akan membuat:
- 3 jenis karyawan (Driver, Karyawan Tetap, Harian)
- 23 karyawan CV Aswi Sentosa dengan user accounts
- Default password untuk semua karyawan: **password123**

Dokumentasi lengkap: [DATABASE_SEED_DOCS.md](DATABASE_SEED_DOCS.md)

### 7. (Optional) Buat User Admin/Owner

```bash
npm run db:create-users
```

Script ini akan membuat 3 user khusus untuk testing:
- **Admin:** admin@example.com / password123
- **Owner:** owner@example.com / password123
- **User:** user@example.com / password123

## 🚀 Menjalankan Aplikasi

### Development Mode

```bash
npm run dev
```

Aplikasi akan berjalan di: http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

## 🧪 Testing API

### Opsi 1: Menggunakan Test UI (Mudah)

1. Jalankan development server: `npm run dev`
2. Buka [test-login.html](test-login.html) di browser
3. Klik tombol "Quick Login" atau masukkan kredensial manual
4. Test endpoint login, logout, dan get user

### Opsi 2: Menggunakan cURL

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

**Get Current User:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

**Logout:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

### Opsi 3: Menggunakan Postman/Insomnia

Lihat dokumentasi lengkap di [API_LOGIN_DOCS.md](API_LOGIN_DOCS.md)

## 🔐 Fitur Authentication

✅ **Login dengan email & password**  
✅ **Password hashing dengan bcrypt**  
✅ **JWT token dengan expiration**  
✅ **HTTP-only cookies untuk keamanan**  
✅ **Role-based access control (ADMIN, OWNER, USER)**  
✅ **Middleware untuk protected routes**  
✅ **Error handling yang comprehensive**  
✅ **Input validation**  

## 📚 API Endpoints

| Method | Endpoint | Deskripsi | Auth Required |
|--------|----------|-----------|---------------|
| POST | `/api/auth/login` | Login user | ❌ |
| POST | `/api/auth/logout` | Logout user | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

Dokumentasi lengkap: [API_LOGIN_DOCS.md](API_LOGIN_DOCS.md)

## 🛡️ Route Protection

File [middleware.ts](middleware.ts) melindungi route berdasarkan authentication dan role:

```typescript
// Protected paths - memerlukan login
const protectedPaths = ['/dashboard', '/api/protected'];

// Role-based paths - memerlukan role tertentu
const roleBasedPaths = {
  '/admin': ['ADMIN'],
  '/owner': ['OWNER', 'ADMIN'],
};
```

## 🗄️ Database Schema

### Users Table

```prisma
model User {
  id         BigInt    @id @default(autoincrement())
  name       String    @db.VarChar(255)
  email      String    @unique @db.VarChar(255)
  password   String    @db.VarChar(255)  // bcrypt hashed
  role       Role      @default(USER)    // ADMIN, OWNER, USER
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
}
```

## 📝 Scripts

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Jalankan development server |
| `npm run build` | Build untuk production |
| `npm start` | Jalankan production server |
| `npm run lint` | Jalankan ESLint |
| `npm run db:seed` | Seed database dengan data karyawan CV Aswi Sentosa |
| `npm run db:create-users` | Buat user test (admin, owner, user) |

## 🔧 Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio (GUI database)
npx prisma studio

# Reset database (⚠️ HATI-HATI!)
npx prisma migrate reset
```

## 🚨 Catatan Keamanan

1. **JANGAN commit file `.env`** ke git (sudah ada di .gitignore)
2. **Ganti JWT_SECRET** di production dengan key yang kuat
3. **Gunakan HTTPS** di production untuk secure cookies
4. **Password harus di-hash** dengan bcrypt sebelum disimpan
5. **Validasi input** selalu di server-side
6. **Rate limiting** untuk mencegah brute force (TODO)

## 🐛 Troubleshooting

### Error: Cannot find module '@/lib/prisma'

Restart TypeScript server:
- VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- Atau reload VS Code window

### Error: P1001 Can't reach database server

Pastikan MySQL server berjalan dan DATABASE_URL di .env benar.

### Error: Invalid token

Token mungkin sudah expired atau JWT_SECRET berubah. Login ulang.

## 📖 Dokumentasi Lengkap

- [API Login Documentation](API_LOGIN_DOCS.md) - Dokumentasi detail API endpoints
- [Database Seeding](DATABASE_SEED_DOCS.md) - Dokumentasi seed data karyawan
- [Prisma Schema](prisma/schema.prisma) - Database schema lengkap

## 🤝 Kontribusi

Untuk menambah fitur atau memperbaiki bug, silakan buat pull request.

## 📄 License

MIT

---

**Status:** ✅ Siap Produksi  
**Last Updated:** 31 Januari 2026
