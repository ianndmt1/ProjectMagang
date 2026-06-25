'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  mockOrders,
  Order,
  OrderStatus,
  orderStatusLabel,
  formatIDR,
} from '@/lib/mock-data';
import ThemeToggle from '@/components/ui/theme-toggle';
import {
  X,
  Layers,
  ClipboardList,
  Compass,
  Home,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  Phone,
  LogOut,
} from 'lucide-react';

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  menunggu_pembayaran: 'sudah_bayar',
  sudah_bayar: 'selesai',
  selesai: null,
  dibatalkan: null,
};

const STATUS_NEXT_LABEL: Record<OrderStatus, string | null> = {
  menunggu_pembayaran: 'Konfirmasi Bayar',
  sudah_bayar: 'Tandai Selesai',
  selesai: null,
  dibatalkan: null,
};

const LOCAL_STATUS_STYLES: Record<OrderStatus, string> = {
  menunggu_pembayaran: 'bg-mustard/10 text-mustard border-mustard/30',
  sudah_bayar: 'bg-rust/10 text-rust border-rust/30',
  selesai: 'bg-olive/10 text-olive border-olive/30',
  dibatalkan: 'bg-hairline text-text-muted border-hairline',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPesananPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleAdvanceStatus = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const next = STATUS_FLOW[o.status];
        if (!next) return o;
        return { ...o, status: next };
      })
    );
  };

  const handleCancel = (orderId: string) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId ? { ...o, status: 'dibatalkan' } : o
      )
    );
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push('/admin/login');
    router.refresh();
  };

  const filteredOrders =
    filterStatus === 'all'
      ? orders
      : orders.filter(o => o.status === filterStatus);

  const counts = {
    all: orders.length,
    menunggu_pembayaran: orders.filter(o => o.status === 'menunggu_pembayaran').length,
    sudah_bayar: orders.filter(o => o.status === 'sudah_bayar').length,
    selesai: orders.filter(o => o.status === 'selesai').length,
    dibatalkan: orders.filter(o => o.status === 'dibatalkan').length,
  };

  const filterTabs: { label: string; key: OrderStatus | 'all' }[] = [
    { label: `Semua (${counts.all})`, key: 'all' },
    { label: `Menunggu (${counts.menunggu_pembayaran})`, key: 'menunggu_pembayaran' },
    { label: `Sudah Bayar (${counts.sudah_bayar})`, key: 'sudah_bayar' },
    { label: `Selesai (${counts.selesai})`, key: 'selesai' },
    { label: `Batal (${counts.dibatalkan})`, key: 'dibatalkan' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F2ED] flex flex-col font-sans text-text-main selection:bg-rust selection:text-paper">

      {/* ── Header ── */}
      <header className="w-full bg-[#1A1A1A] border-b border-white/5 sticky top-0 z-30 select-none text-[#F8F6F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Brand logo */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <Link href="/admin">
                <span className="font-serif italic text-lg font-bold tracking-wide text-[#F8F6F1] hover:text-[#C8A882] transition-colors">
                  Santdoor<span className="text-tan font-sans font-normal not-italic text-xs tracking-widest ml-1">.ADMIN</span>
                </span>
              </Link>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 text-[9px] bg-[#C8A882]/15 text-[#C8A882] border border-[#C8A882]/20 font-bold font-mono tracking-widest uppercase rounded-[2px]">
                Depot Klaten B.03
              </span>
            </div>

            {/* Main tabs */}
            <nav className="flex space-x-5 sm:space-x-8 h-full">
              <Link
                href="/admin"
                className="flex items-center px-1 h-full border-b-2 border-transparent font-semibold text-xs sm:text-sm tracking-widest uppercase text-[#F8F6F1]/60 hover:text-[#C8A882] transition-all"
              >
                Kelola Stok
              </Link>
              <button
                className="flex items-center px-1 h-full border-b-2 border-[#C8A882] text-[#C8A882] font-semibold text-xs sm:text-sm tracking-widest uppercase transition-colors cursor-pointer"
              >
                Daftar Pesanan
              </button>
              <Link
                href="/admin/marketing"
                className="hidden sm:flex items-center px-1 h-full border-b-2 border-transparent font-semibold text-xs sm:text-sm tracking-widest uppercase text-[#F8F6F1]/60 hover:text-[#C8A882] transition-all"
              >
                Analisis Marketing
              </Link>
              <Link
                href="/admin?tab=ai"
                className="flex items-center px-1 h-full border-b-2 border-transparent font-semibold text-xs sm:text-sm tracking-widest uppercase text-[#F8F6F1]/60 hover:text-[#C8A882] transition-all"
              >
                AI Co-Pilot
              </Link>
            </nav>

            {/* Right: Quick Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/katalog"
                className="p-2 border border-white/10 hover:border-[#C8A882]/50 bg-white/5 hover:bg-white/10 text-[#F8F6F1]/70 hover:text-[#C8A882] flex items-center space-x-1.5 transition-all text-xs font-semibold rounded-[2px]"
                title="Lihat Toko"
              >
                <Compass className="w-4 h-4" />
                <span className="hidden md:inline font-sans uppercase tracking-wider text-[10px]">Lihat Toko</span>
              </Link>
              <Link
                href="/"
                className="p-2 border border-white/10 hover:border-[#C8A882]/50 bg-white/5 hover:bg-white/10 text-[#F8F6F1]/70 hover:text-[#C8A882] flex items-center space-x-1.5 transition-all text-xs font-semibold rounded-[2px]"
                title="Keluar ke Beranda"
              >
                <Home className="w-4 h-4" />
                <span className="hidden md:inline font-sans uppercase tracking-wider text-[10px]">Beranda</span>
              </Link>
              <ThemeToggle size="sm" />
              <button
                onClick={handleLogout}
                className="p-2 border border-rust/30 hover:border-rust hover:bg-rust/10 text-rust flex items-center space-x-1.5 transition-all text-xs font-semibold cursor-pointer rounded-[2px]"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline font-sans uppercase tracking-wider text-[10px]">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow bg-[#F4F2ED]">
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-5 border-b border-[#E8E6E1] gap-4">
            <div>
              <div className="flex items-center space-x-2 font-mono text-[9px] text-tan uppercase font-bold tracking-widest mb-1">
                <span>Pengendali Operasional · Pesanan Masuk</span>
              </div>
              <h2 className="font-serif italic text-2xl font-bold text-text-main">
                Daftar Pesanan
              </h2>
            </div>
            <div className="font-mono text-[9px] text-text-muted text-right tracking-widest leading-relaxed">
              <span>Total Pesanan: {counts.all}</span><br />
              <span className="text-tan font-semibold">Menunggu: {counts.menunggu_pembayaran}</span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 font-sans text-xs font-semibold tracking-widest uppercase">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-4 py-2 border transition-all cursor-pointer rounded-[2px] ${
                  filterStatus === tab.key
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                    : 'bg-white border-[#E8E6E1] text-text-muted hover:border-[#1A1A1A] hover:text-text-main'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-[#E8E6E1] bg-white flex flex-col items-center justify-center rounded-[2px]">
                <ClipboardList className="w-10 h-10 text-tan mb-3" />
                <p className="font-sans text-xs text-text-muted uppercase tracking-widest font-semibold">
                  Tidak ada pesanan dengan status ini
                </p>
              </div>
            ) : (
              filteredOrders.map(order => {
                const isExpanded = expandedId === order.id;
                const nextStatus = STATUS_FLOW[order.status];
                const nextLabel = STATUS_NEXT_LABEL[order.status];
                const canCancel = order.status === 'menunggu_pembayaran' || order.status === 'sudah_bayar';

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-[#E8E6E1] overflow-hidden rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]"
                  >
                    {/* Order Row */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">

                      {/* Left: ID + Buyer */}
                      <div className="flex-grow min-w-0 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-[10px] text-tan font-bold uppercase tracking-wider">
                            #{order.id.toUpperCase()}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 text-[9px] uppercase font-bold border ${LOCAL_STATUS_STYLES[order.status]}`}>
                            {orderStatusLabel[order.status]}
                          </span>
                        </div>
                        <p className="font-sans text-sm font-semibold text-text-main uppercase tracking-wider">
                          {order.buyerName}
                        </p>
                        <p className="font-sans text-xs text-text-muted">
                          LOT N°{order.lotNumber} — <span className="font-semibold text-text-main">{order.productBrand}</span> {order.productName} / Size {order.size}
                        </p>
                      </div>

                      {/* Center: Price + Date */}
                      <div className="flex-shrink-0 text-left sm:text-right">
                        <p className="font-mono text-sm font-bold text-text-main">{formatIDR(order.price)}</p>
                        <p className="font-mono text-[9px] text-text-muted mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0 justify-end sm:justify-start">
                        {nextLabel && nextStatus && (
                          <button
                            onClick={() => handleAdvanceStatus(order.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8472A] text-white font-sans text-xs font-semibold uppercase tracking-widest border border-transparent hover:bg-[#C13E24] rounded-[2px] active:scale-95 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{nextLabel}</span>
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-text-muted hover:text-text-main font-sans text-[11px] font-semibold uppercase tracking-widest border border-[#E8E6E1] hover:border-text-main rounded-[2px] active:scale-95 transition-all cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Batalkan</span>
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          className="p-1.5 border border-[#E8E6E1] text-text-muted hover:text-text-main hover:border-text-main/40 bg-white transition-all rounded-[2px] cursor-pointer"
                          aria-label="Toggle order detail"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <div className="border-t border-[#E8E6E1] bg-[#F8F6F1] px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs">
                        <div className="space-y-1">
                          <p className="text-text-muted uppercase font-bold tracking-wider text-[9px]">// Pembeli</p>
                          <p className="text-text-main font-bold">{order.buyerName}</p>
                          <a
                            href={`https://wa.me/62${order.buyerPhone.replace(/^0/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-rust hover:text-rust/80 transition-colors font-medium"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{order.buyerPhone}</span>
                          </a>
                        </div>
                        <div className="space-y-1">
                          <p className="text-text-muted uppercase font-bold tracking-wider text-[9px]">// Produk</p>
                          <p className="text-text-main">{order.productBrand} — {order.productName}</p>
                          <p className="text-tan font-bold">LOT N°{order.lotNumber} / Size {order.size} / {formatIDR(order.price)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-text-muted uppercase font-bold tracking-wider text-[9px]">// Catatan</p>
                          <p className="text-text-main leading-relaxed">
                            {order.notes ?? '—'}
                          </p>
                          <div className="flex items-center gap-1 text-text-muted text-[9px] mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
