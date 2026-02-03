import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

// GET /api/accounts/reset-requests/count - Count pending reset requests
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const { role } = payload as { userId: string; role: string };

    if (role !== 'ADMIN' && role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses' },
        { status: 403 }
      );
    }

    const count = await prisma.user.count({
      where: {
        need_password_reset: true,
      },
    });

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Count reset requests error:', error);
    return NextResponse.json(
      { error: 'Gagal menghitung permintaan reset' },
      { status: 500 }
    );
  }
}
