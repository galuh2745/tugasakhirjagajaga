import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// POST /api/auth/request-reset - User requests password reset
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const userId = decoded.userId as string;

    // Update user to request password reset
    await prisma.user.update({
      where: { id: Number(userId) },
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
    console.error('Request reset password error:', error);
    return NextResponse.json(
      { error: 'Gagal memproses permintaan' },
      { status: 500 }
    );
  }
}
