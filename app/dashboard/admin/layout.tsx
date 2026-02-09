'use client';

import React from 'react';
import { AdminSidebar } from '@/components/sidebar';
import AdminNavbar from '@/components/AdminNavbar';
import { PageTransition } from '@/components/ui/page-transition';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100/50 flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header spacing */}
        <div className="lg:hidden h-16" />

        {/* Navbar */}
        <AdminNavbar />

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
