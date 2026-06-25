'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import DemoBanner from '@/components/demo-banner';
import { useApp } from '@/app/providers';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold tracking-wide text-slate-400">Loading SiKos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* 1. Top Demo Banner */}
      <DemoBanner />

      {/* 2. Page Core Structure */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:pl-64 min-h-screen">
          {/* Top Navbar */}
          <Navbar onMenuClick={() => setSidebarOpen(true)} />

          {/* Page Contents */}
          <main className="flex-1 p-6 overflow-y-auto animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
