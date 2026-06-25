'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, MessageSquare, Phone } from 'lucide-react';
import { InstagramIcon } from '@/components/icons/instagram-icon';
import ThemeToggle from '@/components/ui/theme-toggle';

const brandDropdown = [
  'The North Face',
  'Napapijri',
  'Patagonia',
  'Arc\'teryx',
  'Columbia',
  'Mammut',
  'Helly Hansen',
  'Berghaus',
  'Jack Wolfskin',
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandDropOpen, setBrandDropOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close brand dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#brand-dropdown-wrapper')) {
        setBrandDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full">

      {/* ── Utility Bar ── */}
      <div className="w-full bg-bg text-text-muted border-b border-hairline/40 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-9 text-[10px] font-mono tracking-wider">
          {/* Left: Social */}
          <div className="flex items-center space-x-4">
            <a
              href="https://instagram.com/santdoor.2nd"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Instagram"
            >
              <InstagramIcon className="w-3.5 h-3.5" />
              <span>@santdoor.2nd</span>
            </a>
            <a
              href="https://wa.me/628123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="WhatsApp"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Right: Links */}
          <div className="flex items-center space-x-5 uppercase">
            <Link href="/cara-beli" className="opacity-70 hover:opacity-100 transition-opacity">Cara Beli</Link>
            <Link href="/rekber" className="opacity-70 hover:opacity-100 transition-opacity">Rekber</Link>
            <Link href="/bantuan" className="opacity-70 hover:opacity-100 transition-opacity">Bantuan</Link>
          </div>
        </div>
      </div>

      {/* ── Main Header ── */}
      <div
        className={`w-full bg-bg/95 backdrop-blur-md border-b border-hairline transition-shadow duration-200 ${scrolled ? 'shadow-sm' : ''
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Wordmark */}
            <Link href="/" className="flex-shrink-0">
              <span className="font-serif italic text-xl font-bold tracking-wide text-text-main hover:text-tan transition-colors duration-200">
                Santdoor<span className="text-tan font-sans font-normal not-italic text-sm tracking-widest ml-1">.2ND</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-1 font-sans text-[11px] tracking-widest font-medium uppercase text-text-muted">
              <Link
                href="/katalog"
                className="px-3 py-2 hover:text-text-main hover:underline decoration-tan/50 decoration-1 underline-offset-4 transition-all duration-150 whitespace-nowrap"
              >
                Katalog
              </Link>

              {/* Brand Dropdown */}
              <div id="brand-dropdown-wrapper" className="relative">
                <button
                  onClick={() => setBrandDropOpen(!brandDropOpen)}
                  className="flex items-center gap-1 px-3 py-2 hover:text-text-main hover:underline decoration-tan/50 decoration-1 underline-offset-4 transition-all duration-150"
                >
                  Brand
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${brandDropOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {brandDropOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-bg border border-hairline shadow-lg py-1 z-50 share-dropdown-enter">
                    {brandDropdown.map((brand) => (
                      <Link
                        key={brand}
                        href={`/katalog?brand=${encodeURIComponent(brand)}`}
                        onClick={() => setBrandDropOpen(false)}
                        className="block px-4 py-2 text-xs text-text-muted hover:text-text-main hover:bg-panel transition-colors duration-100"
                      >
                        {brand}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/katalog"
                className="px-3 py-2 hover:text-text-main hover:underline decoration-tan/50 decoration-1 underline-offset-4 transition-all duration-150 whitespace-nowrap"
              >
                Semua Produk
              </Link>
              <Link
                href="#tentang"
                className="px-3 py-2 hover:text-text-main hover:underline decoration-tan/50 decoration-1 underline-offset-4 transition-all duration-150 whitespace-nowrap"
              >
                Tentang Kami
              </Link>
              <a
                href="https://wa.me/6289529018307"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 hover:text-text-main hover:underline decoration-tan/50 decoration-1 underline-offset-4 transition-all duration-150"
              >
                Kontak
              </a>
            </nav>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-2">
              <a
                href="https://wa.me/6289529018307?text=Halo%20Santdoor%2C%20saya%20mau%20tanya%20soal%20stok%20jaket"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-text-main text-bg font-sans text-[11px] font-semibold uppercase tracking-widest hover:bg-rust hover:text-white rounded-[2px] active:scale-[0.98] transition-all duration-200"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>HUBUNGI</span>
              </a>
              <ThemeToggle size="md" />
            </div>

            {/* Mobile: ThemeToggle + Hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle size="sm" />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-9 h-9 border border-hairline bg-panel flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
                aria-label="Buka Menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-hairline bg-panel px-4 pt-3 pb-5 space-y-1 font-sans text-xs uppercase tracking-wider font-semibold">
            <Link
              href="/katalog"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-text-muted hover:text-text-main border-b border-hairline/40 transition-colors"
            >
              Katalog
            </Link>
            <div className="px-3 py-2 text-text-muted text-[10px] font-bold tracking-widest">Brand</div>
            <div className="grid grid-cols-2 gap-1 px-3 pb-2">
              {brandDropdown.map((b) => (
                <Link
                  key={b}
                  href={`/katalog?brand=${encodeURIComponent(b)}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-text-muted hover:text-text-main text-[10px] transition-colors"
                >
                  {b}
                </Link>
              ))}
            </div>
            <Link
              href="/katalog"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-text-muted hover:text-text-main border-t border-hairline/40 transition-colors"
            >
              Semua Produk
            </Link>
            <Link
              href="#tentang"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-text-muted hover:text-text-main border-t border-hairline/40 transition-colors"
            >
              Tentang Kami
            </Link>
            <a
              href="https://wa.me/6289529018307"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2.5 text-text-muted hover:text-text-main border-t border-hairline/40 transition-colors"
            >
              Kontak
            </a>

            <div className="pt-3 border-t border-hairline/60">
              <a
                href="https://wa.me/6289529018307?text=Halo%20Santdoor%2C%20saya%20mau%20tanya%20soal%20stok%20jaket"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-text-main text-bg font-sans text-xs font-semibold uppercase tracking-widest rounded-[2px] hover:bg-rust hover:text-white transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Hubungi
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
