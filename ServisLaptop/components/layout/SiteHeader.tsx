"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function IconLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="8" fill="url(#logo-grad)" />
      <path d="M9 10h7a4 4 0 010 8H9V10z" fill="white" />
      <path d="M9 18h8a4 4 0 010 8H9V18z" fill="white" opacity="0.7" />
      <rect x="20" y="12" width="2" height="12" rx="1" fill="white" opacity="0.5" />
      <rect x="24" y="10" width="2" height="16" rx="1" fill="white" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Beranda", href: "/#beranda" },
    { label: "Layanan", href: "/#layanan" },
    { label: "Cek Service", href: "/cek-status" },
    { label: "Sparepart", href: "/sparepart" },
    { label: "Cara Service", href: "/#cara-service" },
    { label: "Kontak", href: "/#kontak" },
  ];

  return (
    <header
      id="beranda"
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: isScrolled
          ? "rgba(15,23,42,0.95)"
          : "rgba(15,23,42,0.80)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: isScrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline flex-shrink-0">
          <IconLogo size={36} />
          <div className="leading-tight">
            <div className="font-bold text-base text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              LaptopDoctor.AI
            </div>
            <div className="text-[10px] text-slate-400 tracking-wider uppercase">
              Pusat Service Laptop & PC
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-lg transition-colors hover:bg-white/5 flex items-center min-h-[44px]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin/login"
            className="ml-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all hover:bg-white/5 flex items-center min-h-[44px]"
            style={{
              borderColor: "rgba(45,212,191,0.5)",
              color: "#2DD4BF",
              fontFamily: "var(--font-sans)",
            }}
          >
            Staff Login
          </Link>
        </nav>

        {/* Mobile hamburger (<1024px) */}
        <button
          className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <IconX /> : <IconMenu />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden animate-fade-in"
          style={{
            background: "rgba(15,23,42,0.98)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-4 py-3 min-h-[44px] flex items-center text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin/login"
              className="px-4 py-3 min-h-[44px] flex items-center justify-center text-sm font-medium rounded-lg border mt-2 text-center transition-all hover:bg-white/5"
              style={{ borderColor: "rgba(45,212,191,0.5)", color: "#2DD4BF" }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
