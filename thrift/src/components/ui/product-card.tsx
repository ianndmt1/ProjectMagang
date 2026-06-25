import React from 'react';
import Link from 'next/link';
import { Product, formatIDR } from '@/lib/mock-data';
import GradeStamp from './grade-stamp';
import ShareButton from './share-button';

interface ProductCardProps {
  product: Product;
  showRetailPrice?: boolean;
}

// Estimated retail prices (simplified for demo — real data should be in mock-data)
const retailPriceMap: Record<string, number> = {
  'The North Face': 2500000,
  'Napapijri': 3200000,
  'Patagonia': 4000000,
  'Columbia': 1800000,
  "Arc'teryx": 8000000,
  'Mammut': 3500000,
  'Helly Hansen': 2800000,
  'Berghaus': 2200000,
  'Jack Wolfskin': 2500000,
};

export default function ProductCard({ product, showRetailPrice = true }: ProductCardProps) {
  const isSold = product.status === 'sold';
  const retailPrice = retailPriceMap[product.brand];

  return (
    <div className={`group relative flex flex-col bg-white border border-hairline/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 product-card-hover ${isSold ? 'opacity-70' : ''}`}>

      {/* Thumbnail */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-panel select-none">

        {/* SOLD overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-bg/70 z-20 flex items-center justify-center">
            <div className="border-2 border-rust text-rust font-sans text-xs font-bold px-5 py-1.5 tracking-widest uppercase rotate-[-6deg] bg-bg/90 rounded-[2px]">
              TERJUAL
            </div>
          </div>
        )}

        <img
          src={product.images[0]}
          alt={`${product.brand} ${product.name}`}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badge BARU MASUK */}
        {!isSold && (
          <div className="absolute top-3 left-3 z-10">
            <span className="badge-pill bg-text-main text-bg">
              Baru Masuk
            </span>
          </div>
        )}

        {/* Grade Stamp — top right */}
        <div className="absolute top-3 right-3 z-10">
          <GradeStamp grade={product.grade} size="sm" variant="flat" />
        </div>

        {/* Share button overlay — bottom right */}
        {!isSold && (
          <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ShareButton
              productName={product.name}
              productBrand={product.brand}
              productPrice={product.price}
              productSlug={product.slug}
              productGrade={product.grade}
              size="sm"
              variant="icon"
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-grow p-4 bg-white dark:bg-[#1A1A1A]">
        <span className="font-mono text-[9px] font-medium uppercase tracking-widest text-tan mb-1">
          LOT N°{product.lotNumber} · {product.brand}
        </span>

        <h3 className="font-sans text-sm font-medium tracking-wide text-text-main mb-1 line-clamp-2 relative">
          <Link href={`/produk/${product.slug}`} className="focus:outline-none">
            <span className="absolute inset-0 z-0" aria-hidden="true" />
            {product.name}
          </Link>
        </h3>

        {product.defects && (
          <p className="text-[11px] text-text-muted line-clamp-1 mb-3 italic leading-relaxed">
            {product.defects}
          </p>
        )}

        {/* Price row */}
        <div className="mt-auto pt-3 border-t border-hairline/40 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {showRetailPrice && retailPrice && (
              <span className="font-mono text-[10px] text-text-muted line-through">
                {formatIDR(retailPrice)}
              </span>
            )}
            <span className={`font-mono text-sm font-semibold ${isSold ? 'text-text-muted' : 'text-rust'}`}>
              {isSold ? 'Habis Terjual' : formatIDR(product.price)}
            </span>
          </div>

          {!isSold && (
            <span className="font-sans text-[10px] text-text-muted uppercase tracking-widest group-hover:text-rust transition-colors z-10 relative">
              Detail
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
