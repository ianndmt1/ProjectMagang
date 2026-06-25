import React from 'react';
import Link from 'next/link';
import { mockProducts } from '@/lib/mock-data';
import ProductCard from '@/components/ui/product-card';
import { ArrowRight } from 'lucide-react';

export default function NewDrops() {
  // Only available products, show 6
  const newDrops = mockProducts.filter(p => p.status === 'available').slice(0, 6);

  return (
    <section id="baru-masuk" className="w-full py-20 sm:py-28 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-mustard mb-2">
              Drop Terbaru
            </p>
            <h2 className="font-serif italic text-3xl sm:text-4xl font-bold text-text-main">
              Baru Masuk
            </h2>
          </div>
          <Link
            href="/katalog"
            className="font-sans text-xs uppercase tracking-widest text-text-muted hover:text-text-main hover:underline decoration-tan decoration-1 underline-offset-4 transition-all self-start sm:self-auto"
          >
            Lihat Semua
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {newDrops.map((product) => (
            <ProductCard key={product.id} product={product} showRetailPrice />
          ))}
        </div>

      </div>
    </section>
  );
}
