"use client";

import { useState } from "react";
import Image from "next/image";
import { Product, CATEGORY_LABELS } from "@/types";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imgSrc, setImgSrc] = useState(product.image_url || "/placeholder-plant.jpg");

  // Format harga ke Rupiah
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Generate WA Order URL
  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER || "6285725280724";
  const defaultMessage = `Halo Bakoel Kembang, saya mau pesan ${product.name}. Mohon info ketersediaan dan harga terbaru ya. Terima kasih 🌿`;
  const waMessage = product.wa_message || defaultMessage;
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

  const categoryLabel = CATEGORY_LABELS[product.category] || product.category;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-cream-soft bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div>
        {/* Container Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgSrc("/placeholder-plant.jpg")}
          />
          {/* Badge Kategori */}
          <div className="absolute left-3 top-3">
            <Badge className="bg-dark-green text-white hover:bg-dark-green/90 rounded-md font-medium text-xs py-1 px-2.5">
              {categoryLabel}
            </Badge>
          </div>
        </div>

        {/* Content Info */}
        <div className="p-4 sm:p-5">
          <h3 className="text-lg font-bold text-dark-green group-hover:text-sage transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-2 text-sm text-gray-500 line-clamp-2 min-h-[2.5rem] leading-relaxed">
            {product.description || "Tidak ada deskripsi produk."}
          </p>
          <div className="mt-4 flex items-baseline">
            <span className="text-xl font-extrabold text-dark-green">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 pt-0">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sage py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#769768] active:scale-98"
        >
          <ShoppingCart className="h-4 w-4" />
          Pesan via WhatsApp
        </a>
      </div>
    </div>
  );
}
