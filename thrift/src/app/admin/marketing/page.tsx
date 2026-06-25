'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { mockProducts, Product } from '@/lib/mock-data';
import ThemeToggle from '@/components/ui/theme-toggle';
import {
  Compass,
  Home,
  LogOut,
  Sparkles,
  TrendingUp,
  Share2,
  FileText,
  Search,
} from 'lucide-react';

export default function AdminMarketingPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>(mockProducts[0]?.id || '');
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push('/admin/login');
    router.refresh();
  };

  // Find the selected product details
  const selectedProduct = useMemo(() => {
    return mockProducts.find(p => p.id === selectedProductId);
  }, [selectedProductId]);

  // Dynamically calculate brand trends count from mockProducts
  const brandTrends = useMemo(() => {
    const counts: Record<string, number> = {};
    mockProducts.forEach(p => {
      counts[p.brand] = (counts[p.brand] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  // Generate mock AI recommendations based on selected product details
  const mockAISuggestions = useMemo(() => {
    if (!selectedProduct) return null;

    const seoTitle = `[ORIGINAL SECOND] ${selectedProduct.brand} ${selectedProduct.name} - Ukuran ${selectedProduct.size} (Grade ${selectedProduct.grade}%)`;
    const seoDescription = `Beli jaket ${selectedProduct.brand} ${selectedProduct.name} original second dengan kondisi sangat baik (Grade ${selectedProduct.grade}%). Material premium, breathable, windproof, cocok untuk aktivitas luar ruangan atau pakaian kasual. Ukuran ${selectedProduct.size}. ${selectedProduct.defects ? `Catatan minus: ${selectedProduct.defects}` : 'Minus pemakaian normal, seam tape aman.'} Jaminan barang orisinal, siap kirim se-Indonesia.`;

    const igCaption = `🔥 BARU MASUK // LOT N°${selectedProduct.lotNumber} 🔥\n\n${selectedProduct.brand} - ${selectedProduct.name}\n\nGear outdoor legendaris dengan performa andalan siap menemani petualanganmu berikutnya. Kondisi vintage terawat, siap pakai tempur!\n\n📐 Ukuran: ${selectedProduct.size}\n⭐ Kondisi: ${selectedProduct.grade}% (APPROVED)\n💸 Harga: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedProduct.price)}\n\n${selectedProduct.defects ? `⚠️ Catatan defect: ${selectedProduct.defects}` : '✨ Kondisi mulus semulus baru, seam seal rapat.'}\n\nSerius order? Klik link di bio atau langsung DM kami sekarang sebelum kehabisan! ⚡`;
    const igHashtags = `#${selectedProduct.brand.replace(/[^a-zA-Z0-9]/g, '')}Second #jaketsecond #thriftoutdoor #secondhandbrand #outdoorsurplus #jaketgunungsecond #survivalgear #thriftindonesia`;

    return {
      seoTitle,
      seoDescription,
      igCaption,
      igHashtags,
    };
  }, [selectedProduct]);

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
              <Link
                href="/admin/pesanan"
                className="flex items-center px-1 h-full border-b-2 border-transparent font-semibold text-xs sm:text-sm tracking-widest uppercase text-[#F8F6F1]/60 hover:text-[#C8A882] transition-all"
              >
                Daftar Pesanan
              </Link>
              <button
                className="hidden sm:flex items-center px-1 h-full border-b-2 border-[#C8A882] text-[#C8A882] font-semibold text-xs sm:text-sm tracking-widest uppercase transition-colors cursor-pointer"
              >
                Analisis Marketing
              </button>
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
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-5 border-b border-[#E8E6E1] gap-4">
            <div>
              <div className="flex items-center space-x-2 font-mono text-[9px] text-tan uppercase font-bold tracking-widest mb-1">
                <span>Mesin Marketing Sistem · Laporan Marketing</span>
              </div>
              <h2 className="font-serif italic text-2xl font-bold text-text-main">
                Analisis Marketing
              </h2>
            </div>
            <div className="font-mono text-[9px] text-text-muted text-right tracking-widest leading-relaxed">
              <span>Database Data Aktif</span><br />
              <span className="text-tan font-semibold">Status Model AI: Konfigurasi Siap</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Product selector & AI Draft output */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Product Selector Card */}
              <div className="bg-white border border-[#E8E6E1] p-6 space-y-4 rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                <div className="flex items-center space-x-2 text-text-main font-semibold text-xs uppercase tracking-wider">
                  <Search className="w-4 h-4 text-tan" />
                  <span>Pilih Produk Untuk Dibuatkan Draf</span>
                </div>
                
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-white border border-[#E8E6E1] px-4 py-2.5 font-sans text-sm text-text-main focus:outline-none focus:border-rust transition-colors rounded-[2px]"
                >
                  {mockProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.brand}] {p.name} - LOT N°{p.lotNumber} (Size {p.size})
                    </option>
                  ))}
                </select>
              </div>

              {/* Suggestions Panel */}
              {mockAISuggestions && (
                <div className="space-y-6">
                  
                  {/* SEO Output Card */}
                  <div className="bg-white border border-[#E8E6E1] p-6 space-y-5 rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                    <div className="flex justify-between items-center pb-3 border-b border-[#E8E6E1]">
                      <h3 className="font-sans text-xs font-semibold text-text-main uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4 text-tan" />
                        <span>Saran Optimasi SEO</span>
                      </h3>
                      <span className="font-mono text-[9px] bg-tan/10 text-tan border border-tan/20 px-2 py-0.5 font-bold uppercase tracking-wider rounded-[2px]">
                        Draf Template AI
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* SEO Title */}
                      <div className="space-y-1">
                        <label className="font-sans text-[10px] text-text-muted uppercase font-semibold tracking-wider block">
                          Judul SEO Produk Terpilih
                        </label>
                        <div className="p-3.5 bg-[#F8F6F1] border border-[#E8E6E1] text-xs text-text-main font-mono select-all rounded-[2px]">
                          {mockAISuggestions.seoTitle}
                        </div>
                      </div>

                      {/* SEO Description */}
                      <div className="space-y-1">
                        <label className="font-sans text-[10px] text-text-muted uppercase font-semibold tracking-wider block">
                          Deskripsi SEO Produk Terpilih
                        </label>
                        <div className="p-3.5 bg-[#F8F6F1] border border-[#E8E6E1] text-xs text-text-main leading-relaxed select-all rounded-[2px]">
                          {mockAISuggestions.seoDescription}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Media Instagram Caption Card */}
                  <div className="bg-white border border-[#E8E6E1] p-6 space-y-5 rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                    <div className="flex justify-between items-center pb-3 border-b border-[#E8E6E1]">
                      <h3 className="font-sans text-xs font-semibold text-text-main uppercase tracking-widest flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-tan" />
                        <span>Caption Promosi Instagram</span>
                      </h3>
                      <span className="font-mono text-[9px] bg-tan/10 text-tan border border-tan/20 px-2 py-0.5 font-bold uppercase tracking-wider rounded-[2px]">
                        Draf Social Kit
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="font-sans text-[10px] text-text-muted uppercase font-semibold tracking-wider block">
                          Salinan Caption
                        </label>
                        <div className="p-4 bg-[#F8F6F1] border border-[#E8E6E1] text-xs text-text-main whitespace-pre-wrap leading-relaxed select-all rounded-[2px]">
                          {mockAISuggestions.igCaption}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-sans text-[10px] text-text-muted uppercase font-semibold tracking-wider block">
                          Rekomendasi Hashtag
                        </label>
                        <div className="p-3.5 bg-[#F8F6F1] border border-[#E8E6E1] text-xs text-tan font-mono select-all rounded-[2px]">
                          {mockAISuggestions.igHashtags}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Integration Info */}
                  <div className="bg-rust/5 border border-dashed border-rust/30 p-4 space-y-2 rounded-[2px]">
                    <div className="flex items-center gap-2 text-rust font-bold text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>INFORMASI INTEGRASI API AI</span>
                    </div>
                    <p className="font-sans text-[10px] text-text-muted leading-relaxed">
                      Untuk menyambungkan fitur ini secara dinamis dengan AI sesungguhnya, buat endpoint Route Handler `/api/marketing` yang memanggil LLM untuk memproses atribut produk menjadi format JSON yang diperlukan.
                    </p>
                  </div>

                </div>
              )}

            </div>

            {/* Right Side: Counts and Trends Summary */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Trends Summary Card */}
              <div className="bg-white border border-[#E8E6E1] p-6 space-y-5 rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                <div className="flex items-center space-x-2 pb-3 border-b border-[#E8E6E1] font-sans text-xs font-semibold text-text-main uppercase tracking-widest">
                  <TrendingUp className="w-4 h-4 text-tan" />
                  <span>Ringkasan Tren Brand</span>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">
                    Frekuensi Terbanyak di Inventaris
                  </p>
                  
                  <div className="space-y-3 font-sans text-xs">
                    {brandTrends.map(({ brand, count }) => {
                      const percentage = Math.round((count / mockProducts.length) * 100);
                      return (
                        <div key={brand} className="space-y-1">
                          <div className="flex justify-between font-semibold text-text-main">
                            <span>{brand}</span>
                            <span>{count} unit ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-[#F8F6F1] border border-[#E8E6E1] h-2 rounded-[2px] overflow-hidden">
                            <div
                              className="bg-rust h-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>

    </div>
  );
}
