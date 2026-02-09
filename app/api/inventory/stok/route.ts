import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

// Helper function untuk validasi admin
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

// GET: Hitung stok ayam hidup per perusahaan
// STOK = SUM(barang_masuk.jumlah_ekor) - SUM(ayam_mati.jumlah_ekor) - SUM(barang_keluar_ayam_hidup.jumlah_ekor)
export async function GET(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { searchParams } = new URL(req.url);
    const perusahaan_id = searchParams.get('perusahaan_id');

    // Jika ada filter perusahaan_id, hitung hanya untuk perusahaan tersebut
    if (perusahaan_id) {
      const perusahaan = await prisma.perusahaan.findUnique({
        where: { id: BigInt(perusahaan_id) }
      });

      if (!perusahaan) {
        return NextResponse.json({ success: false, error: 'Perusahaan tidak ditemukan' }, { status: 404 });
      }

      const [barangMasukSum, ayamMatiSum, barangKeluarAyamHidupSum] = await Promise.all([
        prisma.barangMasuk.aggregate({
          where: { perusahaan_id: BigInt(perusahaan_id) },
          _sum: { jumlah_ekor: true }
        }),
        prisma.ayamMati.aggregate({
          where: { perusahaan_id: BigInt(perusahaan_id) },
          _sum: { jumlah_ekor: true }
        }),
        prisma.barangKeluarAyamHidup.aggregate({
          where: { perusahaan_id: BigInt(perusahaan_id) },
          _sum: { jumlah_ekor: true }
        })
      ]);

      const totalMasuk = barangMasukSum._sum.jumlah_ekor || 0;
      const totalMati = ayamMatiSum._sum.jumlah_ekor || 0;
      const totalKeluar = barangKeluarAyamHidupSum._sum.jumlah_ekor || 0;
      const stok = totalMasuk - totalMati - totalKeluar;

      return NextResponse.json({
        success: true,
        data: {
          perusahaan_id: perusahaan.id.toString(),
          nama_perusahaan: perusahaan.nama_perusahaan,
          total_masuk: totalMasuk,
          total_mati: totalMati,
          total_keluar: totalKeluar,
          stok_ayam_hidup: stok,
        }
      });
    }

    // Jika tidak ada filter, hitung untuk semua perusahaan
    const perusahaanList = await prisma.perusahaan.findMany({
      orderBy: { nama_perusahaan: 'asc' }
    });

    const stokPerPerusahaan = await Promise.all(
      perusahaanList.map(async (p) => {
        const [barangMasukSum, ayamMatiSum, barangKeluarAyamHidupSum] = await Promise.all([
          prisma.barangMasuk.aggregate({
            where: { perusahaan_id: p.id },
            _sum: { jumlah_ekor: true }
          }),
          prisma.ayamMati.aggregate({
            where: { perusahaan_id: p.id },
            _sum: { jumlah_ekor: true }
          }),
          prisma.barangKeluarAyamHidup.aggregate({
            where: { perusahaan_id: p.id },
            _sum: { jumlah_ekor: true }
          })
        ]);

        const totalMasuk = barangMasukSum._sum.jumlah_ekor || 0;
        const totalMati = ayamMatiSum._sum.jumlah_ekor || 0;
        const totalKeluar = barangKeluarAyamHidupSum._sum.jumlah_ekor || 0;
        const stok = totalMasuk - totalMati - totalKeluar;

        return {
          perusahaan_id: p.id.toString(),
          nama_perusahaan: p.nama_perusahaan,
          total_masuk: totalMasuk,
          total_mati: totalMati,
          total_keluar: totalKeluar,
          stok_ayam_hidup: stok,
        };
      })
    );

    // Hitung total keseluruhan
    const totalKeseluruhan = stokPerPerusahaan.reduce(
      (acc, curr) => ({
        total_masuk: acc.total_masuk + curr.total_masuk,
        total_mati: acc.total_mati + curr.total_mati,
        total_keluar: acc.total_keluar + curr.total_keluar,
        stok_ayam_hidup: acc.stok_ayam_hidup + curr.stok_ayam_hidup,
      }),
      { total_masuk: 0, total_mati: 0, total_keluar: 0, stok_ayam_hidup: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        per_perusahaan: stokPerPerusahaan,
        total: totalKeseluruhan,
      }
    });
  } catch (error) {
    console.error('Error calculating stok:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
