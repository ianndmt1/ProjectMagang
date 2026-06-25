'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/sections/header';
import ProductCard from '@/components/ui/product-card';
import Button from '@/components/ui/button';
import ClientOnly from '@/components/ui/client-only';
import { mockProducts, brands, sizes, formatIDR } from '@/lib/mock-data';
import { Filter, RotateCcw, AlertTriangle, Compass, SlidersHorizontal, Check } from 'lucide-react';

export default function Catalog() {
  // Filter States
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(2500000);
  const [minGrade, setMinGrade] = useState<number>(80);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Toggle Brand selection
  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // Toggle Size selection
  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedBrands([]);
    setSelectedSizes([]);
    setMaxPrice(2500000);
    setMinGrade(80);
  };

  // Filtered Products Memo
  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
        return false;
      }
      // Size filter
      if (selectedSizes.length > 0 && !selectedSizes.includes(product.size)) {
        return false;
      }
      // Price filter
      if (product.price > maxPrice) {
        return false;
      }
      // Grade filter
      if (product.grade < minGrade) {
        return false;
      }
      return true;
    });
  }, [selectedBrands, selectedSizes, maxPrice, minGrade]);

  return (
    <div suppressHydrationWarning className="min-h-screen flex flex-col bg-bg text-text-main selection:bg-rust selection:text-paper">
      
      {/* Header Sticky */}
      <Header />

      <ClientOnly
        fallback={
          <main className="flex-grow flex items-center justify-center">
            <p className="font-mono text-xs text-text-muted uppercase tracking-widest animate-pulse">Loading Depot...</p>
          </main>
        }
      >
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb & Title */}
        <div className="mb-8 pb-6 border-b border-hairline flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center space-x-2 font-mono text-[9px] sm:text-[10px] tracking-widest text-tan uppercase mb-1">
              <span>SANTDOOR // DEPOT GEAR SURPLUS</span>
              <span className="text-hairline">|</span>
              <span>KATALOG TERSEDIA</span>
            </div>
            <h1 className="font-serif italic text-3xl font-bold text-text-main">
              Semua Gear Surplus
            </h1>
          </div>
          
          {/* Active Filter Count */}
          <div className="font-mono text-[10px] text-text-muted uppercase">
            Menampilkan <span className="font-bold text-text-main">{filteredProducts.length}</span> dari {mockProducts.length} item
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Filter Sidebar (12 Column grid: span 3) */}
          <aside className="hidden lg:block lg:col-span-3 bg-white border border-border p-5 sticky top-24 space-y-6 rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <span className="font-sans text-xs font-semibold uppercase tracking-widest flex items-center gap-2 text-text-main">
                <Filter className="w-3.5 h-3.5 text-tan" />
                <span>Filter</span>
              </span>
              {(selectedBrands.length > 0 || selectedSizes.length > 0 || maxPrice < 2500000 || minGrade > 80) && (
                <button 
                  onClick={handleResetFilters}
                  className="font-mono text-[9px] text-rust hover:text-text-main transition-colors flex items-center gap-1 uppercase"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Brand Filter */}
            <div className="space-y-3">
              <h4 className="font-mono text-[10px] uppercase font-bold text-tan tracking-wider">Brand</h4>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {brands.map(brand => {
                  const checked = selectedBrands.includes(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => handleBrandToggle(brand)}
                      className="flex items-center space-x-2.5 w-full text-left font-sans text-xs text-text-muted hover:text-text-main transition-colors py-0.5 group focus:outline-hidden"
                    >
                      <div className={`w-3.5 h-3.5 border transition-all flex items-center justify-center rounded-[2px] ${
                        checked ? 'bg-text-main border-text-main text-bg' : 'border-border group-hover:border-tan'
                      }`}>
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={checked ? 'text-text-main font-semibold' : ''}>{brand}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Filter */}
            <div className="space-y-3 pt-4 border-t border-hairline/60">
              <h4 className="font-mono text-[10px] uppercase font-bold text-tan tracking-wider">Ukuran</h4>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map(size => {
                  const active = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => handleSizeToggle(size)}
                      className={`w-9 h-9 border font-mono text-xs font-bold transition-all flex items-center justify-center rounded-[2px] ${
                        active 
                          ? 'bg-text-main text-bg border-text-main' 
                          : 'border-border text-text-muted hover:border-text-main hover:text-text-main'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-3 pt-4 border-t border-hairline/60">
              <div className="flex justify-between font-mono text-[10px] uppercase font-bold tracking-wider">
                <span className="text-tan">Harga Maks</span>
                <span className="font-semibold text-text-main">{formatIDR(maxPrice)}</span>
              </div>
              <input
                type="range"
                min="400000"
                max="2500000"
                step="50000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-text-main h-1 bg-bg cursor-pointer border-none"
              />
              <div className="flex justify-between font-mono text-[8px] text-text-muted">
                <span>Rp 400rb</span>
                <span>Rp 2.5jt</span>
              </div>
            </div>

            {/* Condition Grade Filter */}
            <div className="space-y-3 pt-4 border-t border-hairline/60">
              <div className="flex justify-between font-mono text-[10px] uppercase font-bold tracking-wider">
                <span className="text-tan">Grade Min.</span>
                <span className="font-semibold text-text-main">Grade {minGrade}%+</span>
              </div>
              <input
                type="range"
                min="80"
                max="100"
                step="1"
                value={minGrade}
                onChange={(e) => setMinGrade(Number(e.target.value))}
                className="w-full accent-text-main h-1 bg-bg cursor-pointer border-none"
              />
              <div className="flex justify-between font-mono text-[8px] text-text-muted">
                <span>80%</span>
                <span>100%</span>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Toggle Drawer */}
          <div className="lg:hidden flex justify-between items-center mb-4">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="inline-flex items-center space-x-2 px-4 py-2 border border-border bg-white font-mono text-[11px] uppercase tracking-wider text-text-main rounded-[2px]"
            >
              <SlidersHorizontal className="w-4 h-4 text-tan" />
              <span>Filter</span>
            </button>
            
            {(selectedBrands.length > 0 || selectedSizes.length > 0 || maxPrice < 2500000 || minGrade > 80) && (
              <button
                onClick={handleResetFilters}
                className="font-mono text-[10px] text-rust flex items-center gap-1 uppercase"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Mobile Filters Body Panel */}
          {mobileFiltersOpen && (
            <div className="lg:hidden bg-white border border-border p-4 space-y-5 mb-6 rounded-[2px] shadow-sm">
              {/* Brand Filter Mobile */}
              <div className="space-y-2">
                <h4 className="font-mono text-[9px] uppercase font-bold text-tan tracking-wider">Brand</h4>
                <div className="grid grid-cols-2 gap-2">
                  {brands.map(brand => {
                    const checked = selectedBrands.includes(brand);
                    return (
                      <button
                        key={brand}
                        onClick={() => handleBrandToggle(brand)}
                        className={`px-2 py-1.5 border font-mono text-[9px] uppercase transition-all text-center rounded-[2px] ${
                          checked ? 'bg-text-main text-bg border-text-main' : 'border-border text-text-muted bg-bg'
                        }`}
                      >
                        {brand}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Size Filter Mobile */}
              <div className="space-y-2">
                <h4 className="font-mono text-[9px] uppercase font-bold text-tan tracking-wider">Ukuran</h4>
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map(size => {
                    const active = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => handleSizeToggle(size)}
                        className={`w-8 h-8 border font-mono text-[10px] font-bold transition-all flex items-center justify-center rounded-[2px] ${
                          active ? 'bg-text-main text-bg border-text-main' : 'border-border text-text-muted bg-bg'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price & Grade Mobiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[9px] uppercase font-bold">
                    <span className="text-tan">Harga Maks</span>
                    <span className="font-bold text-text-main">{formatIDR(maxPrice)}</span>
                  </div>
                  <input
                    type="range"
                    min="400000"
                    max="2500000"
                    step="50000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-text-main"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[9px] uppercase font-bold">
                    <span className="text-tan">Grade Min.</span>
                    <span className="font-bold text-text-main">Grade {minGrade}%+</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="100"
                    step="1"
                    value={minGrade}
                    onChange={(e) => setMinGrade(Number(e.target.value))}
                    className="w-full accent-text-main"
                  />
                </div>
              </div>

              <Button 
                variant="primary" 
                size="sm" 
                fullWidth 
                onClick={() => setMobileFiltersOpen(false)}
                className="text-[10px]"
              >
                Terapkan Filter
              </Button>
            </div>
          )}

          {/* Product Grid Area (12 Column grid: span 9) */}
          <div className="lg:col-span-9">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              
              /* Distressed Premium Empty State */
              <div className="w-full py-16 px-4 bg-white border border-dashed border-border rounded-[2px] flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-12 h-12 text-tan/60 mb-4 animate-pulse" />
                <h3 className="font-serif italic text-xl font-bold text-text-main mb-2">
                  Tidak Ada Gear yang Cocok
                </h3>
                <p className="text-xs text-text-muted max-w-sm leading-relaxed mb-6 font-sans">
                  Maaf, tidak ada jaket outdoor di depot kami yang memenuhi spesifikasi pencarian Anda. Coba kurangi filter brand, naikkan budget harga maksimal, atau turunkan kriteria minimal grade kondisi.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetFilters} 
                    className="gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Semua Filter</span>
                  </Button>
                  <Link href="/#about">
                    <Button variant="panel" size="sm" className="gap-2">
                      <Compass className="w-3.5 h-3.5 text-tan" />
                      <span>Konsultasi dengan AI</span>
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>
      </ClientOnly>
      
      {/* Visual Footer stamp layout */}
      <footer className="w-full bg-panel/30 border-t border-hairline py-6 px-4 mt-12 text-center text-text-muted font-mono text-[9px] uppercase tracking-widest">
        <span>SANTDOOR.2ND SURPLUS PROCESSOR &bull; SHIFT STOCKS ONLINE</span>
      </footer>

    </div>
  );
}
