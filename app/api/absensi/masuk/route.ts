import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// Koordinat kantor dari environment variable, atau default Jakarta
const OFFICE_LAT = parseFloat(process.env.OFFICE_LAT || '-6.200000');
const OFFICE_LON = parseFloat(process.env.OFFICE_LON || '106.816666');
const MAX_DISTANCE = parseInt(process.env.MAX_DISTANCE || '500'); // dalam meter

// Set SKIP_LOCATION_CHECK=true di .env untuk menonaktifkan validasi lokasi
const SKIP_LOCATION_CHECK = process.env.SKIP_LOCATION_CHECK === 'true';

// Maksimal ukuran file 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Fungsi hitung jarak (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Fungsi format tanggal untuk watermark
function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

// Fungsi untuk membuat watermark SVG
function createWatermarkSvg(nama: string, waktu: string, latitude: number, longitude: number, width: number): string {
  const padding = 15;
  const lineHeight = 24;
  const boxHeight = lineHeight * 3 + padding * 2 + 10;
  const fontSize = 16;
  
  return `
    <svg width="${width}" height="${boxHeight}">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" flood-opacity="0.5"/>
        </filter>
      </defs>
      <rect x="0" y="0" width="${width}" height="${boxHeight}" fill="rgba(0,0,0,0.6)" rx="8"/>
      <text x="${padding}" y="${padding + lineHeight}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="white" filter="url(#shadow)">
        <tspan font-weight="bold">Nama:</tspan> ${nama}
      </text>
      <text x="${padding}" y="${padding + lineHeight * 2}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="white" filter="url(#shadow)">
        <tspan font-weight="bold">Waktu:</tspan> ${waktu}
      </text>
      <text x="${padding}" y="${padding + lineHeight * 3}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="white" filter="url(#shadow)">
        <tspan font-weight="bold">Lokasi:</tspan> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
      </text>
    </svg>
  `;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized - silakan login ulang' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const { userId, role } = payload as { userId: number; role: string };

    if (role !== 'USER') {
      return NextResponse.json({ success: false, error: 'Hanya karyawan yang bisa absen' }, { status: 403 });
    }

    const karyawan = await prisma.karyawan.findUnique({
      where: { user_id: BigInt(userId) },
      include: { jenis_karyawan: true },
    });

    if (!karyawan || karyawan.status !== 'AKTIF') {
      return NextResponse.json({ success: false, error: 'Karyawan tidak aktif' }, { status: 403 });
    }

    // Gunakan tanggal lokal (Indonesia WIB = UTC+7)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const today = new Date(todayStr + 'T00:00:00.000Z');
    
    console.log('Absen masuk - karyawan:', karyawan.nama, ', todayStr:', todayStr);

    // Cek apakah sudah ada absensi hari ini
    const existingAbsensi = await prisma.absensi.findFirst({
      where: {
        karyawan_id: karyawan.id,
        tanggal: today,
      },
    });

    if (existingAbsensi) {
      return NextResponse.json({ success: false, error: 'Sudah melakukan check-in hari ini' }, { status: 400 });
    }

    // Cek apakah ada izin/cuti yang disetujui untuk hari ini
    const approvedIzinCuti = await prisma.izinCuti.findFirst({
      where: {
        karyawan_id: karyawan.id,
        status: 'APPROVED',
        tanggal_mulai: { lte: today },
        tanggal_selesai: { gte: today },
      },
    });

    if (approvedIzinCuti) {
      return NextResponse.json({ 
        success: false, 
        error: `Tidak dapat melakukan absensi. Anda sedang ${approvedIzinCuti.jenis.toLowerCase()} yang telah disetujui` 
      }, { status: 400 });
    }

    // Parse FormData
    const formData = await req.formData();
    const photo = formData.get('photo') as File | null;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);

    // Validasi foto wajib
    if (!photo) {
      return NextResponse.json({ success: false, error: 'Foto wajib diambil untuk absen masuk' }, { status: 400 });
    }

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json({ success: false, error: 'Tipe file tidak valid. Gunakan JPG, PNG, atau WebP' }, { status: 400 });
    }

    // Validasi ukuran file
    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Ukuran foto maksimal 2MB' }, { status: 400 });
    }

    // Validasi koordinat
    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ success: false, error: 'Lokasi GPS tidak valid' }, { status: 400 });
    }
    
    // Validasi lokasi (bisa dinonaktifkan via env)
    if (!SKIP_LOCATION_CHECK) {
      const distance = calculateDistance(latitude, longitude, OFFICE_LAT, OFFICE_LON);
      if (distance > MAX_DISTANCE) {
        return NextResponse.json({ 
          success: false, 
          error: `Di luar radius lokasi kerja (${Math.round(distance)}m dari kantor, max ${MAX_DISTANCE}m)` 
        }, { status: 400 });
      }
    }

    const currentTime = new Date();
    
    // Hitung batas waktu toleransi
    const jamMasukNormal = karyawan.jenis_karyawan.jam_masuk;
    const toleransi = karyawan.jenis_karyawan.toleransi_terlambat || 15;
    
    const batasToleransi = new Date();
    batasToleransi.setHours(jamMasukNormal.getHours(), jamMasukNormal.getMinutes() + toleransi, 0, 0);
    
    const status = currentTime <= batasToleransi ? 'HADIR' : 'TERLAMBAT';

    // Proses foto dengan watermark
    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    
    // Resize foto terlebih dahulu
    const resizedPhoto = await sharp(photoBuffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    
    // Dapatkan metadata gambar SETELAH resize
    const metadata = await sharp(resizedPhoto).metadata();
    const imgWidth = metadata.width || 800;
    
    // Buat watermark SVG dengan ukuran yang sesuai
    const watermarkSvg = createWatermarkSvg(
      karyawan.nama,
      formatDateTime(currentTime),
      latitude,
      longitude,
      Math.min(imgWidth - 20, 400)
    );
    
    // Composite watermark ke foto yang sudah di-resize
    const watermarkBuffer = Buffer.from(watermarkSvg);
    const processedPhoto = await sharp(resizedPhoto)
      .composite([
        {
          input: watermarkBuffer,
          gravity: 'southwest',
          blend: 'over'
        }
      ])
      .jpeg({ quality: 100 })
      .toBuffer();

    // Simpan foto ke folder lokal
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'absensi', `${year}-${month}`);
    await fs.mkdir(uploadDir, { recursive: true });
    
    const fileName = `masuk_${karyawan.nip}_${year}${month}${day}_${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, processedPhoto);
    
    // Path relatif untuk disimpan di database
    const fotoPath = `/uploads/absensi/${year}-${month}/${fileName}`;

    const absensi = await prisma.absensi.create({
      data: {
        karyawan_id: karyawan.id,
        tanggal: today,
        jam_masuk: currentTime,
        latitude,
        longitude,
        status,
        foto_masuk: fotoPath,
      },
    });
    
    console.log('Absensi created:', {
      id: absensi.id.toString(),
      karyawan_id: absensi.karyawan_id.toString(),
      tanggal: absensi.tanggal.toISOString(),
      status: absensi.status,
      foto_masuk: absensi.foto_masuk
    });

    return NextResponse.json({ 
      success: true,
      message: `Absen masuk berhasil! Status: ${status}`,
      data: {
        jam_masuk: currentTime.toISOString(),
        status,
        foto_masuk: fotoPath
      }
    });
  } catch (error) {
    console.error('Error absen masuk:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
