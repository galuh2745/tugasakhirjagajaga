'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronsLeft } from 'lucide-react';
import { SidebarMenu } from './SidebarMenu';
import { MenuItem, MenuGroup } from './types';
import {
  DashboardIcon,
  UsersIcon,
  SettingsIcon,
  CalendarIcon,
  ClipboardIcon,
  BoxIcon,
  CurrencyIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  InboxInIcon,
  InboxOutIcon,
  TruckIcon,
  SkullIcon,
  OfficeBuildingIcon,
  WarehouseIcon,
} from './icons';

// Menu groups configuration
const getAdminMenuGroups = (pendingCount: number = 0, resetRequestsCount: number = 0): MenuGroup[] => [
  {
    title: 'Menu Utama',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard/admin',
        icon: <DashboardIcon />,
      },
      {
        id: 'manajemen-karyawan',
        label: 'Manajemen Karyawan',
        icon: <UsersIcon />,
        href: '/dashboard/admin/karyawan',
      },
      {
        id: 'data-absensi',
        label: 'Riwayat Absensi',
        icon: <CalendarIcon />,
        href: '/dashboard/admin/absensi',
      },
    ],
  },
  {
    title: 'Operasional',
    items: [
      {
        id: 'izin-cuti',
        label: 'Izin & Cuti',
        href: '/dashboard/admin/izin-cuti',
        icon: <ClipboardIcon />,
        badge: pendingCount > 0 ? pendingCount.toString() : undefined,
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: <BoxIcon />,
        children: [
          {
            id: 'master-perusahaan',
            label: 'Master Perusahaan',
            href: '/dashboard/admin/inventory/perusahaan',
            icon: <OfficeBuildingIcon className="w-4 h-4" />,
          },
          {
            id: 'jenis-daging',
            label: 'Master Jenis Daging',
            href: '/dashboard/admin/inventory/jenis-daging',
            icon: <BoxIcon className="w-4 h-4" />,
          },
          {
            id: 'barang-masuk',
            label: 'Barang Masuk',
            href: '/dashboard/admin/inventory/barang-masuk',
            icon: <InboxInIcon className="w-4 h-4" />,
          },
          {
            id: 'ayam-mati',
            label: 'Ayam Mati',
            href: '/dashboard/admin/inventory/ayam-mati',
            icon: <SkullIcon className="w-4 h-4" />,
          },
          {
            id: 'barang-keluar',
            label: 'Barang Keluar',
            icon: <InboxOutIcon className="w-4 h-4" />,
            children: [
              {
                id: 'ayam-hidup',
                label: 'Ayam Hidup',
                href: '/dashboard/admin/inventory/barang-keluar/ayam-hidup',
                icon: <TruckIcon className="w-4 h-4" />,
              },
              {
                id: 'daging-ayam',
                label: 'Daging Ayam',
                href: '/dashboard/admin/inventory/barang-keluar/daging',
                icon: <BoxIcon className="w-4 h-4" />,
              },
            ],
          },
          {
            id: 'stok-ayam',
            label: 'Stok Ayam',
            href: '/dashboard/admin/inventory/stok',
            icon: <WarehouseIcon className="w-4 h-4" />,
          },
        ],
      },
      {
        id: 'keuangan',
        label: 'Keuangan',
        icon: <CurrencyIcon />,
        href: '/dashboard/admin/keuangan',
      },
    ],
  },
  {
    title: 'Sistem',
    items: [
      {
        id: 'manajemen-account',
        label: 'Manajemen Account',
        icon: <SettingsIcon />,
        badge: resetRequestsCount > 0 ? resetRequestsCount.toString() : undefined,
        children: [
          {
            id: 'daftar-akun',
            label: 'Daftar Akun',
            href: '/dashboard/admin/accounts',
            icon: <UsersIcon className="w-4 h-4" />,
          },
          {
            id: 'permintaan-reset',
            label: 'Permintaan Reset',
            href: '/dashboard/admin/accounts/reset-requests',
            icon: <ClipboardIcon className="w-4 h-4" />,
            badge: resetRequestsCount > 0 ? resetRequestsCount.toString() : undefined,
          },
          {
            id: 'ubah-password',
            label: 'Ubah Password',
            href: '/dashboard/admin/account/change-password',
            icon: <SettingsIcon className="w-4 h-4" />,
          },
        ],
      },
    ],
  },
];

interface AdminSidebarProps {
  className?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ className = '' }) => {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [resetRequestsCount, setResetRequestsCount] = useState(0);

  // Fetch pending izin/cuti count and reset requests count
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [izinRes, resetRes] = await Promise.all([
          fetch('/api/izin-cuti/pending-count', { credentials: 'include' }),
          fetch('/api/accounts/reset-requests/count', { credentials: 'include' }),
        ]);
        if (izinRes.ok) {
          const result = await izinRes.json();
          if (result.success) setPendingCount(result.data.pending_count);
        }
        if (resetRes.ok) {
          const result = await resetRes.json();
          if (result.success) setResetRequestsCount(result.count);
        }
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setIsMobileOpen(false); }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('admin-sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      if (
        isMobileOpen && sidebar && !sidebar.contains(event.target as Node) &&
        toggleButton && !toggleButton.contains(event.target as Node)
      ) {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const sidebarContent = (
    <>
      {/* ── Header / Logo ── */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 h-16 border-b border-gray-200/80`}>
        {isCollapsed ? (
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-black flex items-center justify-center shadow-sm">
            <Image src="/images/logo/logocv.jpg" alt="Logo" width={36} height={36} className="object-contain" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-black flex items-center justify-center shadow-sm">
              <Image src="/images/logo/logocv.jpg" alt="Logo" width={36} height={36} className="object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-800 truncate leading-tight">CV Aswi Sentosa</h1>
              <p className="text-[11px] text-gray-400 leading-tight">Admin Panel</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Close sidebar"
        >
          <CloseIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* ── Menu Items ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <SidebarMenu groups={getAdminMenuGroups(pendingCount, resetRequestsCount)} isCollapsed={isCollapsed} />
      </div>

      {/* ── Collapse Toggle (Desktop) ── */}
      <div className="hidden lg:flex items-center justify-center px-3 py-2 border-t border-gray-200/80">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-all duration-150"
          title={isCollapsed ? 'Perluas sidebar' : 'Kecilkan sidebar'}
        >
          <ChevronsLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          {!isCollapsed && <span className="text-xs font-medium">Kecilkan</span>}
        </button>
      </div>

      {/* ── Footer / Logout ── */}
      <div className="px-3 py-3 border-t border-gray-200/80">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`
            flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} w-full py-2.5 rounded-lg text-sm font-medium
            transition-all duration-150 ease-in-out
            ${isLoggingOut
              ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
              : 'text-red-500 hover:bg-red-50 hover:text-red-600'
            }
          `}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogoutIcon className="w-4.5 h-4.5" />
          {!isCollapsed && <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        id="sidebar-toggle"
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-150 border border-gray-100"
        aria-label="Open sidebar"
      >
        <MenuIcon className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${isCollapsed ? 'w-18' : 'w-64'}
          bg-gray-50/80 backdrop-blur-sm border-r border-gray-200/80 shadow-[1px_0_3px_rgba(0,0,0,0.03)]
          flex flex-col
          transform transition-all duration-300 ease-in-out
          lg:transform-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${className}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
