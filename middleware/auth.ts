import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

export async function validateRequest(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const { userId, role } = payload as { userId: number; role: string };

    if (role !== 'USER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { user_id: userId },
    });

    if (!karyawan || karyawan.status !== 'AKTIF') {
      return NextResponse.json({ success: false, error: 'Karyawan tidak aktif' }, { status: 403 });
    }

    return { userId, karyawanId: karyawan.id };
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}