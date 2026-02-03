'use client';

import React from 'react';
import UserSidebar from '@/components/sidebar/UserSidebar';

interface UserLayoutProps {
  children: React.ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-72">
        {/* Mobile header spacing */}
        <div className="lg:hidden h-16" />
        
        {/* Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
