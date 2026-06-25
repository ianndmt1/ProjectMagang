'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquare } from 'lucide-react';

interface HeroProps {
  onOpenChat?: () => void;
}

const slides = [
  { id: '01', label: 'Outdoor', href: '/katalog?kategori=outdoor' },
  { id: '02', label: 'Casual', href: '/katalog?kategori=casual' },
  { id: '03', label: 'Windbreaker', href: '/katalog?kategori=windbreaker' },
  { id: '04', label: 'Bundling', href: '/katalog?kategori=bundling' },
  { id: '05', label: 'Promo Minggu Ini', href: '/katalog?promo=1' },
];

const heroImages = [
  'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=1200&auto=format&fit=crop',
];

import { createClient } from '@/lib/supabase/client';

export default function Hero({ onOpenChat }: HeroProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [dynamicHero, setDynamicHero] = useState<string | null>(null);

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('site_content').select('image_url').eq('key', 'hero_image').single();
        if (data && data.image_url) {
          setDynamicHero(data.image_url);
        }
      } catch (err) {
        console.error('Failed to fetch hero image:', err);
      }
    };
    fetchHero();
  }, []);

  // Auto-advance slides every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="hero"
      className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-bg"
    >
      {/* Full-bleed background image (right half) */}
      <div className="absolute inset-0 lg:left-1/2 overflow-hidden">
        {dynamicHero ? (
          <div className="absolute inset-0 transition-opacity duration-700 opacity-100">
            <img
              src={dynamicHero}
              alt="Hero Santdoor"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
            {/* Gradient overlay blending to white on left */}
            <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/60 to-transparent lg:via-bg/20 lg:to-transparent" />
          </div>
        ) : (
          heroImages.map((img, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === activeSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={img}
                alt={`Slide ${i + 1}`}
                className="w-full h-full object-cover object-center"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
              {/* Gradient overlay blending to white on left */}
              <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/60 to-transparent lg:via-bg/20 lg:to-transparent" />
            </div>
          ))
        )}
      </div>

      {/* Mobile image overlay */}
      <div className="absolute inset-0 lg:hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg/10 via-bg/60 to-bg" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-lg lg:max-w-xl">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-8 h-px bg-mustard" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-mustard">
              Est. 2024 · Klaten, Jawa Tengah
            </span>
          </div>

          {/* Main Headline */}
          <h1
            key={activeSlide}
            className="font-serif italic text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-wide text-text-main hero-slide-enter mb-6"
          >
            Jaket Second.{' '}
            <span className="text-rust block sm:inline">Bukan Second-Rate.</span>
          </h1>

          {/* Sub-text */}
          <p className="font-sans text-sm sm:text-base text-text-muted leading-relaxed mb-8 max-w-md">
            Kurasi ketat kondisi fisik & deskripsi jujur setiap cacat — karena
            kamu berhak tahu persis apa yang kamu beli. Hanya 1 stok per item.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <Link
              href="/katalog"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-text-main text-bg font-sans text-xs font-semibold uppercase tracking-widest rounded-[2px] hover:bg-rust hover:text-white transition-all duration-200 group"
            >
              <span>Belanja Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={onOpenChat}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent text-text-main border-[1.5px] border-text-main font-sans text-xs font-semibold uppercase tracking-widest rounded-[2px] hover:border-rust hover:text-rust transition-all duration-200"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Tanya AI Cariin Jaket</span>
            </button>
          </div>

          {/* Slide indicators / category nav */}
          <div className="flex items-center space-x-6 overflow-x-auto pb-2 border-b border-hairline/40">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setActiveSlide(i)}
                className={`flex items-center gap-2 flex-shrink-0 pb-2 transition-all duration-200 border-b-2 -mb-[10px] ${
                  i === activeSlide
                    ? 'border-text-main text-text-main'
                    : 'border-transparent text-text-muted hover:text-text-main'
                }`}
              >
                <span className="font-mono text-[9px] opacity-60">{slide.id}</span>
                <span className="font-sans text-[11px] font-semibold uppercase tracking-widest">
                  {slide.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
