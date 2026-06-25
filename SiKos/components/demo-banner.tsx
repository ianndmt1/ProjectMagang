'use client';

import React from 'react';
import { useApp } from '@/app/providers';
import { Database, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DemoBanner() {
  const { isDemo } = useApp();

  if (!isDemo) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-transparent border-b border-amber-500/20 text-amber-600 dark:text-amber-400 py-2.5 px-4 text-xs font-medium flex items-center justify-between backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <Database className="w-3.5 h-3.5 animate-pulse text-amber-500" />
        <span>
          <strong>Mode Demo Aktif:</strong> Berjalan secara lokal dengan data tiruan. Perubahan akan disimpan di penyimpanan lokal.
        </span>
      </div>
      <Link
        href="/settings"
        className="flex items-center gap-1 hover:underline hover:opacity-95 transition-opacity"
      >
        Konfigurasi Supabase <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
