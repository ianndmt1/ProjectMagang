'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/image-compressor';
import ThemeToggle from '@/components/ui/theme-toggle';
import { mockProducts, Product, formatIDR } from '@/lib/mock-data';
import {
  Compass,
  Home,
  LogOut,
  UploadCloud,
  Loader2,
  CheckCircle,
  Image as ImageIcon,
  Star,
} from 'lucide-react';

export default function AdminTampilan() {
  const router = useRouter();
  const supabase = createClient();

  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [ctaImage, setCtaImage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingCta, setIsUploadingCta] = useState(false);
  const [heroStatus, setHeroStatus] = useState<string | null>(null);
  const [ctaStatus, setCtaStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: siteData } = await supabase.from('site_content').select('*');
      if (siteData) {
        const hero = siteData.find(s => s.key === 'hero_image');
        const cta = siteData.find(s => s.key === 'banner_cta_image');
        if (hero?.image_url) setHeroImage(hero.image_url);
        if (cta?.image_url) setCtaImage(cta.image_url);
      }

      const { data: prodData, error: prodErr } = await supabase.from('products').select('*').order('createdAt', { ascending: false });
      if (prodErr) {
        console.warn('Fallback to mock data for products');
        setProducts(mockProducts);
      } else {
        setProducts(prodData as Product[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push('/admin/login');
  };

  const handleUploadSiteImage = async (e: React.ChangeEvent<HTMLInputElement>, key: 'hero_image' | 'banner_cta_image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setStatus = key === 'hero_image' ? setHeroStatus : setCtaStatus;
    const setIsUploading = key === 'hero_image' ? setIsUploadingHero : setIsUploadingCta;
    const setPreview = key === 'hero_image' ? setHeroImage : setCtaImage;

    setIsUploading(true);
    setStatus(null);

    try {
      const compressedFile = await compressImage(file, 1600, 0.85);
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${key}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('site-images')
        .upload(filePath, compressedFile, { upsert: true });

      if (uploadErr) throw new Error(uploadErr.message);

      const { data: publicData } = supabase.storage
        .from('site-images')
        .getPublicUrl(filePath);

      const publicUrl = publicData.publicUrl;

      const { error: dbErr } = await supabase.from('site_content').upsert({
        key,
        image_url: publicUrl,
        updated_at: new Date().toISOString()
      });

      if (dbErr) throw new Error(dbErr.message);

      setPreview(publicUrl);
      setStatus('Tersimpan!');
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus(`Gagal: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleSpotlight = async (product: Product) => {
    const isCurrentlySpotlight = product.is_spotlight || false;
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_spotlight: !isCurrentlySpotlight } : p));
    try {
      const { error } = await supabase.from('products').update({ is_spotlight: !isCurrentlySpotlight }).eq('id', product.id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_spotlight: isCurrentlySpotlight } : p));
      alert('Gagal mengupdate status spotlight di database.');
    }
  };

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
              <Link
                href="/admin/marketing"
                className="hidden sm:flex items-center px-1 h-full border-b-2 border-transparent font-semibold text-xs sm:text-sm tracking-widest uppercase text-[#F8F6F1]/60 hover:text-[#C8A882] transition-all"
              >
                Analisis Marketing
              </Link>
              <button
                className="flex items-center px-1 h-full border-b-2 border-[#C8A882] text-[#C8A882] font-semibold text-xs sm:text-sm tracking-widest uppercase cursor-pointer"
              >
                Tampilan Website
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

      {/* ── Main Content ── */}
      <div className="flex-grow bg-[#F4F2ED]">
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-5 border-b border-[#E8E6E1] gap-4">
            <div>
              <div className="flex items-center space-x-2 font-mono text-[9px] text-tan uppercase font-bold tracking-widest mb-1">
                <span>Pengendali Tampilan · Konten Beranda</span>
              </div>
              <h2 className="font-serif italic text-2xl font-bold text-text-main">
                Manajemen Tampilan Website
              </h2>
            </div>
            <p className="font-mono text-[9px] text-text-muted tracking-widest leading-relaxed text-right">
              Atur foto dinamis halaman depan<br />
              <span className="text-tan font-semibold">tanpa menyentuh kode sumber</span>
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-tan" />
            </div>
          ) : (
            <div className="space-y-8">

              {/* Hero Image Section */}
              <section className="bg-white border border-[#E8E6E1] p-6 rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E6E1] mb-5">
                  <h3 className="font-sans text-xs font-semibold text-text-main uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-tan" />
                    <span>Gambar Hero Utama</span>
                  </h3>
                  <span className="font-mono text-[9px] bg-tan/10 text-tan border border-tan/20 px-2 py-0.5 font-bold uppercase tracking-wider rounded-[2px]">
                    Beranda — Fullscreen
                  </span>
                </div>
                <p className="font-sans text-xs text-text-muted mb-5 max-w-2xl">
                  Gambar ini akan ditampilkan secara penuh di bagian atas halaman beranda. Disarankan menggunakan format lanskap (16:9) dengan resolusi tinggi.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upload Zone */}
                  <div className="relative border-2 border-dashed border-[#E8E6E1] hover:border-rust p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#F8F6F1] min-h-[200px] rounded-[2px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadSiteImage(e, 'hero_image')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploadingHero}
                    />
                    {isUploadingHero ? (
                      <Loader2 className="w-8 h-8 text-text-muted animate-spin mb-3" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-text-muted mb-3" />
                    )}
                    <p className="font-sans text-sm font-semibold text-text-main mb-1">Klik atau seret file gambar Hero baru</p>
                    <p className="font-sans text-xs text-text-muted">Format PNG, JPG, WEBP (Max 5MB)</p>

                    {heroStatus && (
                      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] border border-[#2E7D32]/20 text-[#2E7D32] text-xs font-bold uppercase tracking-wider rounded-[2px]">
                        <CheckCircle className="w-3.5 h-3.5" /> {heroStatus}
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="border border-[#E8E6E1] bg-[#F8F6F1] relative overflow-hidden h-[200px] lg:h-auto flex items-center justify-center rounded-[2px]">
                    {heroImage ? (
                      <img src={heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-mono text-xs text-text-muted">Belum ada gambar hero</span>
                    )}
                    <div className="absolute top-2 left-2 bg-[#1A1A1A] text-[#F8F6F1] px-2 py-1 font-mono text-[9px] uppercase tracking-widest font-bold rounded-[2px]">
                      Pratinjau Saat Ini
                    </div>
                  </div>
                </div>
              </section>

              {/* CTA Banner Section */}
              <section className="bg-white border border-[#E8E6E1] p-6 rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E6E1] mb-5">
                  <h3 className="font-sans text-xs font-semibold text-text-main uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-tan" />
                    <span>Gambar Banner CTA</span>
                  </h3>
                  <span className="font-mono text-[9px] bg-tan/10 text-tan border border-tan/20 px-2 py-0.5 font-bold uppercase tracking-wider rounded-[2px]">
                    Beranda — Belanja Sekarang
                  </span>
                </div>
                <p className="font-sans text-xs text-text-muted mb-5 max-w-2xl">
                  Gambar ini akan ditampilkan di bagian banner tengah halaman. Gunakan gambar vertikal atau lanskap menarik.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upload Zone */}
                  <div className="relative border-2 border-dashed border-[#E8E6E1] hover:border-rust p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#F8F6F1] min-h-[200px] rounded-[2px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadSiteImage(e, 'banner_cta_image')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploadingCta}
                    />
                    {isUploadingCta ? (
                      <Loader2 className="w-8 h-8 text-text-muted animate-spin mb-3" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-text-muted mb-3" />
                    )}
                    <p className="font-sans text-sm font-semibold text-text-main mb-1">Klik atau seret file gambar Banner baru</p>
                    <p className="font-sans text-xs text-text-muted">Format PNG, JPG, WEBP (Max 5MB)</p>

                    {ctaStatus && (
                      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] border border-[#2E7D32]/20 text-[#2E7D32] text-xs font-bold uppercase tracking-wider rounded-[2px]">
                        <CheckCircle className="w-3.5 h-3.5" /> {ctaStatus}
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="border border-[#E8E6E1] bg-[#F8F6F1] relative overflow-hidden h-[200px] lg:h-auto flex items-center justify-center rounded-[2px]">
                    {ctaImage ? (
                      <img src={ctaImage} alt="CTA Banner Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-mono text-xs text-text-muted">Belum ada gambar banner</span>
                    )}
                    <div className="absolute top-2 left-2 bg-[#1A1A1A] text-[#F8F6F1] px-2 py-1 font-mono text-[9px] uppercase tracking-widest font-bold rounded-[2px]">
                      Pratinjau Saat Ini
                    </div>
                  </div>
                </div>
              </section>

              {/* Spotlight Products */}
              <section className="bg-white border border-[#E8E6E1] p-6 rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.01)]">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E6E1] mb-5">
                  <h3 className="font-sans text-xs font-semibold text-text-main uppercase tracking-widests flex items-center gap-2">
                    <Star className="w-4 h-4 text-tan" fill="currentColor" />
                    <span className="uppercase tracking-widest">Pemilihan Produk Spotlight</span>
                  </h3>
                  <span className="font-mono text-[9px] bg-tan/10 text-tan border border-tan/20 px-2 py-0.5 font-bold uppercase tracking-wider rounded-[2px]">
                    Beranda — Dark Spotlight
                  </span>
                </div>
                <p className="font-sans text-xs text-text-muted mb-5 max-w-2xl">
                  Produk dengan status spotlight akan tampil menonjol di halaman beranda. Anda dapat memilih lebih dari satu.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans border-collapse">
                    <thead>
                      <tr className="bg-[#F8F6F1] border-b border-[#E8E6E1] font-mono text-[10px] text-text-muted uppercase tracking-wider">
                        <th className="pb-3 pt-3 px-4 whitespace-nowrap">Spotlight</th>
                        <th className="pb-3 pt-3 pr-4 whitespace-nowrap">Lot N°</th>
                        <th className="pb-3 pt-3 pr-4 min-w-[200px]">Nama Produk</th>
                        <th className="pb-3 pt-3 pr-4">Brand</th>
                        <th className="pb-3 pt-3">Harga</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-[#E8E6E1]">
                      {products.map(product => (
                        <tr
                          key={product.id}
                          className={`transition-colors ${product.is_spotlight ? 'bg-[#F8F6F1]' : 'bg-white hover:bg-[#F8F6F1]/60'}`}
                        >
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleSpotlight(product)}
                              className={`w-11 h-6 rounded-full flex items-center transition-colors p-1 cursor-pointer ${
                                product.is_spotlight ? 'bg-tan' : 'bg-[#E8E6E1]'
                              }`}
                              title={product.is_spotlight ? 'Nonaktifkan spotlight' : 'Aktifkan spotlight'}
                            >
                              <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                                product.is_spotlight ? 'translate-x-5' : 'translate-x-0'
                              }`} />
                            </button>
                          </td>
                          <td className="py-3 pr-4 font-mono text-tan font-semibold">#{product.lotNumber}</td>
                          <td className="py-3 pr-4 font-semibold text-text-main line-clamp-1">
                            {product.name}
                            {product.is_spotlight && (
                              <span className="ml-2 inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-tan uppercase tracking-widest">
                                <Star className="w-2.5 h-2.5" fill="currentColor" /> Spotlight
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-text-muted">{product.brand}</td>
                          <td className="py-3 font-mono font-medium text-text-main">{formatIDR(product.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
