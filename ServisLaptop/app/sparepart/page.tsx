"use client";

import { useState, useEffect } from "react";
import { DEFAULT_APP_SETTINGS, AppSettings } from "@/lib/settings-config";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

interface Sparepart {
  id: string;
  name: string;
  category: string;
  price_note: string;
  image_url: string | null;
  is_available: boolean;
}

export default function SparepartCatalogPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const categories = ["Semua", "RAM", "SSD", "Baterai", "Keyboard", "Lainnya"];

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((res) => {
        if (res?.data) {
          setSettings(res.data);
        }
      })
      .catch((err) => console.warn("Failed to fetch settings:", err));

    async function loadSpareparts() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch("/api/sparepart");
        if (!res.ok) {
          throw new Error("Gagal mengambil data dari server");
        }
        
        const result = await res.json();
        if (result.data) {
          setSpareparts(result.data);
        } else {
          setSpareparts([]);
        }
      } catch (err) {
        setErrorMsg("Gagal memuat katalog sparepart. Coba muat ulang halaman atau hubungi admin.");
        setSpareparts([]);
      } finally {
        setLoading(false);
      }
    }
    loadSpareparts();
  }, []);

  const filteredParts = selectedCategory === "Semua"
    ? spareparts
    : spareparts.filter(item => item.category.toUpperCase() === selectedCategory.toUpperCase());

  const getWaLink = (partName: string) => {
    const text = `Halo ${settings.shop_name}, saya ingin menanyakan ketersediaan sparepart berikut: *${partName}*. Apakah barangnya ready?`;
    return `https://wa.me/${settings.shop_whatsapp}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F172A", color: "#F1F5F9" }}>
      {/* Header */}
      <SiteHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-sm font-medium mb-3" style={{ color: "#2DD4BF", fontFamily: "var(--font-mono)" }}>
            — Komponen Pengganti —
          </p>
          <h1 
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Katalog Sparepart
          </h1>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            Stok komponen pengganti berkualitas teruji untuk laptop dan PC Anda.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex sm:justify-center gap-2.5 overflow-x-auto flex-nowrap pb-2 sm:pb-0 mb-10 sm:mb-12 px-1 sm:px-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center justify-center min-h-[44px] flex-shrink-0 ${
                selectedCategory === cat
                  ? "text-white shadow-lg"
                  : "text-slate-400 hover:text-white border"
              }`}
              style={
                selectedCategory === cat
                  ? { 
                      background: "linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)",
                      boxShadow: "0 4px 16px rgba(20,184,166,0.25)",
                      fontFamily: "var(--font-sans)"
                    }
                  : { 
                      background: "rgba(255,255,255,0.03)", 
                      borderColor: "rgba(255,255,255,0.1)",
                      fontFamily: "var(--font-sans)"
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid Items */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
            </svg>
            <div className="text-slate-400 text-sm">Memuat data sparepart...</div>
          </div>
        ) : errorMsg || filteredParts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div 
              className="p-8 rounded-2xl border text-center max-w-md w-full"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl"
                style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
              >
                📦
              </div>
              <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Katalog sparepart akan tampil di sini
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {errorMsg
                  ? "Terjadi kendala koneksi ke database. Silakan muat ulang halaman."
                  : selectedCategory !== "Semua"
                  ? `Belum ada sparepart tersedia untuk kategori "${selectedCategory}".`
                  : "Stok katalog sparepart sedang diperbarui oleh admin."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredParts.map(part => (
              <div 
                key={part.id} 
                className="group relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <div>
                  {/* Sparepart Icon Area */}
                  <div 
                    className="w-full h-28 sm:h-36 rounded-xl flex items-center justify-center mb-3 sm:mb-4 text-3xl sm:text-4xl"
                    style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    {part.category.toUpperCase() === "SSD" || part.category.toUpperCase() === "RAM" ? "📟" : 
                     part.category.toUpperCase() === "BATERAI" ? "🔋" : 
                     part.category.toUpperCase() === "KEYBOARD" ? "⌨️" : "📦"}
                  </div>
                  
                  {/* Category Badge */}
                  <span 
                    className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-medium tracking-wider uppercase mb-2"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#94A3B8" }}
                  >
                    {part.category}
                  </span>
                  
                  {/* Name */}
                  <h3 
                    className="font-bold text-white text-xs sm:text-base mb-1.5 leading-snug group-hover:text-[#2DD4BF] transition-colors line-clamp-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {part.name}
                  </h3>
                  
                  {/* Price */}
                  <p 
                    className="text-xs sm:text-base font-bold mb-4"
                    style={{ color: "#3B82F6", fontFamily: "var(--font-mono)" }}
                  >
                    {part.price_note}
                  </p>
                </div>

                {/* Buy Button */}
                <a
                  href={getWaLink(part.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold text-white transition-all hover:scale-[1.02] shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)",
                    boxShadow: "0 4px 16px rgba(20,184,166,0.25)",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Tanya via WA
                </a>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <SiteFooter settings={settings} />
    </div>
  );
}
