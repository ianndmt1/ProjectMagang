'use client';

import React from 'react';
import { Menu, Calendar } from 'lucide-react';
import { useApp } from '@/app/providers';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  onMenuClick: () => void;
}

const roleLabel: Record<string, string> = {
  owner: 'Pemilik',
  admin: 'Admin',
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useApp();
  const pathname = usePathname();

  // Peta rute ke judul halaman
  const getPageTitle = () => {
    const segments = pathname.split('/');
    const page = segments[segments.length - 1] || 'dashboard';

    switch (page) {
      case 'dashboard':
        return 'Dashboard';
      case 'rooms':
        return 'Manajemen Kamar';
      case 'tenants':
        return 'Direktori Penyewa';
      case 'payments':
        return 'Catatan Pembayaran';
      case 'reports':
        return 'Laporan Keuangan';
      case 'settings':
        return 'Pengaturan';
      case 'user-management':
        return 'Manajemen Pengguna';
      default:
        return 'SiKos';
    }
  };

  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Tombol Menu Mobile */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Tampilan Tanggal */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">{today}</span>
        </div>

        {/* Info Pengguna */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {user?.name || 'Memuat...'}
            </span>
            <span className="block text-[10px] text-indigo-500 dark:text-indigo-400 capitalize font-bold">
              {user?.role ? (roleLabel[user.role] ?? user.role) : ''}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
            {user?.name ? user.name.substring(0, 1).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
