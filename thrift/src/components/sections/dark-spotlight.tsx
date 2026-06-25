'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { mockProducts, formatIDR, Product } from '@/lib/mock-data';
import GradeStamp from '@/components/ui/grade-stamp';
import { MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function DarkSpotlight() {
  const [featured, setFeatured] = useState<Product | null>(null);

  useEffect(() => {
    const fetchSpotlight = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_spotlight', true)
          .eq('status', 'available')
          .limit(1);

        if (data && data.length > 0) {
          setFeatured(data[0] as Product);
        } else {
          // Fallback to mock data
          const mockFeatured = mockProducts
            .filter((p) => p.status === 'available')
            .sort((a, b) => b.grade - a.grade)[0];
          setFeatured(mockFeatured);
        }
      } catch (err) {
        console.warn('Fallback to mock data for spotlight:', err);
        const mockFeatured = mockProducts
          .filter((p) => p.status === 'available')
          .sort((a, b) => b.grade - a.grade)[0];
        setFeatured(mockFeatured);
      }
    };

    fetchSpotlight();
  }, []);

  if (!featured) return null;

  const thumbnails = featured.images && featured.images.length > 0 ? featured.images.slice(0, 3) : [];

  return (
    <section
      id="produk-pilihan"
      className="w-full bg-dark-spotlight py-20 sm:py-28"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section eyebrow */}
        <div className="flex items-center gap-3 mb-10">
          <span className="w-6 h-px bg-tan" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-tan">
            Produk Pilihan Minggu Ini
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

          {/* Left — Text Content */}
          <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
            <div className="flex items-center gap-3">
              <GradeStamp grade={featured.grade} size="md" variant="vintage" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-tan font-bold">
                  LOT N°{featured.lotNumber}
                </p>
                <p className="font-sans text-sm text-[#9A9890]">{featured.brand}</p>
              </div>
            </div>

            <h2 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F8F6F1] leading-tight">
              {featured.name}
            </h2>

            <p className="font-sans text-sm text-[#9A9890] leading-relaxed max-w-sm">
              {featured.description}
            </p>

            {featured.defects && (
              <div className="flex items-start gap-2 border border-tan/30 p-3 rounded-[2px]">
                <span className="font-mono text-[9px] text-tan uppercase tracking-widest font-bold flex-shrink-0 mt-0.5">Catatan:</span>
                <p className="font-sans text-[11px] text-[#9A9890] italic leading-relaxed">
                  {featured.defects}
                </p>
              </div>
            )}

            <div className="pt-2">
              <p className="font-mono text-2xl font-bold text-[#EDE8DD] mb-4">
                {formatIDR(featured.price)}
              </p>

              <a
                href={`https://wa.me/628123456789?text=Halo%20Santdoor%2C%20saya%20tertarik%20dengan%20LOT%20N°${featured.lotNumber}%20${encodeURIComponent(featured.brand + ' ' + featured.name)}.%20Masih%20tersedia%3F`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-rust text-white font-sans text-xs font-semibold uppercase tracking-widest rounded-[2px] hover:bg-rust/90 active:scale-[0.98] transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                Pesan via WhatsApp
              </a>

              <Link
                href={`/produk/${featured.slug}`}
                className="ml-5 inline-flex items-center gap-1.5 font-sans text-[11px] text-[#9A9890] hover:text-[#EDE8DD] hover:underline decoration-tan decoration-1 underline-offset-4 transition-colors uppercase tracking-widest"
              >
                Lihat Detail
              </Link>
            </div>
          </div>

          {/* Right — Images */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-4">
            {/* Main image */}
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-[2px]">
              <img
                src={featured.images && featured.images.length > 0 ? featured.images[0] : 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=600&auto=format&fit=crop'}
                alt={featured.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail gallery */}
            {thumbnails.length > 1 && (
              <div className="grid grid-cols-3 gap-3">
                {thumbnails.map((img, i) => (
                  <div
                    key={i}
                    className={`aspect-[4/3] overflow-hidden border transition-all duration-200 rounded-[2px] ${
                      i === 0
                        ? 'border-rust'
                        : 'border-white/10 hover:border-white/40 cursor-pointer'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
