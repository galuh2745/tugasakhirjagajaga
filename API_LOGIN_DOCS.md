# API Login - Next.js App Router dengan Prisma & JWT

API authentication lengkap dengan login, logout, dan proteksi route menggunakan JWT.

## 📁 Struktur File

```
projecttuagsakhir/
├── lib/
│   ├── jwt.ts           # Helper untuk generate & verify JWT
│   └── prisma.ts        # Prisma client instance
├── app/
│   └── api/
│       └── auth/
│           ├── login/
│           │   └── route.ts    # POST /api/auth/login
│           ├── logout/
│           │   └── route.ts    # POST /api/auth/logout
│           └── me/
│               └── route.ts    # GET /api/auth/me
├── middleware.ts        # Route protection middleware
└── .env                 # Environment variables
```

## 🚀 Instalasi

Pastikan dependencies sudah terinstall:

```bash
npm install bcryptjs jsonwebtoken @prisma/client
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

## ⚙️ Konfigurasi

### 1. Environment Variables (.env)

```env
DATABASE_URL="mysql://root:@localhost:3306/db_cvaswisentosa"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
```

**PENTING:** Ganti `JWT_SECRET` dengan secret key yang kuat di production!

Generate secret key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Prisma Schema

Schema sudah sesuai dengan tabel `users`:
- `id` (BigInt)
- `name` (String)
- `email` (String, unique)
- `password` (String, hashed dengan bcrypt)
- `role` (Enum: ADMIN, OWNER, USER)

## 📝 API Endpoints

### 1. Login

**POST** `/api/auth/login`

Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Success response (200):
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "1",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Cookie yang di-set:
- Name: `auth-token`
- HTTP-only: `true`
- Secure: `true` (di production)
- SameSite: `lax`
- Max-Age: 7 hari

Error responses:
- `400`: Validation error (email/password kosong atau format salah)
- `401`: Email atau password salah
- `500`: Server error

### 2. Logout

**POST** `/api/auth/logout`

Success response (200):
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

Menghapus cookie `auth-token`.

### 3. Get Current User

**GET** `/api/auth/me`

Headers:
```
Cookie: auth-token=your-jwt-token
```

Success response (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "USER",
      "created_at": "2026-01-31T00:00:00.000Z"
    }
  }
}
```

Error responses:
- `401`: Token tidak ditemukan atau tidak valid
- `404`: User tidak ditemukan
- `500`: Server error

## 🔒 Middleware & Route Protection

File `middleware.ts` melindungi route berdasarkan:

1. **Protected paths** - Memerlukan login:
   - `/dashboard`
   - `/api/protected`

2. **Role-based paths** - Memerlukan role tertentu:
   - `/admin` & `/api/admin` → hanya `ADMIN`
   - `/owner` & `/api/owner` → `OWNER` atau `ADMIN`

Jika tidak authorized, user akan di-redirect ke:
- `/login` (dengan query param `?redirect=/original-path`)
- `/unauthorized` (jika role tidak sesuai)

### Custom Protected Route

Edit `middleware.ts` untuk menambah protected routes:

```typescript
const protectedPaths = ['/dashboard', '/api/protected', '/profile'];

const roleBasedPaths: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/manager': ['ADMIN', 'OWNER'],
};
```

## 🧪 Testing dengan cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

### Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

## 🔐 Security Features

✅ **Password hashing** dengan bcrypt  
✅ **JWT authentication** dengan expiration  
✅ **HTTP-only cookies** (tidak bisa diakses JavaScript)  
✅ **Secure cookies** di production (HTTPS only)  
✅ **Email validation** dengan regex  
✅ **Error handling** yang detail  
✅ **Input validation** untuk semua fields  
✅ **Role-based access control**  

## 📚 Cara Membuat User Baru

Karena password harus di-hash dengan bcrypt, gunakan script atau API untuk register:

```typescript
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

async function createUser() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'USER',
    },
  });
  
  console.log('User created:', user);
}
```

## 🚨 Catatan Penting

1. **Jangan commit file .env** ke git
2. **Ganti JWT_SECRET** di production dengan key yang kuat
3. **Password harus di-hash** sebelum disimpan ke database
4. **Gunakan HTTPS** di production untuk secure cookies
5. **Validasi input** selalu di server-side

## 📖 Next Steps

- [ ] Implementasi refresh token
- [ ] Rate limiting untuk login endpoint
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)

---

**Status:** ✅ Siap Produksi
