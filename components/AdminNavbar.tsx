'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, Calendar, User, LogOut, KeyRound } from 'lucide-react';

// ── Breadcrumb label mapping ────────────────────────────────────────────────
const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  admin: 'Admin',
  karyawan: 'Manajemen Karyawan',
  absensi: 'Riwayat Absensi',
  'izin-cuti': 'Izin & Cuti',
  inventory: 'Inventory',
  perusahaan: 'Master Perusahaan',
  'jenis-daging': 'Master Jenis Daging',
  'barang-masuk': 'Barang Masuk',
  'barang-keluar': 'Barang Keluar',
  'ayam-hidup': 'Ayam Hidup',
  daging: 'Daging Ayam',
  'ayam-mati': 'Ayam Mati',
  stok: 'Stok Ayam',
  keuangan: 'Keuangan',
  accounts: 'Daftar Akun',
  account: 'Akun',
  'reset-requests': 'Permintaan Reset',
  'change-password': 'Ubah Password',
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  // Remove 'dashboard' and 'admin' prefix for cleaner display
  const displaySegments = segments.slice(2); // skip 'dashboard/admin'
  if (displaySegments.length === 0) return [{ label: 'Dashboard', href: '/dashboard/admin' }];

  return displaySegments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 3).join('/');
    const label = labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
    return { label, href };
  });
}

function getPageTitle(pathname: string): string {
  const crumbs = getBreadcrumbs(pathname);
  return crumbs[crumbs.length - 1]?.label || 'Dashboard';
}

function formatDate(): string {
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [todayDate, setTodayDate] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTodayDate(formatDate());
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
  };

  const crumbs = getBreadcrumbs(pathname);
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left: Page title + breadcrumb */}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-gray-800 truncate leading-tight">
            {pageTitle}
          </h2>
          <nav className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
            <span className="hover:text-gray-600 cursor-default">Admin</span>
            {crumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
                {idx === crumbs.length - 1 ? (
                  <span className="text-gray-600 font-medium truncate">{crumb.label}</span>
                ) : (
                  <span className="hover:text-gray-600 cursor-default truncate">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right: Date + Avatar */}
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {/* Date */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{todayDate}</span>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-gray-200" />

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100/80 transition-colors duration-150"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">AD</span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium text-gray-700 leading-tight">Administrator</p>
                <p className="text-[10px] text-gray-400 leading-tight">Admin</p>
              </div>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-lg border border-gray-200/80 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={() => { setDropdownOpen(false); router.push('/dashboard/admin/account/change-password'); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-gray-400" />
                  <span>Ubah Password</span>
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
