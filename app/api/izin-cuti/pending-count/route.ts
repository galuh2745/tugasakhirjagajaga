import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

// GET: Admin mendapatkan jumlah pending izin/cuti
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const { role } = payload as { userId: number; role: string };

    // Hanya admin/owner yang bisa akses
    if (role !== 'ADMIN' && role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Hitung jumlah izin/cuti yang pending
    const pendingCount = await prisma.izinCuti.count({
      where: {
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        pending_count: pendingCount,
      },
    });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
