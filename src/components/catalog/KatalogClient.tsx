"use client";

import { useState } from "react";
import { Product } from "@/types";
import ProductCard from "@/components/catalog/ProductCard";

interface KatalogClientProps {
  products: Product[];
}

type FilterCategory = "semua" | "tanaman_hias" | "bunga_potong" | "pupuk" | "pot" | "aksesoris";

const FILTER_OPTIONS: { value: FilterCategory; label: string; icon: string }[] = [
  { value: "semua", label: "Semua Produk", icon: "🌸" },
  { value: "tanaman_hias", label: "Tanaman Hias", icon: "🌿" },
  { value: "bunga_potong", label: "Bunga Potong", icon: "🌹" },
  { value: "pupuk", label: "Pupuk", icon: "🟤" },
  { value: "pot", label: "Pot", icon: "🪴" },
  { value: "aksesoris", label: "Aksesoris", icon: "🎀" },
];

export default function KatalogClient({ products }: KatalogClientProps) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("semua");

  const filteredProducts = activeCategory === "semua"
    ? products
    : products.filter((p) => p.category === activeCategory as string);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-dark-green sm:text-4xl">
          Katalog Produk Bakoel Kembang
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
          Temukan berbagai pilihan tanaman hias, bunga potong segar, pupuk berkualitas, pot cantik, dan aksesoris berkebun terbaik untuk hunian Anda.
        </p>
      </div>

      {/* Filter Pills */}
      <div className="mb-10 flex flex-wrap justify-center gap-3">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = activeCategory === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setActiveCategory(opt.value)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 shadow-sm active:scale-95 cursor-pointer ${
                isActive
                  ? "bg-dark-green text-white"
                  : "bg-white text-dark-green hover:bg-cream border border-cream-soft hover:border-dark-green/30"
              }`}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl">🪴</span>
          <p className="mt-4 text-lg font-medium text-gray-500">
            Belum ada produk di kategori ini
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Coba pilih kategori produk lainnya.
          </p>
        </div>
      )}
    </div>
  );
}
