'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SidebarMenu } from './SidebarMenu';
import { MenuItem } from './types';
import {
  DashboardIcon,
  UsersIcon,
  SettingsIcon,
  CalendarIcon,
  ClipboardIcon,
  ClockIcon,
  BoxIcon,
  CurrencyIcon,
  DocumentIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  UserPlusIcon,
  TruckIcon,
  BriefcaseIcon,
  HistoryIcon,
  CheckCircleIcon,
  InboxInIcon,
  InboxOutIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ChartIcon,
  FileTextIcon,
} from './icons';

// Menu configuration for Admin Sidebar (will be updated with dynamic badge)
const getAdminMenuItems = (pendingCount: number = 0, resetRequestsCount: number = 0): MenuItem[] => [
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
  {
    id: 'izin-cuti',
    label: 'Izin & Cuti',
    href: '/dashboard/admin/izin-cuti',
    icon: <ClipboardIcon />,
    badge: pendingCount > 0 ? pendingCount.toString() : undefined,
  },
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
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <BoxIcon />,
    isDisabled: true,
    badge: 'Coming Soon',
    children: [
      {
        id: 'stok-barang',
        label: 'Stok Barang',
        icon: <BoxIcon className="w-4 h-4" />,
        isDisabled: true,
      },
      {
        id: 'barang-masuk',
        label: 'Barang Masuk',
        icon: <InboxInIcon className="w-4 h-4" />,
        isDisabled: true,
      },
      {
        id: 'barang-keluar',
        label: 'Barang Keluar',
        icon: <InboxOutIcon className="w-4 h-4" />,
        isDisabled: true,
      },
    ],
  },
  {
    id: 'keuangan',
    label: 'Keuangan',
    icon: <CurrencyIcon />,
    isDisabled: true,
    badge: 'Coming Soon',
    children: [
      {
        id: 'pemasukan',
        label: 'Pemasukan',
        icon: <TrendingUpIcon className="w-4 h-4" />,
        isDisabled: true,
      },
      {
        id: 'pengeluaran',
        label: 'Pengeluaran',
        icon: <TrendingDownIcon className="w-4 h-4" />,
        isDisabled: true,
      },
      {
        id: 'laporan-keuangan',
        label: 'Laporan Keuangan',
        icon: <ChartIcon className="w-4 h-4" />,
        isDisabled: true,
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
        // Fetch izin/cuti pending count
        const izinCutiResponse = await fetch('/api/izin-cuti/pending-count', {
          credentials: 'include',
        });
        if (izinCutiResponse.ok) {
          const result = await izinCutiResponse.json();
          if (result.success) {
            setPendingCount(result.data.pending_count);
          }
        }

        // Fetch reset requests count
        const resetResponse = await fetch('/api/accounts/reset-requests/count', {
          credentials: 'include',
        });
        if (resetResponse.ok) {
          const result = await resetResponse.json();
          if (result.success) {
            setResetRequestsCount(result.count);
          }
        }
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
    
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('admin-sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      
      if (
        isMobileOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        toggleButton &&
        !toggleButton.contains(event.target as Node)
      ) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const sidebarContent = (
    <>
      {/* Header / Logo */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-gray-200`}>
        {isCollapsed ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex items-center justify-center">
            <Image
              src="/images/logo/logocv.jpg"
              alt="CV Aswi Sentosa Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex items-center justify-center">
              <Image
                src="/images/logo/logocv.jpg"
                alt="CV Aswi Sentosa Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">CV Aswi Sentosa</h1>
              <p className="text-xs text-gray-500">Sistem Absensi</p>
            </div>
          </div>
        )}
        {/* Close button for mobile */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close sidebar"
        >
          <CloseIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* User Info */}
      <div className={`p-4 border-b border-gray-200 bg-gray-50 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center" title="Administrator">
            <span className="text-blue-600 font-semibold text-sm">AD</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">AD</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Administrator</p>
              <p className="text-xs text-gray-500">Role: Admin</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <SidebarMenu items={getAdminMenuItems(pendingCount, resetRequestsCount)} isCollapsed={isCollapsed} />
      </div>

      {/* Toggle Collapse Button (Desktop) */}
      <div className="hidden lg:block p-2 border-t border-gray-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg 
            className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!isCollapsed && <span className="text-sm">Tutup</span>}
        </button>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`
            flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-3'} w-full px-4 py-3 rounded-lg
            transition-all duration-200 ease-in-out
            text-sm font-medium
            ${isLoggingOut 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            }
          `}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogoutIcon className="w-5 h-5" />
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
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        aria-label="Open sidebar"
      >
        <MenuIcon className="w-6 h-6 text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      <div
        className={`
          lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300
          ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${isCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-gray-200
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
