import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/auth/forgot-password - User requests password reset (no auth required)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nip } = body;

    if (!nip) {
      return NextResponse.json(
        { error: 'NIP harus diisi' },
        { status: 400 }
      );
    }

    // Find karyawan by NIP
    const karyawan = await prisma.karyawan.findUnique({
      where: { nip: nip.trim() },
      select: { user_id: true },
    });

    if (!karyawan) {
      return NextResponse.json(
        { error: 'NIP tidak ditemukan di sistem' },
        { status: 404 }
      );
    }

    // Update user to request password reset
    await prisma.user.update({
      where: { id: karyawan.user_id },
      data: {
        need_password_reset: true,
        reset_requested_at: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Permintaan reset password telah dikirim ke admin',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Gagal memproses permintaan' },
      { status: 500 }
    );
  }
}
