'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, ClipboardList, History, User, LogOut, Menu, X } from 'lucide-react';

interface UserInfo {
  nama: string;
  nip: string;
  jenis_karyawan: string;
}

export default function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            const karyawan = data.user.karyawan;
            setUserInfo({
              nama: karyawan?.nama || data.user.name || 'User',
              nip: karyawan?.nip || '-',
              jenis_karyawan: karyawan?.jenis_karyawan?.nama_jenis || 'Karyawan',
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { name: 'Absensi', href: '/dashboard/user', icon: <Clock className="w-5 h-5" />, description: 'Absen masuk & pulang' },
    { name: 'Izin & Cuti', href: '/dashboard/user/izin-cuti', icon: <ClipboardList className="w-5 h-5" />, description: 'Ajukan izin atau cuti' },
    { name: 'Riwayat Absensi', href: '/dashboard/user/riwayat', icon: <History className="w-5 h-5" />, description: 'Lihat riwayat kehadiran' },
    { name: 'Akun Saya', href: '/dashboard/user/akun', icon: <User className="w-5 h-5" />, description: 'Pengaturan akun' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard/user') return pathname === '/dashboard/user';
    return pathname.startsWith(href);
  };

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200/60 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-black flex items-center justify-center shadow-sm">
              <Image src="/images/logo/logocv.jpg" alt="Logo" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-semibold text-sm text-gray-800">Portal Karyawan</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-64
          bg-gray-50/80 backdrop-blur-sm border-r border-gray-200/80 shadow-[1px_0_3px_rgba(0,0,0,0.03)]
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* ── Logo ── */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200/80">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-black flex items-center justify-center shadow-sm">
              <Image src="/images/logo/logocv.jpg" alt="Logo" width={36} height={36} className="object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-800 truncate leading-tight">CV Aswi Sentosa</h1>
              <p className="text-[11px] text-gray-400 leading-tight">Portal Karyawan</p>
            </div>
          </div>

          {/* ── User Info ── */}
          {userInfo && (
            <div className="px-4 py-4 border-b border-gray-200/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm ring-2 ring-white">
                  <span className="text-white font-bold text-xs">
                    {userInfo.nama.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate leading-tight">{userInfo.nama}</p>
                  <p className="text-[11px] text-gray-400 leading-tight">{userInfo.nip}</p>
                </div>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600">
                  {userInfo.jenis_karyawan}
                </span>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Menu</span>
            </div>
            <div className="space-y-0.5">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    transition-all duration-150 ease-in-out group
                    ${isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 font-semibold border-l-3 border-blue-600 pl-2.25'
                      : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                    }
                  `}
                >
                  <span className={`shrink-0 transition-colors duration-150 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="leading-tight truncate">{item.name}</p>
                    <p className={`text-[11px] leading-tight mt-0.5 truncate ${isActive(item.href) ? 'text-blue-500/70' : 'text-gray-400'}`}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </nav>

          {/* ── Logout ── */}
          <div className="px-3 py-3 border-t border-gray-200/80">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
