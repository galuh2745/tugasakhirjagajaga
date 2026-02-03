import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import PDFDocument from 'pdfkit';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const { role } = payload as { userId: number; role: string };

    if (role !== 'ADMIN' && role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Forbidden - hanya admin yang bisa mengakses' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const tanggalMulai = searchParams.get('tanggal_mulai');
    const tanggalSelesai = searchParams.get('tanggal_selesai');
    const karyawanId = searchParams.get('karyawan_id');

    if (!tanggalMulai || !tanggalSelesai) {
      return NextResponse.json({ success: false, error: 'Tanggal mulai dan selesai harus diisi' }, { status: 400 });
    }

    // Build where clause
    const whereClause: any = {
      tanggal: {
        gte: new Date(tanggalMulai),
        lte: new Date(tanggalSelesai),
      },
    };

    if (karyawanId) {
      whereClause.karyawan_id = BigInt(karyawanId);
    }

    // Fetch data
    const dataLembur = await prisma.lembur.findMany({
      where: whereClause,
      include: {
        karyawan: {
          include: {
            jenis_karyawan: true,
          },
        },
      },
      orderBy: {
        tanggal: 'asc',
      },
    });

    if (dataLembur.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada data lembur untuk periode tersebut' }, { status: 404 });
    }

    // Calculate total hours
    const totalJamLembur = dataLembur.reduce((total, item) => total + Number(item.total_jam), 0);

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Uint8Array[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN LEMBUR KARYAWAN', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('CV Aswi Sentosa', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Periode: ${new Date(tanggalMulai).toLocaleDateString('id-ID')} - ${new Date(tanggalSelesai).toLocaleDateString('id-ID')}`, { align: 'center' });
    doc.moveDown(2);

    // Table headers
    const tableTop = doc.y;
    const tableHeaders = ['No', 'Nama Karyawan', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Total Jam', 'Keterangan'];
    const columnWidths = [30, 120, 80, 70, 70, 60, 80];
    let xPosition = 50;

    doc.fontSize(9).font('Helvetica-Bold');
    tableHeaders.forEach((header, i) => {
      doc.text(header, xPosition, tableTop, { width: columnWidths[i], align: 'left' });
      xPosition += columnWidths[i];
    });

    // Draw line under header
    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown(0.5);

    // Table data
    doc.font('Helvetica').fontSize(8);
    dataLembur.forEach((item, index) => {
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(9).font('Helvetica-Bold');
        let xPos = 50;
        tableHeaders.forEach((header, i) => {
          doc.text(header, xPos, doc.y, { width: columnWidths[i], align: 'left' });
          xPos += columnWidths[i];
        });
        doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(8);
      }

      const rowY = doc.y;
      xPosition = 50;

      // No
      doc.text((index + 1).toString(), xPosition, rowY, { width: columnWidths[0], align: 'left' });
      xPosition += columnWidths[0];

      // Nama Karyawan
      doc.text(item.karyawan.nama, xPosition, rowY, { width: columnWidths[1], align: 'left' });
      xPosition += columnWidths[1];

      // Tanggal
      doc.text(new Date(item.tanggal).toLocaleDateString('id-ID'), xPosition, rowY, { width: columnWidths[2], align: 'left' });
      xPosition += columnWidths[2];

      // Jam Mulai
      const jamMulai = new Date(item.jam_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      doc.text(jamMulai, xPosition, rowY, { width: columnWidths[3], align: 'left' });
      xPosition += columnWidths[3];

      // Jam Selesai
      const jamSelesai = new Date(item.jam_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      doc.text(jamSelesai, xPosition, rowY, { width: columnWidths[4], align: 'left' });
      xPosition += columnWidths[4];

      // Total Jam
      doc.text(Number(item.total_jam).toFixed(2), xPosition, rowY, { width: columnWidths[5], align: 'left' });
      xPosition += columnWidths[5];

      // Keterangan
      const keterangan = item.keterangan.length > 30 ? item.keterangan.substring(0, 30) + '...' : item.keterangan;
      doc.text(keterangan, xPosition, rowY, { width: columnWidths[6], align: 'left' });

      doc.moveDown(0.8);
    });

    // Summary
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text(`Total Jam Lembur: ${totalJamLembur.toFixed(2)} jam`, 50, doc.y, { align: 'right' });
    doc.text(`Total Data: ${dataLembur.length} record`, 50, doc.y + 15, { align: 'right' });

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, { align: 'left' });
    doc.text('Sistem Absensi Karyawan - CV Aswi Sentosa', { align: 'left' });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be fully generated
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Return PDF - convert Buffer to Uint8Array for NextResponse compatibility
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Laporan_Lembur_${tanggalMulai}_${tanggalSelesai}.pdf"`,
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
