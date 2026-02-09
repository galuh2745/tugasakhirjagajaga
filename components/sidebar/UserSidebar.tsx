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
    // Fetch user info
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
    {
      name: 'Absensi',
      href: '/dashboard/user',
      icon: <Clock className="w-5 h-5" />,
      description: 'Absen masuk & pulang',
    },
    {
      name: 'Izin & Cuti',
      href: '/dashboard/user/izin-cuti',
      icon: <ClipboardList className="w-5 h-5" />,
      description: 'Ajukan izin atau cuti',
    },
    {
      name: 'Riwayat Absensi',
      href: '/dashboard/user/riwayat',
      icon: <History className="w-5 h-5" />,
      description: 'Lihat riwayat kehadiran',
    },
    {
      name: 'Akun Saya',
      href: '/dashboard/user/akun',
      icon: <User className="w-5 h-5" />,
      description: 'Pengaturan akun',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard/user') {
      return pathname === '/dashboard/user';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-black flex items-center justify-center">
              <Image
                src="/images/logo/logocv.jpg"
                alt="CV Aswi Sentosa Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-gray-800">Absensi Karyawan</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out w-72
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-lg">
                <Image
                  src="/images/logo/logocv.jpg"
                  alt="CV Aswi Sentosa Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-gray-800">CV Aswi Sentosa</h1>
                <p className="text-xs text-gray-500">Portal Karyawan</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          {userInfo && (
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center ring-2 ring-white shadow-sm">
                  <span className="text-blue-600 font-semibold text-sm">
                    {userInfo.nama.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{userInfo.nama}</p>
                  <p className="text-xs text-gray-500">{userInfo.nip}</p>
                </div>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {userInfo.jenis_karyawan}
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive(item.href)
                      ? 'bg-red-50 text-red-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={isActive(item.href) ? 'text-red-600' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Keluar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
