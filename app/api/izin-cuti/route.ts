import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

// POST: Karyawan mengajukan izin/cuti
export async function POST(req: Request) {
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
      return NextResponse.json({ success: false, error: 'Forbidden - hanya karyawan yang bisa mengajukan' }, { status: 403 });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { user_id: BigInt(userId) },
    });

    if (!karyawan || karyawan.status !== 'AKTIF') {
      return NextResponse.json({ success: false, error: 'Karyawan tidak aktif' }, { status: 403 });
    }

    const { jenis, tanggal_mulai, tanggal_selesai, alasan } = await req.json();

    // Validasi input
    if (!jenis || !tanggal_mulai || !tanggal_selesai || !alasan) {
      return NextResponse.json({ success: false, error: 'Semua field harus diisi' }, { status: 400 });
    }

    if (!['IZIN', 'CUTI', 'SAKIT'].includes(jenis)) {
      return NextResponse.json({ success: false, error: 'Jenis harus IZIN, CUTI, atau SAKIT' }, { status: 400 });
    }

    const mulai = new Date(tanggal_mulai);
    const selesai = new Date(tanggal_selesai);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validasi tanggal
    if (mulai < today) {
      return NextResponse.json({ success: false, error: 'Tanggal mulai tidak boleh di masa lalu' }, { status: 400 });
    }

    if (mulai > selesai) {
      return NextResponse.json({ success: false, error: 'Tanggal mulai harus lebih kecil atau sama dengan tanggal selesai' }, { status: 400 });
    }

    // Simpan pengajuan
    const izinCuti = await prisma.izinCuti.create({
      data: {
        karyawan_id: karyawan.id,
        jenis,
        tanggal_mulai: mulai,
        tanggal_selesai: selesai,
        alasan,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Pengajuan izin/cuti berhasil diajukan',
      data: {
        id: izinCuti.id.toString(),
        jenis: izinCuti.jenis,
        tanggal_mulai: izinCuti.tanggal_mulai,
        tanggal_selesai: izinCuti.tanggal_selesai,
        status: izinCuti.status,
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Riwayat izin/cuti
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const { userId, role } = payload as { userId: number; role: string };

    let izinCutiList;

    if (role === 'ADMIN' || role === 'OWNER') {
      // Admin/Owner melihat semua pengajuan
      izinCutiList = await prisma.izinCuti.findMany({
        include: {
          karyawan: {
            select: {
              id: true,
              nama: true,
              nip: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    } else {
      // Karyawan hanya melihat pengajuan milik sendiri
      const karyawan = await prisma.karyawan.findUnique({
        where: { user_id: BigInt(userId) },
      });

      if (!karyawan) {
        return NextResponse.json({ success: false, error: 'Data karyawan tidak ditemukan' }, { status: 404 });
      }

      izinCutiList = await prisma.izinCuti.findMany({
        where: {
          karyawan_id: karyawan.id,
        },
        include: {
          karyawan: {
            select: {
              id: true,
              nama: true,
              nip: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    }

    // Convert BigInt to string for JSON serialization
    const formattedData = izinCutiList.map((item) => ({
      id: item.id.toString(),
      karyawan_id: item.karyawan_id.toString(),
      karyawan: {
        id: item.karyawan.id.toString(),
        nama: item.karyawan.nama,
        nip: item.karyawan.nip,
      },
      jenis: item.jenis,
      tanggal_mulai: item.tanggal_mulai,
      tanggal_selesai: item.tanggal_selesai,
      alasan: item.alasan,
      status: item.status,
      created_at: item.created_at,
    }));

    return NextResponse.json({ 
      success: true, 
      data: formattedData 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
