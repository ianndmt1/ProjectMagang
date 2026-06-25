'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/supabase';
import { Room, Tenant, Payment } from '@/lib/mockData';
import { useApp } from '@/app/providers';
import StatsCard from '@/components/stats-card';
import {
  DoorOpen,
  Users,
  DollarSign,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Receipt
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const statusLabel: Record<string, string> = {
  occupied: 'Terisi',
  empty: 'Kosong',
  overdue: 'Jatuh Tempo',
  paid: 'Lunas',
  pending: 'Menunggu',
  late: 'Terlambat',
  cash: 'Tunai',
  transfer: 'Transfer',
};

export default function DashboardPage() {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [rList, tList, pList] = await Promise.all([
          db.rooms.list(),
          db.tenants.list(),
          db.payments.list(),
        ]);
        setRooms(rList);
        setTenants(tList);
        setPayments(pList);
      } catch (err) {
        console.error(err);
        showToast('Gagal memuat statistik dashboard', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Memuat analitik dashboard...</p>
      </div>
    );
  }

  // Kalkulasi Metrik
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const emptyRooms = rooms.filter((r) => r.status === 'empty').length;
  const overdueRooms = rooms.filter((r) => r.status === 'overdue').length;
  const activeTenants = tenants.filter((t) => t.status === 'active').length;

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthPaidPayments = payments.filter((p) => {
    const pDate = new Date(p.payment_date);
    return (
      p.status === 'paid' &&
      pDate.getMonth() === currentMonth &&
      pDate.getFullYear() === currentYear
    );
  });

  const totalRevenueThisMonth = thisMonthPaidPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingPaymentsCount = payments.filter((p) => p.status === 'pending' || p.status === 'late').length;
  const recentPayments = payments.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 1. Header & Aksi Cepat */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Selamat Datang!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Berikut ringkasan bisnis kos Anda hari ini.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/payments"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Catat Pembayaran
          </Link>
          <Link
            href="/tenants"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Penyewa
          </Link>
        </div>
      </div>

      {/* 2. Grid Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Tingkat Hunian"
          value={`${occupancyRate}%`}
          icon={DoorOpen}
          subtext={`${occupiedRooms} dari ${totalRooms} kamar terisi`}
          trend={{ value: `${emptyRooms} tersedia`, type: 'neutral' }}
          color="indigo"
        />
        <StatsCard
          title="Penyewa Aktif"
          value={activeTenants}
          icon={Users}
          subtext="Penyewa aktif terdaftar"
          color="emerald"
        />
        <StatsCard
          title="Total Pendapatan (Bulan Ini)"
          value={formatCurrency(totalRevenueThisMonth)}
          icon={DollarSign}
          subtext="Dihitung dari transaksi lunas"
          trend={{ value: '+8.2%', type: 'positive' }}
          color="emerald"
        />
        <StatsCard
          title="Tagihan Tertunggak"
          value={pendingPaymentsCount}
          icon={AlertTriangle}
          subtext="Tagihan pending dan jatuh tempo"
          color={pendingPaymentsCount > 0 ? 'rose' : 'indigo'}
        />
      </div>

      {/* 3. Grid Status Kamar & Pembayaran Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Grid Status Kamar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Ringkasan Status Kamar</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Peta visual kamar dan status sewanya.</p>
            </div>
            <Link
              href="/rooms"
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1"
            >
              Kelola Kamar <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`border rounded-xl p-3.5 flex flex-col justify-between items-center text-center gap-1.5 transition-all hover:scale-[1.03] ${
                  room.status === 'occupied'
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : room.status === 'overdue'
                    ? 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <span className="font-bold text-base tracking-tight">{room.room_number}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider scale-90">
                  {statusLabel[room.status] ?? room.status}
                </span>
              </div>
            ))}
            {rooms.length === 0 && (
              <div className="col-span-full py-8 text-center text-xs text-slate-400 font-medium">
                Belum ada kamar. Tambahkan kamar di halaman Manajemen Kamar.
              </div>
            )}
          </div>

          {/* Legenda Warna */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" /> Kosong
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Terisi
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Jatuh Tempo
            </span>
          </div>
        </div>

        {/* Widget Pembayaran Terbaru */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Pembayaran Terbaru</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Transaksi yang baru dicatat.</p>
              </div>
              <Link
                href="/payments"
                className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1"
              >
                Semua Log <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[130px]">
                        {payment.tenant_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Kamar {payment.room_number} • {statusLabel[payment.payment_method] ?? payment.payment_method}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(payment.amount)}
                    </span>
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        payment.status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : payment.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-rose-500/15 text-rose-500'
                      }`}
                    >
                      {statusLabel[payment.status] ?? payment.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 font-medium">
                  Belum ada catatan pembayaran.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>
              Pendapatan bersih dihitung otomatis saat invoice ditandai <strong>Lunas</strong>.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
