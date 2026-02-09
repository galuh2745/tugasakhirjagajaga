import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

/**
 * GET /api/dashboard/admin/summary?date=YYYY-MM-DD
 *
 * Returns a combined summary of:
 *  - Absensi (attendance)
 *  - Inventory (chicken stock movement)
 *  - Keuangan (financials)
 * for a single day.
 */
export async function GET(req: Request) {
  try {
    // ── Auth ──
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const { role } = payload as { userId: number; role: string };

    if (role !== 'ADMIN' && role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // ── Date param ──
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    let dateStr: string;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      dateStr = dateParam;
    } else {
      const now = new Date();
      dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    const targetDate = new Date(dateStr + 'T00:00:00.000Z');
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // ════════════════════════════════════════════════════
    // 1) ABSENSI
    // ════════════════════════════════════════════════════

    const [totalKaryawan, hadirCount, izinCutiCount, alphaCount] = await Promise.all([
      prisma.karyawan.count({ where: { status: 'AKTIF' } }),
      prisma.absensi.count({ where: { tanggal: targetDate, status: { in: ['HADIR', 'TERLAMBAT'] } } }),
      prisma.absensi.count({ where: { tanggal: targetDate, status: { in: ['IZIN', 'CUTI'] } } }),
      prisma.absensi.count({ where: { tanggal: targetDate, status: 'ALPHA' } }),
    ]);

    // ════════════════════════════════════════════════════
    // 2) INVENTORY
    // ════════════════════════════════════════════════════

    const [ayamMasukAgg, ayamMatiAgg, ayamKeluarHidupAgg, totalMasukAll, totalMatiAll, totalKeluarAll] = await Promise.all([
      // Ayam masuk hari ini
      prisma.barangMasuk.aggregate({
        where: { tanggal_masuk: { gte: targetDate, lt: nextDate } },
        _sum: { jumlah_ekor: true },
      }),
      // Ayam mati hari ini
      prisma.ayamMati.aggregate({
        where: { tanggal: { gte: targetDate, lt: nextDate } },
        _sum: { jumlah_ekor: true },
      }),
      // Ayam keluar hidup hari ini
      prisma.barangKeluarAyamHidup.aggregate({
        where: { tanggal: { gte: targetDate, lt: nextDate } },
        _sum: { jumlah_ekor: true },
      }),
      // ── Stok tersisa (all-time) ──
      prisma.barangMasuk.aggregate({ _sum: { jumlah_ekor: true } }),
      prisma.ayamMati.aggregate({ _sum: { jumlah_ekor: true } }),
      prisma.barangKeluarAyamHidup.aggregate({ _sum: { jumlah_ekor: true } }),
    ]);

    const ayamMasuk = ayamMasukAgg._sum.jumlah_ekor ?? 0;
    const ayamMati = ayamMatiAgg._sum.jumlah_ekor ?? 0;
    const ayamKeluar = (ayamKeluarHidupAgg._sum.jumlah_ekor ?? 0);
    const stokTersisa =
      (totalMasukAll._sum.jumlah_ekor ?? 0) -
      (totalMatiAll._sum.jumlah_ekor ?? 0) -
      (totalKeluarAll._sum.jumlah_ekor ?? 0);

    // ════════════════════════════════════════════════════
    // 3) KEUANGAN
    // ════════════════════════════════════════════════════

    const [penjualanDagingAgg, penjualanHidupAgg, beliAyamAgg, pengeluaranDagingAgg, pengeluaranHidupAgg] =
      await Promise.all([
        // Pemasukan – penjualan daging (saldo = total_penjualan - pengeluaran for daging)
        prisma.barangKeluarDaging.aggregate({
          where: { tanggal: { gte: targetDate, lt: nextDate } },
          _sum: { total_penjualan: true },
        }),
        // Pemasukan – penjualan ayam hidup
        prisma.barangKeluarAyamHidup.aggregate({
          where: { tanggal: { gte: targetDate, lt: nextDate } },
          _sum: { total_penjualan: true },
        }),
        // Pengeluaran – beli ayam
        prisma.barangMasuk.aggregate({
          where: { tanggal_masuk: { gte: targetDate, lt: nextDate } },
          _sum: { total_harga: true },
        }),
        // Pengeluaran operasional daging
        prisma.barangKeluarDaging.aggregate({
          where: { tanggal: { gte: targetDate, lt: nextDate } },
          _sum: { pengeluaran: true },
        }),
        // Pengeluaran operasional ayam hidup
        prisma.barangKeluarAyamHidup.aggregate({
          where: { tanggal: { gte: targetDate, lt: nextDate } },
          _sum: { pengeluaran: true },
        }),
      ]);

    const pemasukan =
      parseFloat(penjualanDagingAgg._sum.total_penjualan?.toString() ?? '0') +
      parseFloat(penjualanHidupAgg._sum.total_penjualan?.toString() ?? '0');

    const pengeluaran =
      parseFloat(beliAyamAgg._sum.total_harga?.toString() ?? '0') +
      parseFloat(pengeluaranDagingAgg._sum.pengeluaran?.toString() ?? '0') +
      parseFloat(pengeluaranHidupAgg._sum.pengeluaran?.toString() ?? '0');

    const saldo = pemasukan - pengeluaran;

    // ════════════════════════════════════════════════════
    // RESPONSE
    // ════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      data: {
        tanggal: dateStr,
        absensi: {
          total_karyawan: totalKaryawan,
          hadir: hadirCount,
          izin: izinCutiCount,
          alpha: alphaCount,
        },
        inventory: {
          ayam_masuk: ayamMasuk,
          ayam_keluar: ayamKeluar,
          ayam_mati: ayamMati,
          stok_tersisa: stokTersisa,
        },
        keuangan: {
          pemasukan,
          pengeluaran,
          saldo,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
