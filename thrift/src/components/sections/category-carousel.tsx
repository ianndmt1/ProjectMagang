'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const categories = [
  {
    id: 'anorak',
    label: 'Anorak',
    description: 'Pullover iconic anti-angin',
    href: '/katalog?kategori=anorak',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop',
    count: 4,
  },
  {
    id: 'windbreaker',
    label: 'Windbreaker',
    description: 'Ringan, breathable, tahan angin',
    href: '/katalog?kategori=windbreaker',
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=600&auto=format&fit=crop',
    count: 6,
  },
  {
    id: 'fleece',
    label: 'Fleece',
    description: 'Hangat premium tanpa bulk',
    href: '/katalog?kategori=fleece',
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=600&auto=format&fit=crop',
    count: 3,
  },
  {
    id: 'full-zip',
    label: 'Full-Zip',
    description: 'Hard shell & shell premium',
    href: '/katalog?kategori=full-zip',
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=600&auto=format&fit=crop',
    count: 8,
  },
  {
    id: 'softshell',
    label: 'Softshell',
    description: 'Stretchable, all-terrain',
    href: '/katalog?kategori=softshell',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop',
    count: 5,
  },
];

export default function CategoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollBy = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === 'right' ? 320 : -320,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 350);
  };

  return (
    <section id="kategori" className="w-full py-16 sm:py-24 bg-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-mustard mb-2">
              // Kategori Produk
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-text-main">
              Kategori Pilihan
            </h2>
          </div>

          {/* Arrows */}
          <div className="flex gap-2">
            <button
              onClick={() => scrollBy('left')}
              disabled={!canScrollLeft}
              aria-label="Geser kiri"
              className={`w-10 h-10 border flex items-center justify-center transition-all duration-200 ${
                canScrollLeft
                  ? 'border-text-main text-text-main hover:bg-text-main hover:text-paper'
                  : 'border-hairline text-text-muted opacity-40 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollBy('right')}
              disabled={!canScrollRight}
              aria-label="Geser kanan"
              className={`w-10 h-10 border flex items-center justify-center transition-all duration-200 ${
                canScrollRight
                  ? 'border-text-main text-text-main hover:bg-text-main hover:text-paper'
                  : 'border-hairline text-text-muted opacity-40 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group flex-shrink-0 w-56 sm:w-64 relative overflow-hidden product-card-hover"
              style={{ minHeight: '300px' }}
            >
              {/* Image */}
              <div className="absolute inset-0">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-text-main/80 via-text-main/10 to-transparent" />
              </div>

              {/* Count badge */}
              <div className="absolute top-3 right-3 z-10">
                <span className="badge-pill bg-mustard text-text-main">
                  {cat.count} item
                </span>
              </div>

              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <h3 className="font-display text-xl font-bold uppercase tracking-tight text-paper mb-0.5">
                  {cat.label}
                </h3>
                <p className="font-sans text-[11px] text-paper/70 leading-snug">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
