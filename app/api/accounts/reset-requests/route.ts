import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

// GET /api/accounts/reset-requests - Admin views pending password reset requests
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

    const resetRequests = await prisma.user.findMany({
      where: {
        need_password_reset: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        reset_requested_at: true,
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
        reset_requested_at: 'desc',
      },
    });

    // Convert BigInt to string for JSON serialization
    const serializedRequests = resetRequests.map(request => ({
      ...request,
      id: request.id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: serializedRequests,
    });
  } catch (error) {
    console.error('Get reset requests error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat permintaan reset password' },
      { status: 500 }
    );
  }
}
