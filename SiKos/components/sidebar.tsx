'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/app/providers';
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  CreditCard,
  FileBarChart,
  Settings,
  ShieldAlert,
  LogOut,
  Home
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const roleLabel: Record<string, string> = {
  owner: 'Pemilik',
  admin: 'Admin',
};

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useApp();

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Kamar', href: '/rooms', icon: DoorOpen },
    { label: 'Penyewa', href: '/tenants', icon: Users },
    { label: 'Pembayaran', href: '/payments', icon: CreditCard },
    { label: 'Laporan', href: '/reports', icon: FileBarChart },
    { label: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  // Tambahkan Manajemen Pengguna jika pemilik
  if (user?.role === 'owner') {
    menuItems.push({ label: 'Pengguna', href: '/user-management', icon: ShieldAlert });
  }

  return (
    <>
      {/* Overlay Sidebar Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/30">
              S
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                SiKos
              </span>
              <span className="text-[10px] block text-slate-400 font-medium">Manajemen Kos</span>
            </div>
          </div>

          {/* Navigasi */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Kartu Pengguna & Keluar */}
        <div className="p-4 border-t border-slate-800">
          {user && (
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 mb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-indigo-400 border border-slate-600 uppercase">
                {user.name.substring(0, 2)}
              </div>
              <div className="overflow-hidden">
                <span className="block text-sm font-semibold text-slate-200 truncate">{user.name}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-1">
                  {roleLabel[user.role] ?? user.role}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 text-sm font-medium text-slate-400 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
