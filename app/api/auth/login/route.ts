import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';

/**
 * POST /api/auth/login
 * Login endpoint dengan validasi NIP, password, dan JWT generation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const { nip, password } = body;

    // Validasi input
    if (!nip || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'NIP dan password harus diisi',
        },
        { status: 400 }
      );
    }

    // 2. Cari user berdasarkan NIP melalui relasi karyawan
    const karyawan = await prisma.karyawan.findUnique({
      where: { nip: nip.trim() },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            password: true,
            role: true,
          },
        },
      },
    });

    // Jika bukan karyawan, cek apakah NIP cocok dengan admin/owner (by name)
    // Admin/Owner login tetap bisa pakai NIP atau nama
    let user = karyawan?.user;

    if (!user) {
      // Fallback: cari admin/owner by name (untuk akun admin yang tidak punya karyawan)
      const adminUser = await prisma.user.findFirst({
        where: {
          name: nip.trim(),
          role: { in: ['ADMIN', 'OWNER'] },
        },
        select: {
          id: true,
          name: true,
          password: true,
          role: true,
        },
      });
      user = adminUser;
    }

    // User tidak ditemukan
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'NIP atau password salah',
        },
        { status: 401 }
      );
    }

    // 3. Validasi password menggunakan bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'NIP atau password salah',
        },
        { status: 401 }
      );
    }

    // 4. Generate JWT token (async with jose)
    const token = await generateToken({
      userId: user.id.toString(),
      role: user.role,
    });

    // 5. Buat response dengan user data (tanpa password)
    const responseData = {
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id.toString(),
          name: user.name,
          nip: karyawan?.nip || null,
          role: user.role,
        },
        token,
      },
    };

    // 6. Buat response dan set HTTP-only cookie
    const response = NextResponse.json(responseData, { status: 200 });

    // Set cookie dengan konfigurasi secure
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Terjadi kesalahan saat login',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server',
      },
      { status: 500 }
    );
  }
}
