import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

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

// GET: Ambil semua karyawan
export async function GET(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const jenisKaryawanId = searchParams.get('jenis_karyawan_id');
    const search = searchParams.get('search');

    // Build where clause
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (jenisKaryawanId) {
      whereClause.jenis_karyawan_id = BigInt(jenisKaryawanId);
    }
    
    if (search) {
      whereClause.OR = [
        { nama: { contains: search } },
        { nip: { contains: search } },
        { user: { email: { contains: search } } }
      ];
    }

    const karyawan = await prisma.karyawan.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          }
        },
        jenis_karyawan: {
          select: {
            id: true,
            nama_jenis: true,
            jam_masuk: true,
            jam_pulang: true,
          }
        }
      },
      orderBy: { nama: 'asc' }
    });

    // Format data untuk response
    const formattedData = karyawan.map(k => ({
      id: k.id.toString(),
      user_id: k.user_id.toString(),
      nip: k.nip,
      nama: k.nama,
      email: k.user.email,
      no_hp: k.no_hp,
      alamat: k.alamat,
      status: k.status,
      jenis_karyawan: {
        id: k.jenis_karyawan.id.toString(),
        nama_jenis: k.jenis_karyawan.nama_jenis,
        jam_masuk: k.jenis_karyawan.jam_masuk.toISOString(),
        jam_pulang: k.jenis_karyawan.jam_pulang.toISOString(),
      },
      created_at: k.created_at.toISOString(),
      updated_at: k.updated_at.toISOString(),
    }));

    return NextResponse.json({ 
      success: true, 
      data: formattedData 
    });
  } catch (error) {
    console.error('Error fetching karyawan:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Tambah karyawan baru + buat akun login
export async function POST(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { 
      nama, 
      nip, 
      email, 
      password, 
      jenis_karyawan_id, 
      no_hp, 
      alamat, 
      status 
    } = await req.json();

    // Validasi input
    if (!nama || !nip || !email || !password || !jenis_karyawan_id || !no_hp || !alamat) {
      return NextResponse.json({ 
        success: false, 
        error: 'Semua field wajib diisi: nama, nip, email, password, jenis_karyawan_id, no_hp, alamat' 
      }, { status: 400 });
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Format email tidak valid' }, { status: 400 });
    }

    // Validasi password minimal 6 karakter
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    // Cek apakah email sudah terdaftar
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingEmail) {
      return NextResponse.json({ success: false, error: 'Email sudah terdaftar' }, { status: 400 });
    }

    // Cek apakah NIP sudah terdaftar
    const existingNip = await prisma.karyawan.findUnique({
      where: { nip: nip.trim() }
    });

    if (existingNip) {
      return NextResponse.json({ success: false, error: 'NIP sudah terdaftar' }, { status: 400 });
    }

    // Cek apakah jenis karyawan ada
    const jenisKaryawan = await prisma.jenisKaryawan.findUnique({
      where: { id: BigInt(jenis_karyawan_id) }
    });

    if (!jenisKaryawan) {
      return NextResponse.json({ success: false, error: 'Jenis karyawan tidak ditemukan' }, { status: 404 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Gunakan transaction untuk membuat user dan karyawan
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat user baru
      const newUser = await tx.user.create({
        data: {
          name: nama.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role: 'USER',
        }
      });

      // 2. Buat karyawan baru
      const newKaryawan = await tx.karyawan.create({
        data: {
          user_id: newUser.id,
          nip: nip.trim(),
          nama: nama.trim(),
          jenis_karyawan_id: BigInt(jenis_karyawan_id),
          no_hp: no_hp.trim(),
          alamat: alamat.trim(),
          status: status || 'AKTIF',
        },
        include: {
          jenis_karyawan: true,
          user: {
            select: { email: true }
          }
        }
      });

      return newKaryawan;
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Karyawan berhasil ditambahkan',
      data: {
        id: result.id.toString(),
        nama: result.nama,
        nip: result.nip,
        email: result.user.email,
        jenis_karyawan: result.jenis_karyawan.nama_jenis,
      }
    });
  } catch (error) {
    console.error('Error creating karyawan:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update data karyawan
export async function PUT(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { 
      id, 
      nama, 
      nip, 
      email, 
      password, 
      jenis_karyawan_id, 
      no_hp, 
      alamat, 
      status 
    } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID karyawan harus diisi' }, { status: 400 });
    }

    // Cek apakah karyawan ada
    const existing = await prisma.karyawan.findUnique({
      where: { id: BigInt(id) },
      include: { user: true }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    // Cek duplikat NIP (kecuali dirinya sendiri)
    if (nip) {
      const duplicateNip = await prisma.karyawan.findFirst({
        where: { 
          nip: nip.trim(),
          NOT: { id: BigInt(id) }
        }
      });

      if (duplicateNip) {
        return NextResponse.json({ success: false, error: 'NIP sudah digunakan' }, { status: 400 });
      }
    }

    // Cek duplikat email (kecuali dirinya sendiri)
    if (email) {
      const duplicateEmail = await prisma.user.findFirst({
        where: { 
          email: email.toLowerCase().trim(),
          NOT: { id: existing.user_id }
        }
      });

      if (duplicateEmail) {
        return NextResponse.json({ success: false, error: 'Email sudah digunakan' }, { status: 400 });
      }
    }

    // Siapkan data update karyawan
    const karyawanUpdate: any = {};
    if (nama) karyawanUpdate.nama = nama.trim();
    if (nip) karyawanUpdate.nip = nip.trim();
    if (jenis_karyawan_id) karyawanUpdate.jenis_karyawan_id = BigInt(jenis_karyawan_id);
    if (no_hp) karyawanUpdate.no_hp = no_hp.trim();
    if (alamat) karyawanUpdate.alamat = alamat.trim();
    if (status) karyawanUpdate.status = status;

    // Siapkan data update user
    const userUpdate: any = {};
    if (nama) userUpdate.name = nama.trim();
    if (email) userUpdate.email = email.toLowerCase().trim();
    if (password && password.length >= 6) {
      userUpdate.password = await bcrypt.hash(password, 10);
    }

    // Update dengan transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user
      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: existing.user_id },
          data: userUpdate
        });
      }

      // Update karyawan
      const updatedKaryawan = await tx.karyawan.update({
        where: { id: BigInt(id) },
        data: karyawanUpdate,
        include: {
          jenis_karyawan: true,
          user: { select: { email: true } }
        }
      });

      return updatedKaryawan;
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Data karyawan berhasil diperbarui',
      data: {
        id: result.id.toString(),
        nama: result.nama,
        nip: result.nip,
        email: result.user.email,
      }
    });
  } catch (error) {
    console.error('Error updating karyawan:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Hapus karyawan dan akun user
export async function DELETE(req: Request) {
  try {
    const validation = await validateAdmin();
    if ('error' in validation) {
      return NextResponse.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID karyawan harus diisi' }, { status: 400 });
    }

    // Cek apakah karyawan ada
    const existing = await prisma.karyawan.findUnique({
      where: { id: BigInt(id) }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    // Hapus user (karyawan akan terhapus otomatis karena onDelete: Cascade)
    await prisma.user.delete({
      where: { id: existing.user_id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Karyawan berhasil dihapus' 
    });
  } catch (error) {
    console.error('Error deleting karyawan:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
