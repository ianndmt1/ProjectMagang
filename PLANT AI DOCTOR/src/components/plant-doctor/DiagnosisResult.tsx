"use client";

import { Product } from "@/types";
import Image from "next/image";
import { useState } from "react";
import {
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Phone,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  aiResult: {
    disease_name: string;
    confidence: number;
    severity: string;
    is_healthy: boolean;
    description: string;
    symptoms: string[];
    treatment_tips: string[];
  };
  matchedDisease: { id: string; name: string; description: string } | null;
  recommendedProducts: Array<{
    priority: number;
    note: string;
    product: Product;
  }>;
}

export default function DiagnosisResult({
  aiResult,
  matchedDisease,
  recommendedProducts,
}: Props) {
  // Format harga ke Rupiah
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Generate WA URL
  const generateWaUrl = (message: string) => {
    const waNumber = "6285725280724";
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  };

  const isHealthy = aiResult.is_healthy;
  const confidence = aiResult.confidence;

  // Warna keparahan (severity)
  const getSeverityBadge = (severity: string) => {
    const s = severity.toLowerCase();
    if (s === "ringan") {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
          Ringan
        </Badge>
      );
    } else if (s === "sedang") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
          Sedang
        </Badge>
      );
    } else if (s === "parah" || s === "berat") {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
          Parah
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
          Sehat
        </Badge>
      );
    };
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* CARD UTAMA: HASIL DIAGNOSIS */}
      <div className="bg-white rounded-2xl border border-cream-soft p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-cream-soft pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {isHealthy ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Tanaman Sehat</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-red-50 text-red-700 border border-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Terdeteksi Masalah</span>
                </div>
              )}
              {!isHealthy && getSeverityBadge(aiResult.severity)}
            </div>
            
            <h3 className="text-2xl font-extrabold text-dark-green">
              {aiResult.disease_name}
              {confidence && (
                <span className="text-gray-400 font-medium text-lg ml-2">
                  — {confidence}% yakin
                </span>
              )}
            </h3>
          </div>
          
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-sage" />
            Diagnosis instan didukung oleh AI
          </div>
        </div>

        {/* Deskripsi */}
        <div className="py-6">
          <h4 className="font-bold text-gray-700 mb-2">Deskripsi Kondisi</h4>
          <p className="text-gray-600 leading-relaxed text-sm">
            {aiResult.description}
          </p>
        </div>

        {/* Gejala & Penanganan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-cream-soft">
          
          {/* List Gejala */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Gejala Terdeteksi
            </h4>
            {aiResult.symptoms && aiResult.symptoms.length > 0 ? (
              <ul className="space-y-2">
                {aiResult.symptoms.map((symptom, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-amber-500 select-none mt-0.5">•</span>
                    <span>{symptom}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">Tidak ada gejala spesifik yang terlihat.</p>
            )}
          </div>

          {/* Tips Perawatan */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-700 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-sage" />
              Saran Perawatan
            </h4>
            {aiResult.treatment_tips && aiResult.treatment_tips.length > 0 ? (
              <ul className="space-y-2">
                {aiResult.treatment_tips.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-sage select-none mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">Tidak ada saran perawatan spesifik.</p>
            )}
          </div>

        </div>
      </div>

      {/* CARD KEDUA: REKOMENDASI PRODUK */}
      <div className="bg-white rounded-2xl border border-cream-soft p-6 sm:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-dark-green mb-6 border-b border-cream-soft pb-4">
          Produk Rekomendasi Penanganan
        </h3>

        {recommendedProducts && recommendedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {recommendedProducts.map(({ priority, note, product }) => {
              const defaultMsg = `Halo Bakoel Kembang, saya mendapat rekomendasi produk ${product.name} dari AI Plant Doctor untuk tanaman saya. Apakah stoknya tersedia? 🌿`;
              const waUrl = generateWaUrl(product.wa_message || defaultMsg);
              const fallbackImg = "/placeholder-plant.jpg";

              return (
                <div
                  key={product.id}
                  className="flex flex-col justify-between p-4 rounded-xl border border-cream-soft bg-cream-soft/10 group"
                >
                  <div className="space-y-3">
                    {/* Header: Prioritas & Catatan */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sage/20 text-dark-green">
                        Prioritas #{priority}
                      </span>
                    </div>

                    <h4 className="font-bold text-dark-green group-hover:text-sage transition-colors line-clamp-1">
                      {product.name}
                    </h4>

                    {note && (
                      <p className="text-xs text-gray-500 italic bg-white p-2 rounded border border-cream-soft">
                        <strong>Tips:</strong> {note}
                      </p>
                    )}

                    <div className="text-sm font-extrabold text-dark-green pt-1">
                      {formatPrice(product.price)}
                    </div>
                  </div>

                  {/* Tombol Pesan */}
                  <div className="pt-4">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-sage py-2 text-center text-xs font-semibold text-white hover:bg-[#769768] transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Pesan via WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            {!isHealthy ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Tidak ditemukan obat/produk yang spesifik cocok di database kami. Anda bisa mengonsultasikan langsung foto diagnosis ini dengan tim ahli kami untuk resep penanganan kustom.
                </p>
                <a
                  href={generateWaUrl(
                    `Halo Bakoel Kembang, saya baru saja melakukan scan tanaman dan terdeteksi "${aiResult.disease_name}". Berikut deskripsinya: ${aiResult.description}. Mohon info produk atau saran penanganannya ya 🌿`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-sage px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#769768] transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Konsultasikan langsung via WhatsApp kami
                </a>
              </div>
            ) : (
              <p className="text-sm text-green-600 font-medium">
                Tanaman Anda sehat! Pertahankan perawatan berkebun yang baik ini. 🌿
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
