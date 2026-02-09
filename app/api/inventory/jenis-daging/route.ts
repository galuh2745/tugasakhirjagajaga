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

// GET - Fetch all jenis daging
export async function GET(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { searchParams } = new URL(req.url);
    const aktifOnly = searchParams.get('aktif') === 'true';

    const whereClause = aktifOnly ? { aktif: true } : {};

    const jenisDaging = await prisma.jenisDaging.findMany({
      where: whereClause,
      orderBy: { nama_jenis: 'asc' },
    });

    const formatted = jenisDaging.map((jd) => ({
      id: jd.id.toString(),
      nama_jenis: jd.nama_jenis,
      aktif: jd.aktif,
      created_at: jd.created_at.toISOString(),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching jenis daging:', error);
    return NextResponse.json({ success: false, error: 'Gagal memuat data jenis daging' }, { status: 500 });
  }
}

// POST - Create new jenis daging
export async function POST(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const body = await req.json();
    const { nama_jenis } = body;

    // Validation
    if (!nama_jenis || nama_jenis.trim() === '') {
      return NextResponse.json({ success: false, error: 'Nama jenis daging wajib diisi' }, { status: 400 });
    }

    // Check duplicate (using lowercase comparison for MySQL)
    const existing = await prisma.jenisDaging.findFirst({
      where: { nama_jenis: nama_jenis.trim() },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Jenis daging sudah ada' }, { status: 400 });
    }

    const jenisDaging = await prisma.jenisDaging.create({
      data: {
        nama_jenis: nama_jenis.trim(),
        aktif: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Jenis daging berhasil ditambahkan',
      data: {
        id: jenisDaging.id.toString(),
        nama_jenis: jenisDaging.nama_jenis,
        aktif: jenisDaging.aktif,
      },
    });
  } catch (error) {
    console.error('Error creating jenis daging:', error);
    return NextResponse.json({ success: false, error: 'Gagal menambah jenis daging' }, { status: 500 });
  }
}

// PUT - Update jenis daging
export async function PUT(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const body = await req.json();
    const { id, nama_jenis, aktif } = body;

    // Validation
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.jenisDaging.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Jenis daging tidak ditemukan' }, { status: 404 });
    }

    // Check duplicate name if changed
    if (nama_jenis && nama_jenis.trim() !== existing.nama_jenis) {
      const duplicate = await prisma.jenisDaging.findFirst({
        where: {
          nama_jenis: nama_jenis.trim(),
          id: { not: BigInt(id) },
        },
      });

      if (duplicate) {
        return NextResponse.json({ success: false, error: 'Nama jenis daging sudah digunakan' }, { status: 400 });
      }
    }

    const updatedData: { nama_jenis?: string; aktif?: boolean } = {};
    if (nama_jenis !== undefined) updatedData.nama_jenis = nama_jenis.trim();
    if (aktif !== undefined) updatedData.aktif = aktif;

    const jenisDaging = await prisma.jenisDaging.update({
      where: { id: BigInt(id) },
      data: updatedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Jenis daging berhasil diperbarui',
      data: {
        id: jenisDaging.id.toString(),
        nama_jenis: jenisDaging.nama_jenis,
        aktif: jenisDaging.aktif,
      },
    });
  } catch (error) {
    console.error('Error updating jenis daging:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui jenis daging' }, { status: 500 });
  }
}

// DELETE - Delete jenis daging
export async function DELETE(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID wajib diisi' }, { status: 400 });
    }

    // Check if used in any transaction
    const usedInDetail = await prisma.barangKeluarDagingDetail.findFirst({
      where: { jenis_daging_id: BigInt(id) },
    });

    if (usedInDetail) {
      return NextResponse.json({
        success: false,
        error: 'Jenis daging tidak dapat dihapus karena sudah digunakan dalam transaksi. Nonaktifkan saja.',
      }, { status: 400 });
    }

    await prisma.jenisDaging.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Jenis daging berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting jenis daging:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus jenis daging' }, { status: 500 });
  }
}
