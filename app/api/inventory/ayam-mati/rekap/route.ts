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

// GET: Rekap ayam mati per perusahaan untuk klaim
export async function GET(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { searchParams } = new URL(req.url);
    const perusahaan_id = searchParams.get('perusahaan_id');
    const tanggal_dari = searchParams.get('tanggal_dari');
    const tanggal_sampai = searchParams.get('tanggal_sampai');

    const whereClause: any = {};
    
    if (perusahaan_id) {
      whereClause.perusahaan_id = BigInt(perusahaan_id);
    }

    if (tanggal_dari || tanggal_sampai) {
      whereClause.tanggal = {};
      if (tanggal_dari) {
        whereClause.tanggal.gte = new Date(tanggal_dari);
      }
      if (tanggal_sampai) {
        whereClause.tanggal.lte = new Date(tanggal_sampai);
      }
    }

    // Get all perusahaan with their ayam mati data
    const perusahaanList = await prisma.perusahaan.findMany({
      where: perusahaan_id ? { id: BigInt(perusahaan_id) } : undefined,
      orderBy: { nama_perusahaan: 'asc' }
    });

    const rekapPerPerusahaan = await Promise.all(
      perusahaanList.map(async (p) => {
        const ayamMatiWhere: any = { perusahaan_id: p.id };
        
        if (tanggal_dari || tanggal_sampai) {
          ayamMatiWhere.tanggal = {};
          if (tanggal_dari) {
            ayamMatiWhere.tanggal.gte = new Date(tanggal_dari);
          }
          if (tanggal_sampai) {
            ayamMatiWhere.tanggal.lte = new Date(tanggal_sampai);
          }
        }

        // Get ayam mati yang bisa diklaim
        const bisaClaim = await prisma.ayamMati.aggregate({
          where: {
            ...ayamMatiWhere,
            status_claim: 'BISA_CLAIM'
          },
          _sum: { jumlah_ekor: true },
          _count: { id: true }
        });

        // Get ayam mati yang tidak bisa diklaim
        const tidakBisa = await prisma.ayamMati.aggregate({
          where: {
            ...ayamMatiWhere,
            status_claim: 'TIDAK_BISA'
          },
          _sum: { jumlah_ekor: true },
          _count: { id: true }
        });

        // Get total semua
        const total = await prisma.ayamMati.aggregate({
          where: ayamMatiWhere,
          _sum: { jumlah_ekor: true },
          _count: { id: true }
        });

        return {
          perusahaan_id: p.id.toString(),
          nama_perusahaan: p.nama_perusahaan,
          bisa_claim: {
            jumlah_record: bisaClaim._count.id,
            total_ekor: bisaClaim._sum.jumlah_ekor || 0,
          },
          tidak_bisa_claim: {
            jumlah_record: tidakBisa._count.id,
            total_ekor: tidakBisa._sum.jumlah_ekor || 0,
          },
          total: {
            jumlah_record: total._count.id,
            total_ekor: total._sum.jumlah_ekor || 0,
          }
        };
      })
    );

    // Hitung total keseluruhan
    const totalKeseluruhan = rekapPerPerusahaan.reduce(
      (acc, curr) => ({
        bisa_claim_ekor: acc.bisa_claim_ekor + curr.bisa_claim.total_ekor,
        tidak_bisa_claim_ekor: acc.tidak_bisa_claim_ekor + curr.tidak_bisa_claim.total_ekor,
        total_ekor: acc.total_ekor + curr.total.total_ekor,
      }),
      { bisa_claim_ekor: 0, tidak_bisa_claim_ekor: 0, total_ekor: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        per_perusahaan: rekapPerPerusahaan,
        total: totalKeseluruhan,
        periode: {
          dari: tanggal_dari || 'Semua',
          sampai: tanggal_sampai || 'Semua',
        }
      }
    });
  } catch (error) {
    console.error('Error fetching rekap ayam mati:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
