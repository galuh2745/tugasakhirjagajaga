'use client';

import React from 'react';
import UserSidebar from '@/components/sidebar/UserSidebar';
import { PageTransition } from '@/components/ui/page-transition';

interface UserLayoutProps {
  children: React.ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-72">
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
