'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Share2, Link2, X } from 'lucide-react';

interface ShareButtonProps {
  productName: string;
  productBrand: string;
  productPrice: number;
  productSlug: string;
  productGrade?: number;
  size?: 'sm' | 'md';
  /** Variant for card overlay or standalone button */
  variant?: 'icon' | 'text';
}

function formatIDR(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ShareButton({
  productName,
  productBrand,
  productPrice,
  productSlug,
  productGrade,
  size = 'md',
  variant = 'icon',
}: ShareButtonProps) {
  const [dropOpen, setDropOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/produk/${productSlug}`
      : `/produk/${productSlug}`;

  const caption = `✨ ${productBrand} ${productName}${productGrade ? ` · Kondisi ${productGrade}%` : ''} · ${formatIDR(productPrice)}\n\nOrder langsung via WhatsApp 👇\n${productUrl}\n\n#santdoor2nd #thriftjaket #thriftklaten`;

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Try Web Share API first
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${productBrand} ${productName} — SANTDOOR.2ND`,
          text: caption,
          url: productUrl,
        });
        return;
      } catch {
        // user cancelled — silently ignore
      }
    }

    // Fallback: show dropdown
    setDropOpen(!dropOpen);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setDropOpen(false);
      }, 1500);
    } catch {
      // noop
    }
  };

  const handleCopyCaption = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setDropOpen(false);
      }, 1500);
    } catch {
      // noop
    }
  };

  const waUrl = `https://wa.me/?text=${encodeURIComponent(caption)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${productBrand} ${productName} ${formatIDR(productPrice)} — cek di SANTDOOR.2ND`
  )}&url=${encodeURIComponent(productUrl)}`;

  return (
    <div ref={ref} className="relative z-20">
      <button
        onClick={handleShare}
        aria-label="Bagikan produk"
        className={`inline-flex items-center justify-center transition-all duration-200 ${
          variant === 'icon'
            ? `${
                size === 'sm'
                  ? 'w-7 h-7'
                  : 'w-9 h-9'
              } bg-bg/90 border border-hairline text-text-main hover:bg-rust hover:text-paper hover:border-rust`
            : 'gap-1.5 px-3 py-1.5 bg-bg border border-hairline text-text-main hover:border-rust hover:text-rust font-mono text-[10px] uppercase tracking-wider font-bold'
        }`}
      >
        <Share2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        {variant === 'text' && <span>Bagikan</span>}
      </button>

      {/* Fallback Dropdown */}
      {dropOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-56 bg-bg border border-hairline shadow-xl share-dropdown-enter">
          <div className="flex items-center justify-between px-3 py-2 border-b border-hairline">
            <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted font-bold">
              Bagikan ke
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setDropOpen(false); }}
              className="text-text-muted hover:text-text-main transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { e.stopPropagation(); setDropOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-sans text-text-muted hover:bg-panel hover:text-text-main transition-colors"
            >
              <span className="text-base">💬</span>
              <span>WhatsApp</span>
            </a>

            <button
              onClick={handleCopyCaption}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-sans text-text-muted hover:bg-panel hover:text-text-main transition-colors text-left"
            >
              <span className="text-base">📸</span>
              <span>Instagram (Salin Caption)</span>
            </button>

            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { e.stopPropagation(); setDropOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-sans text-text-muted hover:bg-panel hover:text-text-main transition-colors"
            >
              <span className="text-base">𝕏</span>
              <span>X / Twitter</span>
            </a>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-sans text-text-muted hover:bg-panel hover:text-text-main transition-colors text-left border-t border-hairline/40 mt-1"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{copied ? '✓ Tautan Disalin!' : 'Salin Tautan'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
