import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

async function validateAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const { payload } = await jwtVerify(token, secret);
  const { role } = payload as { userId: number; role: string };

  if (role !== 'ADMIN' && role !== 'OWNER') {
    return { error: 'Forbidden - Hanya admin yang dapat mengakses', status: 403 };
  }

  return { role };
}

// GET /api/keuangan/harian?date=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { success: false, error: 'Parameter date wajib diisi dengan format YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const targetDate = new Date(dateParam);
    const nextDate = new Date(dateParam);
    nextDate.setDate(nextDate.getDate() + 1);

    // ==================== PEMASUKAN ====================

    // 1. Penjualan Daging Ayam → barang_keluar_daging.saldo
    const penjualanDaging = await prisma.barangKeluarDaging.aggregate({
      where: {
        tanggal: { gte: targetDate, lt: nextDate },
      },
      _sum: { saldo: true },
    });

    // 2. Penjualan Ayam Hidup → barang_keluar_ayam_hidup.total_penjualan
    const penjualanAyamHidup = await prisma.barangKeluarAyamHidup.aggregate({
      where: {
        tanggal: { gte: targetDate, lt: nextDate },
      },
      _sum: { total_penjualan: true },
    });

    const totalPenjualanDaging = parseFloat(penjualanDaging._sum.saldo?.toString() || '0');
    const totalPenjualanAyamHidup = parseFloat(penjualanAyamHidup._sum.total_penjualan?.toString() || '0');
    const totalPemasukan = totalPenjualanDaging + totalPenjualanAyamHidup;

    // ==================== PENGELUARAN ====================

    // 1. Barang Masuk (Beli Ayam) → barang_masuk.total_harga
    const beliAyam = await prisma.barangMasuk.aggregate({
      where: {
        tanggal_masuk: { gte: targetDate, lt: nextDate },
      },
      _sum: { total_harga: true },
    });

    // 2. Pengeluaran Operasional Daging → barang_keluar_daging.pengeluaran
    const pengeluaranDaging = await prisma.barangKeluarDaging.aggregate({
      where: {
        tanggal: { gte: targetDate, lt: nextDate },
      },
      _sum: { pengeluaran: true },
    });

    // 3. Pengeluaran Operasional Ayam Hidup → barang_keluar_ayam_hidup.pengeluaran
    const pengeluaranAyamHidup = await prisma.barangKeluarAyamHidup.aggregate({
      where: {
        tanggal: { gte: targetDate, lt: nextDate },
      },
      _sum: { pengeluaran: true },
    });

    // 4. Ayam Mati TIDAK BISA CLAIM → hitung kerugian
    //    BW = total_kg / jumlah_ekor (dari barang_masuk)
    //    nilai_per_ekor = BW × harga_per_kg
    //    kerugian = jumlah_ekor_mati × nilai_per_ekor
    const ayamMatiTidakBisaClaim = await prisma.ayamMati.findMany({
      where: {
        tanggal: { gte: targetDate, lt: nextDate },
        status_claim: 'TIDAK_BISA',
      },
      include: {
        perusahaan: true,
      },
    });

    let totalKerugianAyamMati = 0;
    for (const am of ayamMatiTidakBisaClaim) {
      // Cari barang masuk terdekat dari perusahaan yang sama pada/sebelum tanggal ayam mati
      const barangMasukRef = await prisma.barangMasuk.findFirst({
        where: {
          perusahaan_id: am.perusahaan_id,
          tanggal_masuk: { lte: am.tanggal },
        },
        orderBy: { tanggal_masuk: 'desc' },
      });

      if (barangMasukRef) {
        const totalKg = parseFloat(barangMasukRef.total_kg.toString());
        const jumlahEkor = barangMasukRef.jumlah_ekor;
        const hargaPerKg = parseFloat(barangMasukRef.harga_per_kg.toString());
        const bw = jumlahEkor > 0 ? totalKg / jumlahEkor : 0;
        const nilaiPerEkor = bw * hargaPerKg;
        totalKerugianAyamMati += am.jumlah_ekor * nilaiPerEkor;
      }
    }

    const totalBeliAyam = parseFloat(beliAyam._sum.total_harga?.toString() || '0');
    const totalPengeluaranDaging = parseFloat(pengeluaranDaging._sum.pengeluaran?.toString() || '0');
    const totalPengeluaranAyamHidup = parseFloat(pengeluaranAyamHidup._sum.pengeluaran?.toString() || '0');

    const totalPengeluaran =
      totalBeliAyam + totalPengeluaranDaging + totalPengeluaranAyamHidup + totalKerugianAyamMati;

    const saldoHarian = totalPemasukan - totalPengeluaran;

    return NextResponse.json({
      success: true,
      data: {
        tanggal: dateParam,
        pemasukan: {
          penjualan_daging: totalPenjualanDaging,
          penjualan_ayam_hidup: totalPenjualanAyamHidup,
          total: totalPemasukan,
        },
        pengeluaran: {
          beli_ayam: totalBeliAyam,
          operasional_daging: totalPengeluaranDaging,
          operasional_ayam_hidup: totalPengeluaranAyamHidup,
          kerugian_ayam_mati: totalKerugianAyamMati,
          total: totalPengeluaran,
        },
        saldo_harian: saldoHarian,
      },
    });
  } catch (error) {
    console.error('Error fetching keuangan harian:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data keuangan harian' },
      { status: 500 }
    );
  }
}
