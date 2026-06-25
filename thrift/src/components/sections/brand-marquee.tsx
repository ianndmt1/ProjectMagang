import React from 'react';
import { brands } from '@/lib/mock-data';

export default function BrandMarquee() {
  // Repeat the brands array to fill the screen and allow seamless wrapping
  const repeatedBrands = [...brands, ...brands, ...brands, ...brands];

  return (
    <section id="marquee" className="w-full bg-panel border-b border-hairline py-4 overflow-hidden select-none">
      <div className="relative w-full flex items-center">
        {/* Infinite scrolling container */}
        <div className="flex space-x-12 animate-marquee whitespace-nowrap">
          {repeatedBrands.map((brand, index) => (
            <div 
              key={`${brand}-${index}`} 
              className="flex items-center space-x-2 text-text-muted font-display text-sm tracking-[0.25em] font-semibold uppercase hover:text-mustard transition-colors duration-200"
            >
              <span className="text-mustard font-mono">&#9670;</span>
              <span>{brand}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
