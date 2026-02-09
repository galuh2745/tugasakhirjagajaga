'use client';

import React from 'react';
import { AdminSidebar } from '@/components/sidebar';
import { PageTransition } from '@/components/ui/page-transition';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-0">
        {/* Mobile header spacing */}
        <div className="lg:hidden h-16" />
        
        {/* Content */}
        <div className="p-4 lg:p-6">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
