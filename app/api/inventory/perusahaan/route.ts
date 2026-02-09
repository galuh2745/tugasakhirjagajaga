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

// GET: Ambil semua perusahaan
export async function GET(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { nama_perusahaan: { contains: search } },
        { alamat: { contains: search } },
        { kontak: { contains: search } }
      ];
    }

    const perusahaan = await prisma.perusahaan.findMany({
      where: whereClause,
      orderBy: { nama_perusahaan: 'asc' }
    });

    const formattedData = perusahaan.map(p => ({
      id: p.id.toString(),
      nama_perusahaan: p.nama_perusahaan,
      alamat: p.alamat,
      kontak: p.kontak,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching perusahaan:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Tambah perusahaan baru
export async function POST(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const body = await req.json();
    const { nama_perusahaan, alamat, kontak } = body;

    // Validasi input
    if (!nama_perusahaan || nama_perusahaan.trim() === '') {
      return NextResponse.json({ success: false, error: 'Nama perusahaan wajib diisi' }, { status: 400 });
    }

    // Cek duplikat nama
    const existing = await prisma.perusahaan.findFirst({
      where: { nama_perusahaan: nama_perusahaan.trim() }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Nama perusahaan sudah ada' }, { status: 400 });
    }

    const perusahaan = await prisma.perusahaan.create({
      data: {
        nama_perusahaan: nama_perusahaan.trim(),
        alamat: alamat?.trim() || null,
        kontak: kontak?.trim() || null,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Perusahaan berhasil ditambahkan',
      data: {
        id: perusahaan.id.toString(),
        nama_perusahaan: perusahaan.nama_perusahaan,
        alamat: perusahaan.alamat,
        kontak: perusahaan.kontak,
        created_at: perusahaan.created_at.toISOString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating perusahaan:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update perusahaan
export async function PUT(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const body = await req.json();
    const { id, nama_perusahaan, alamat, kontak } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID perusahaan wajib diisi' }, { status: 400 });
    }

    if (!nama_perusahaan || nama_perusahaan.trim() === '') {
      return NextResponse.json({ success: false, error: 'Nama perusahaan wajib diisi' }, { status: 400 });
    }

    // Cek perusahaan exists
    const existing = await prisma.perusahaan.findUnique({
      where: { id: BigInt(id) }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Perusahaan tidak ditemukan' }, { status: 404 });
    }

    // Cek duplikat nama (exclude current)
    const duplicate = await prisma.perusahaan.findFirst({
      where: {
        nama_perusahaan: nama_perusahaan.trim(),
        NOT: { id: BigInt(id) }
      }
    });

    if (duplicate) {
      return NextResponse.json({ success: false, error: 'Nama perusahaan sudah digunakan' }, { status: 400 });
    }

    const updated = await prisma.perusahaan.update({
      where: { id: BigInt(id) },
      data: {
        nama_perusahaan: nama_perusahaan.trim(),
        alamat: alamat?.trim() || null,
        kontak: kontak?.trim() || null,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Perusahaan berhasil diupdate',
      data: {
        id: updated.id.toString(),
        nama_perusahaan: updated.nama_perusahaan,
        alamat: updated.alamat,
        kontak: updated.kontak,
        updated_at: updated.updated_at.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error updating perusahaan:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Hapus perusahaan
export async function DELETE(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID perusahaan wajib diisi' }, { status: 400 });
    }

    // Cek apakah ada data terkait
    const relatedBarangMasuk = await prisma.barangMasuk.count({
      where: { perusahaan_id: BigInt(id) }
    });

    const relatedAyamMati = await prisma.ayamMati.count({
      where: { perusahaan_id: BigInt(id) }
    });

    const relatedBarangKeluarAyamHidup = await prisma.barangKeluarAyamHidup.count({
      where: { perusahaan_id: BigInt(id) }
    });

    if (relatedBarangMasuk > 0 || relatedAyamMati > 0 || relatedBarangKeluarAyamHidup > 0) {
      return NextResponse.json({
        success: false,
        error: 'Tidak dapat menghapus perusahaan karena masih memiliki data inventory terkait'
      }, { status: 400 });
    }

    await prisma.perusahaan.delete({
      where: { id: BigInt(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Perusahaan berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting perusahaan:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
