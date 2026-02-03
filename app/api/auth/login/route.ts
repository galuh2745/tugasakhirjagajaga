import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';

/**
 * POST /api/auth/login
 * Login endpoint dengan validasi email, password, dan JWT generation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const { email, password } = body;

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email dan password harus diisi',
        },
        { status: 400 }
      );
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Format email tidak valid',
        },
        { status: 400 }
      );
    }

    // 2. Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    // User tidak ditemukan
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email atau password salah',
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
          message: 'Email atau password salah',
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
          email: user.email,
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
