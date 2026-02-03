import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistem Absensi Karyawan - CV Aswi Sentosa',
  description: 'Sistem Manajemen Absensi, Izin, Cuti, dan Lembur Karyawan',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}