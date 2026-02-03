import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/auth/forgot-password - User requests password reset (no auth required)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email harus diisi' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email tidak ditemukan di sistem' },
        { status: 404 }
      );
    }

    // Update user to request password reset
    await prisma.user.update({
      where: { id: user.id },
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
