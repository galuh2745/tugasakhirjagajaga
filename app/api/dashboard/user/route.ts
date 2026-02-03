import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

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

    if (role !== 'USER') {
      return NextResponse.json({ success: false, error: 'Forbidden - hanya karyawan yang bisa mengakses' }, { status: 403 });
    }

    // Cari data karyawan
    const karyawan = await prisma.karyawan.findUnique({
      where: { user_id: BigInt(userId) },
      include: { jenis_karyawan: true },
    });

    if (!karyawan) {
      return NextResponse.json({ success: false, error: 'Data karyawan tidak ditemukan' }, { status: 404 });
    }

    // Gunakan tanggal lokal (konsisten dengan absensi)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const today = new Date(todayStr + 'T00:00:00.000Z');
    
    // Debug log
    console.log('Dashboard user - todayStr:', todayStr, ', today UTC:', today.toISOString());

    // Get first and last day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // 1. Status absensi hari ini
    const absensiHariIni = await prisma.absensi.findFirst({
      where: {
        karyawan_id: karyawan.id,
        tanggal: today,
      },
    });

    // 2. Total kehadiran bulan berjalan
    const totalKehadiranBulanIni = await prisma.absensi.count({
      where: {
        karyawan_id: karyawan.id,
        tanggal: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
        status: { in: ['HADIR', 'TERLAMBAT'] },
      },
    });

    // 3. Total jam lembur bulan berjalan
    const lemburBulanIni = await prisma.lembur.findMany({
      where: {
        karyawan_id: karyawan.id,
        tanggal: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    const totalJamLemburBulanIni = lemburBulanIni.reduce((total, item) => {
      return total + Number(item.total_jam);
    }, 0);

    // 4. Riwayat absensi (30 hari terakhir)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const riwayatAbsensi = await prisma.absensi.findMany({
      where: {
        karyawan_id: karyawan.id,
        tanggal: {
          gte: thirtyDaysAgo,
          lte: today,
        },
      },
      orderBy: {
        tanggal: 'desc',
      },
      take: 30,
    });

    // 5. Riwayat izin & cuti (30 hari terakhir)
    const riwayatIzinCuti = await prisma.izinCuti.findMany({
      where: {
        karyawan_id: karyawan.id,
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10,
    });

    // 6. Riwayat lembur (30 hari terakhir)
    const riwayatLembur = await prisma.lembur.findMany({
      where: {
        karyawan_id: karyawan.id,
        tanggal: {
          gte: thirtyDaysAgo,
          lte: today,
        },
      },
      orderBy: {
        tanggal: 'desc',
      },
      take: 10,
    });

    // Format data
    const formattedAbsensiHariIni = absensiHariIni ? {
      id: absensiHariIni.id.toString(),
      tanggal: absensiHariIni.tanggal,
      jam_masuk: absensiHariIni.jam_masuk,
      jam_pulang: absensiHariIni.jam_pulang,
      status: absensiHariIni.status,
    } : null;

    const formattedRiwayatAbsensi = riwayatAbsensi.map((item) => ({
      id: item.id.toString(),
      tanggal: item.tanggal,
      jam_masuk: item.jam_masuk,
      jam_pulang: item.jam_pulang,
      status: item.status,
    }));

    const formattedRiwayatIzinCuti = riwayatIzinCuti.map((item) => ({
      id: item.id.toString(),
      jenis: item.jenis,
      tanggal_mulai: item.tanggal_mulai,
      tanggal_selesai: item.tanggal_selesai,
      alasan: item.alasan,
      status: item.status,
      created_at: item.created_at,
    }));

    const formattedRiwayatLembur = riwayatLembur.map((item) => ({
      id: item.id.toString(),
      tanggal: item.tanggal,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      total_jam: Number(item.total_jam),
      keterangan: item.keterangan,
    }));

    return NextResponse.json({
      success: true,
      data: {
        karyawan: {
          id: karyawan.id.toString(),
          nama: karyawan.nama,
          nip: karyawan.nip,
          jenis_karyawan: karyawan.jenis_karyawan.nama_jenis,
          jam_masuk_normal: karyawan.jenis_karyawan.jam_masuk,
          jam_pulang_normal: karyawan.jenis_karyawan.jam_pulang,
        },
        ringkasan: {
          absensi_hari_ini: formattedAbsensiHariIni,
          total_kehadiran_bulan_ini: totalKehadiranBulanIni,
          total_jam_lembur_bulan_ini: Number(totalJamLemburBulanIni.toFixed(2)),
        },
        riwayat: {
          absensi: formattedRiwayatAbsensi,
          izin_cuti: formattedRiwayatIzinCuti,
          lembur: formattedRiwayatLembur,
        },
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
