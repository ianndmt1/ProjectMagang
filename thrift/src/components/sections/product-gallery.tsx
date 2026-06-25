'use client';

import React, { useState } from 'react';
import GradeStamp from '@/components/ui/grade-stamp';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  grade: number;
  isSold: boolean;
}

export default function ProductGallery({ images, productName, grade, isSold }: ProductGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative aspect-[4/3] w-full bg-panel hairline-border overflow-hidden select-none">
        {isSold && (
          <div className="absolute inset-0 bg-bg/85 z-10 flex items-center justify-center">
            <div className="border-2 border-rust text-rust font-display text-3xl font-bold px-6 py-2 tracking-widest uppercase rotate-[-6deg] select-none">
              SOLD OUT
            </div>
          </div>
        )}

        <img
          src={images[activeImageIndex]}
          alt={`${productName} - Angle ${activeImageIndex + 1}`}
          className="w-full h-full object-cover opacity-80 transition-opacity duration-300"
        />

        {/* Floating Grade Stamp on Main Image */}
        <div className="absolute bottom-4 right-4 z-10">
          <GradeStamp grade={grade} size="md" />
        </div>
      </div>

      {/* Thumbnail Selection Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 select-none">
          {images.map((img, idx) => {
            const isActive = idx === activeImageIndex;
            return (
              <button
                key={`${img}-${idx}`}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative aspect-square bg-panel overflow-hidden hairline-border transition-all duration-200 focus:outline-hidden ${
                  isActive ? 'border-mustard/60 opacity-90 scale-[0.98]' : 'opacity-50 hover:opacity-75'
                }`}
                aria-label={`View image angle ${idx + 1}`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {isActive && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-mustard" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
