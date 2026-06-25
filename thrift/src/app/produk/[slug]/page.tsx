import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/sections/header';
import ProductGallery from '@/components/sections/product-gallery';
import Button from '@/components/ui/button';
import ShareButton from '@/components/ui/share-button';
import { mockProducts, formatIDR } from '@/lib/mock-data';
import { ArrowLeft, MessageSquare, AlertTriangle, ShieldCheck, Tag } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Estimated retail prices for display
const retailPriceMap: Record<string, number> = {
  'The North Face': 2500000,
  'Napapijri': 3200000,
  'Patagonia': 4000000,
  'Columbia': 1800000,
  "Arc'teryx": 8000000,
  'Mammut': 3500000,
  'Helly Hansen': 2800000,
  'Berghaus': 2200000,
  'Jack Wolfskin': 2500000,
};

export async function generateStaticParams() {
  return mockProducts.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductDetail({ params }: PageProps) {
  const resolvedParams = await params;
  const product = mockProducts.find((p) => p.slug === resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const phone = '628123456789';
  const waMessage = `Halo SANTDOOR.2ND, saya tertarik dengan ${product.brand} ${product.name} (LOT N°${product.lotNumber}). Apakah barang ini masih tersedia?`;
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`;
  const retailPrice = retailPriceMap[product.brand];

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text-main selection:bg-rust selection:text-paper">
      
      {/* Header */}
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back navigation */}
        <div className="mb-6 select-none flex items-center justify-between">
          <Link 
            href="/katalog"
            className="inline-flex items-center space-x-2 font-sans text-[10px] uppercase tracking-widest text-text-muted hover:text-text-main hover:underline decoration-tan decoration-1 underline-offset-4 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Katalog</span>
          </Link>

          {/* Share button — top-right */}
          <ShareButton
            productName={product.name}
            productBrand={product.brand}
            productPrice={product.price}
            productSlug={product.slug}
            productGrade={product.grade}
            variant="text"
          />
        </div>

        {/* Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Image Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery 
              images={product.images} 
              productName={product.name} 
              grade={product.grade} 
              isSold={product.status === 'sold'} 
            />
          </div>

          {/* Spec Sheet */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Title */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-mono text-xs text-text-muted">
                <span className="text-tan font-bold">LOT N°{product.lotNumber}</span>
                <span className="uppercase tracking-widest">{product.category}</span>
              </div>
              <span className="inline-block text-xs uppercase tracking-widest text-tan font-bold">
                {product.brand}
              </span>
              <h1 className="font-serif italic text-2xl sm:text-3xl font-bold text-text-main leading-tight">
                {product.name}
              </h1>
              
              {/* Price with retail strikethrough */}
              <div className="pt-2 space-y-0.5">
                {retailPrice && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-muted line-through">
                      {formatIDR(retailPrice)}
                    </span>
                    <span className="badge-pill bg-rust/10 text-rust border border-rust/20 text-[9px]">
                      Harga Brand
                    </span>
                  </div>
                )}
                <span className="font-mono text-2xl font-bold text-rust">
                  {formatIDR(product.price)}
                </span>
              </div>
            </div>

            {/* Spec Table */}
            <div className="bg-white border border-border p-5 font-mono text-xs space-y-2.5 rounded-[2px] shadow-[0_1px_6_rgba(0,0,0,0.02)]">
              <h3 className="text-[10px] text-tan uppercase font-bold tracking-wider mb-2">Spesifikasi Produk</h3>
              <div className="flex justify-between border-b border-hairline/40 pb-2">
                <span className="text-text-muted uppercase">Ukuran</span>
                <span className="text-text-main font-bold">{product.size}</span>
              </div>
              <div className="flex justify-between border-b border-hairline/40 pb-2">
                <span className="text-text-muted uppercase">Kategori</span>
                <span className="text-text-main">{product.category}</span>
              </div>
              <div className="flex justify-between border-b border-hairline/40 pb-2">
                <span className="text-text-muted uppercase">Grade Kondisi</span>
                <span className="text-tan font-bold">{product.grade}% / 100%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted uppercase">Status Stok</span>
                <span className={`font-bold uppercase ${product.status === 'available' ? 'text-tan' : 'text-rust'}`}>
                  {product.status === 'available' ? 'Tersedia (1 pcs)' : 'Habis Terjual'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="font-mono text-[10px] text-tan uppercase font-bold tracking-wider">Deskripsi</h4>
              <p className="text-xs text-text-muted leading-relaxed font-sans">
                {product.description}
              </p>
            </div>

            {/* Defect Notes */}
            <div className="bg-rust/5 border border-dashed border-rust/30 p-4 space-y-2 rounded-[2px]">
              <div className="flex items-center space-x-2 text-rust font-mono text-[10px] uppercase font-bold tracking-wider">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Laporan Inspeksi | Catatan Kekurangan</span>
              </div>
              <p className="text-xs text-text-main/90 leading-relaxed font-sans">
                {product.defects 
                  ? product.defects 
                  : "Mulus, tidak ada minus noda atau sobek. Kondisi kancing, zipper, dan jahitan orisinal normal."}
              </p>
            </div>

            {/* Share + Buy CTAs */}
            <div className="pt-4 space-y-3">
              {product.status === 'available' ? (
                <a 
                  href={waUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block w-full focus:outline-none"
                >
                  <Button variant="primary" size="lg" fullWidth className="gap-2 shadow-lg">
                    <MessageSquare className="w-5 h-5 text-paper fill-paper" />
                    <span>Hubungi Penjual via WhatsApp</span>
                  </Button>
                </a>
              ) : (
                <Button variant="outline" size="lg" fullWidth disabled className="gap-2">
                  <span>Habis Terjual (Tidak Ada Stok)</span>
                </Button>
              )}

              {/* Share button */}
              <div className="flex justify-center">
                <ShareButton
                  productName={product.name}
                  productBrand={product.brand}
                  productPrice={product.price}
                  productSlug={product.slug}
                  productGrade={product.grade}
                  variant="text"
                  size="md"
                />
              </div>
            </div>

            {/* Quality Seals */}
            <div className="pt-4 border-t border-hairline/40 grid grid-cols-2 gap-4 font-mono text-[9px] text-text-muted uppercase">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-olive flex-shrink-0" />
                <span>Dicuci &amp; Disanitasi</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Tag className="w-4 h-4 text-olive flex-shrink-0" />
                <span>Outdoor Surplus Asli</span>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full bg-paper border-t border-hairline/10 py-8 mt-12 text-center text-bg font-mono text-[9px] uppercase tracking-widest">
        <span className="opacity-60">SANTDOOR.2ND DEPOT SURPLUS &bull; STOK BERGILIR ONLINE</span>
      </footer>

    </div>
  );
}
