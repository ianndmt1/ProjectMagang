'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function CTABanner() {
  const [dynamicCta, setDynamicCta] = useState<string | null>(null);

  useEffect(() => {
    const fetchCta = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('site_content').select('image_url').eq('key', 'banner_cta_image').single();
        if (data && data.image_url) {
          setDynamicCta(data.image_url);
        }
      } catch (err) {
        console.error('Failed to fetch cta image:', err);
      }
    };
    fetchCta();
  }, []);
  return (
    <section
      id="cta-banner"
      className="relative w-full overflow-hidden"
      style={{ minHeight: '320px' }}
    >
      {/* Solid dark background */}
      <div className="absolute inset-0 bg-[#1A1A1A]" />

      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3)_0%,transparent_60%)]" />

      {/* Photo model — right */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block overflow-hidden">
        <img
          src={dynamicCta || "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800&auto=format&fit=crop"}
          alt="Model jaket outdoor"
          className="w-full h-full object-cover object-center opacity-40 mix-blend-overlay"
          loading="lazy"
        />
        {/* Left gradient blend */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #1A1A1A, transparent 60%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-xl">
          {/* Eyebrow */}
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A882] mb-4">
            Stok Terbatas · 1 Item per LOT
          </p>

          {/* Headline */}
          <h2 className="font-serif italic text-4xl sm:text-5xl font-bold text-[#F8F6F1] leading-tight mb-4">
            Jangan Sampai<br />Kehabisan.
          </h2>

          <p className="font-sans text-sm text-[#F8F6F1]/80 leading-relaxed mb-8 max-w-sm">
            Setiap jaket di SANTDOOR.2ND adalah 1 of 1 — sekali terjual, habis selamanya.
            Kurasi jadwal drop mingguanmu sekarang.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/katalog"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#1A1A1A] font-sans text-xs font-semibold uppercase tracking-widest rounded-[2px] hover:bg-rust hover:text-white transition-all duration-200 group"
            >
              <span>Lihat Semua Stok</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="https://wa.me/628123456789?text=Halo%20Santdoor%2C%20saya%20mau%20daftar%20notif%20drop%20mingguan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent border-[1.5px] border-white/50 text-white font-sans text-xs font-semibold uppercase tracking-widest rounded-[2px] hover:border-white hover:bg-white/10 transition-all duration-200"
            >
              Notifikasi Drop
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
