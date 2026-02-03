import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const { role } = payload as { userId: number; role: string };

    // Hanya admin yang bisa approve/reject
    if (role !== 'ADMIN' && role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Forbidden - hanya admin yang bisa menyetujui' }, { status: 403 });
    }

    const { izin_cuti_id, status } = await req.json();

    // Validasi input
    if (!izin_cuti_id || !status) {
      return NextResponse.json({ success: false, error: 'ID dan status harus diisi' }, { status: 400 });
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Status harus APPROVED atau REJECTED' }, { status: 400 });
    }

    // Cek apakah izin/cuti ada
    const izinCuti = await prisma.izinCuti.findUnique({
      where: { id: BigInt(izin_cuti_id) },
      include: {
        karyawan: true,
      },
    });

    if (!izinCuti) {
      return NextResponse.json({ success: false, error: 'Data izin/cuti tidak ditemukan' }, { status: 404 });
    }

    // Update status
    const updatedIzinCuti = await prisma.izinCuti.update({
      where: { id: BigInt(izin_cuti_id) },
      data: { status },
    });

    // Jika APPROVED, buat entry absensi otomatis untuk rentang tanggal
    if (status === 'APPROVED') {
      const tanggalMulai = new Date(izinCuti.tanggal_mulai);
      const tanggalSelesai = new Date(izinCuti.tanggal_selesai);

      // Loop untuk setiap tanggal dalam rentang
      const dates = [];
      for (let d = new Date(tanggalMulai); d <= tanggalSelesai; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }

      // Buat atau update absensi untuk setiap tanggal
      for (const tanggal of dates) {
        const existingAbsensi = await prisma.absensi.findFirst({
          where: {
            karyawan_id: izinCuti.karyawan_id,
            tanggal: tanggal,
          },
        });

        if (!existingAbsensi) {
          // Buat absensi baru dengan status sesuai jenis izin
          await prisma.absensi.create({
            data: {
              karyawan_id: izinCuti.karyawan_id,
              tanggal: tanggal,
              status: izinCuti.jenis as any, // IZIN, CUTI, atau SAKIT (sudah sesuai dengan enum StatusAbsensi)
              jam_masuk: null,
              jam_pulang: null,
              latitude: null,
              longitude: null,
            },
          });
        } else {
          // Update absensi yang sudah ada (jika belum ada jam_masuk)
          if (!existingAbsensi.jam_masuk) {
            await prisma.absensi.update({
              where: { id: existingAbsensi.id },
              data: { status: izinCuti.jenis as any },
            });
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Pengajuan izin/cuti berhasil ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`,
      data: {
        id: updatedIzinCuti.id.toString(),
        status: updatedIzinCuti.status,
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
