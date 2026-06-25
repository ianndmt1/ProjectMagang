'use client';

import React, { useState } from 'react';
import Header from '@/components/sections/header';
import Hero from '@/components/sections/hero';
import BrandMarquee from '@/components/sections/brand-marquee';
import FeaturedProducts from '@/components/sections/featured-products';
import CategoryCarousel from '@/components/sections/category-carousel';
import DarkSpotlight from '@/components/sections/dark-spotlight';
import CTABanner from '@/components/sections/cta-banner';
import WhyShopHere from '@/components/sections/why-shop-here';
import BuyerChat from '@/components/sections/buyer-chat';
import ClientOnly from '@/components/ui/client-only';
import { ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';
import { InstagramIcon } from '@/components/icons/instagram-icon';
import AiChatWidget from '@/components/ai-chat-widget';

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text-main selection:bg-rust selection:text-paper">
      
      {/* Header Sticky */}
      <Header />

      {/* Main Sections */}
      <main className="flex-grow">
        {/* TASK B — Hero */}
        <Hero onOpenChat={() => setChatOpen(true)} />

        {/* Brand Marquee */}
        <BrandMarquee />

        {/* TASK C — Baru Masuk (New Drops) */}
        <FeaturedProducts />

        {/* TASK D — Kategori Pilihan (Carousel) */}
        <CategoryCarousel />

        {/* TASK E — Dark Spotlight */}
        <ClientOnly>
          <DarkSpotlight />
        </ClientOnly>

        {/* TASK F — CTA Banner */}
        <CTABanner />

        {/* TASK G — Kenapa Belanja di Sini */}
        <WhyShopHere />
      </main>

      {/* Footer */}
      <footer className="w-full bg-paper border-t border-white/5 py-16 px-4 sm:px-6 lg:px-8 font-sans text-xs text-[#F8F6F1]/70">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <h4 className="font-serif italic text-base font-bold text-tan tracking-wide">
              Santdoor.2ND
            </h4>
            <p className="font-sans leading-relaxed text-[11px] text-[#F8F6F1]/60">
              Jaket outdoor surplus bermutu. Menjual jaket gunung preloved orisinal dengan kondisi terinspeksi ketat.
            </p>
            <div className="flex items-center space-x-2 text-[10px] text-[#F8F6F1]/60">
              <MapPin className="w-3.5 h-3.5 text-tan flex-shrink-0" />
              <span>Depot Klaten, Jawa Tengah</span>
            </div>
          </div>

          {/* Navigation shortcuts */}
          <div className="space-y-3">
            <h5 className="font-serif italic text-xs font-bold text-tan tracking-wide">Navigasi</h5>
            <ul className="space-y-2 text-[11px] text-[#F8F6F1]/60">
              <li><a href="#hero" className="hover:text-rust transition-colors">Beranda</a></li>
              <li><a href="#baru-masuk" className="hover:text-rust transition-colors">Baru Masuk</a></li>
              <li><a href="/katalog" className="hover:text-rust font-semibold text-white transition-colors">Katalog Gear</a></li>
              <li><a href="/admin" className="hover:text-rust transition-colors">Admin</a></li>
            </ul>
          </div>

          {/* Quality Checks */}
          <div className="space-y-3">
            <h5 className="font-serif italic text-xs font-bold text-tan tracking-wide">Jaminan Kualitas</h5>
            <ul className="space-y-2 text-[10px] leading-relaxed text-[#F8F6F1]/60">
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-tan" />
                <span>Dicuci &amp; Disanitasi</span>
              </li>
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-tan" />
                <span>Hardware Diperiksa</span>
              </li>
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-tan" />
                <span>Uji Waterproof</span>
              </li>
            </ul>
          </div>

          {/* Social / Contact */}
          <div className="space-y-3">
            <h5 className="font-serif italic text-xs font-bold text-tan tracking-wide">Hubungi Kami</h5>
            <ul className="space-y-2 text-[11px] text-[#F8F6F1]/60">
              <li className="flex items-center space-x-2">
                <InstagramIcon className="w-3.5 h-3.5 text-rust" />
                <a href="https://instagram.com/santdoor.2nd" target="_blank" rel="noopener noreferrer" className="hover:text-rust transition-colors">
                  @SANTDOOR.2ND
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-rust" />
                <a href="https://wa.me/628123456789" className="hover:text-rust transition-colors">
                  +62 812-3456-789
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-rust" />
                <a href="mailto:depot@santdoor.com" className="hover:text-rust transition-colors">
                  depot@santdoor.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-[#F8F6F1]/40">
          <span>&copy; {new Date().getFullYear()} SANTDOOR.2ND DEPOT SURPLUS. SEMUA HAK DILINDUNGI.</span>
          <span className="font-mono text-tan">STRICTLY SURPLUS // 1 OF 1 STOCKS</span>
        </div>
      </footer>

      {/* Floating AI Assistant */}
      <ClientOnly>
        <BuyerChat isOpenExternal={chatOpen} onCloseExternal={() => setChatOpen(false)} />
      </ClientOnly>
      <AiChatWidget />

    </div>
  );
}
