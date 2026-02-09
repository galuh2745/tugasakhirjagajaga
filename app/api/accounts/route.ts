import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

// GET /api/accounts - Admin list all accounts
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        need_password_reset: true,
        reset_requested_at: true,
        created_at: true,
        karyawan: {
          select: {
            nip: true,
            nama: true,
            jenis_karyawan: {
              select: {
                nama_jenis: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Convert BigInt to String for JSON serialization
    const serializedUsers = users.map(user => ({
      ...user,
      id: user.id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: serializedUsers,
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data akun' },
      { status: 500 }
    );
  }
}
