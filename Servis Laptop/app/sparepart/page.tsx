"use client";

import { useState, useEffect } from "react";
import { STORE_INFO } from "@/lib/store-info";

interface Sparepart {
  id: string;
  name: string;
  category: string;
  price_note: string;
  image_url: string | null;
  is_available: boolean;
}

export default function SparepartCatalogPage() {
  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const dummySpareparts: Sparepart[] = [
    {
      id: "1",
      name: "SSD NVMe M.2 Crucial P3 512GB",
      category: "SSD",
      price_note: "Rp 650.000 (Tersedia)",
      image_url: null,
      is_available: true
    },
    {
      id: "2",
      name: "RAM DDR4 SODIMM Kingston Fury 8GB 3200MHz",
      category: "RAM",
      price_note: "Rp 380.000 (Tersedia)",
      image_url: null,
      is_available: true
    },
    {
      id: "3",
      name: "Baterai Laptop Asus Original C31N1620",
      category: "Baterai",
      price_note: "Rp 450.000 (Tersedia)",
      image_url: null,
      is_available: true
    },
    {
      id: "4",
      name: "Keyboard Laptop Lenovo ThinkPad L480",
      category: "Keyboard",
      price_note: "Rp 280.000 (Tersedia)",
      image_url: null,
      is_available: true
    },
    {
      id: "5",
      name: "SSD SATA III V-Gen Platinum 256GB",
      category: "SSD",
      price_note: "Rp 320.000 (Tersedia)",
      image_url: null,
      is_available: true
    },
    {
      id: "6",
      name: "RAM DDR4 SODIMM V-Gen 16GB 3200MHz",
      category: "RAM",
      price_note: "Rp 680.000 (Tersedia)",
      image_url: null,
      is_available: true
    }
  ];

  const categories = ["Semua", "RAM", "SSD", "Baterai", "Keyboard", "Lainnya"];

  useEffect(() => {
    async function loadSpareparts() {
      try {
        const res = await fetch("/api/sparepart");
        const result = await res.json();
        if (res.ok && result.data && result.data.length > 0) {
          setSpareparts(result.data);
        } else {
          setSpareparts(dummySpareparts);
        }
      } catch (err) {
        setSpareparts(dummySpareparts);
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
    const text = `Halo BK Computer, saya ingin menanyakan ketersediaan sparepart berikut: *${partName}*. Apakah barangnya ready?`;
    return `https://wa.me/${STORE_INFO.contact.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col selection:bg-solder/20">
      {/* Header */}
      <header className="border-b border-ink/10 bg-paper sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 border-2 border-ink flex items-center justify-center font-display font-bold text-lg bg-solder text-white">
              BK
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight block">BK COMPUTER</span>
              <span className="text-[9px] font-mono tracking-widest text-muted-gray uppercase block -mt-1">Pusat Servis Solo</span>
            </div>
          </a>
          <nav className="flex items-center gap-6">
            <a href="/" className="text-xs font-mono font-bold hover:text-solder transition-colors">BERANDA</a>
            <a href="/cek-status" className="text-xs font-mono font-bold hover:text-solder transition-colors">TRACK_STATUS</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-extrabold text-ink">KATALOG_SPAREPART</h1>
          <p className="text-xs font-mono text-muted-gray uppercase mt-1">Stok komponen pengganti kualitas teruji</p>
        </div>

        {/* Category Filters */}
        <div className="flex justify-center gap-2 flex-wrap mb-10 font-mono text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 border transition-all ${
                selectedCategory === cat
                  ? "bg-ink border-ink text-paper font-bold shadow-[2px_2px_0px_0px_rgba(232,114,12,1)]"
                  : "bg-[#FFFFFC] border-ink/20 text-muted-gray hover:text-ink hover:border-ink shadow-[2px_2px_0px_0px_rgba(27,36,48,0.05)]"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Grid Items */}
        {loading ? (
          <div className="text-center py-20 text-muted-gray font-mono text-xs">LOADING_SPAREPART_DATA...</div>
        ) : filteredParts.length === 0 ? (
          <div className="text-center py-20 text-muted-gray font-mono text-xs">NO_SPAREPART_FOUND_FOR_THIS_CATEGORY</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredParts.map(part => (
              <div 
                key={part.id} 
                className="bg-[#FFFFFC] border border-ink p-6 shadow-[3px_3px_0px_0px_rgba(27,36,48,1)] flex flex-col justify-between hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(27,36,48,1)] transition-all group"
              >
                <div>
                  {/* Sparepart Icon Area */}
                  <div className="w-full h-36 bg-paper/40 border border-ink/10 flex items-center justify-center mb-4 text-3xl font-mono">
                    {part.category.toUpperCase() === "SSD" || part.category.toUpperCase() === "RAM" ? "📟" : 
                     part.category.toUpperCase() === "BATERAI" ? "🔋" : 
                     part.category.toUpperCase() === "KEYBOARD" ? "⌨️" : "📦"}
                  </div>
                  
                  {/* Category Badge */}
                  <span className="inline-block border border-ink/20 bg-paper/60 px-2 py-0.5 text-[9px] font-mono uppercase text-muted-gray mb-2">
                    {part.category}
                  </span>
                  
                  {/* Name */}
                  <h3 className="font-display font-bold text-ink text-sm mb-1 leading-snug">{part.name}</h3>
                  
                  {/* Price */}
                  <p className="text-solder text-xs font-mono font-bold mb-6">{part.price_note}</p>
                </div>

                {/* Buy Button */}
                <a
                  href={getWaLink(part.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-paper hover:bg-ink hover:text-paper text-ink border border-ink font-mono font-bold py-2.5 px-4 text-center inline-block text-xs transition-all shadow-[2px_2px_0px_0px_rgba(27,36,48,1)] active:translate-y-0.5"
                >
                  TANYA_VIA_WHATSAPP_LINK ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-ink text-paper py-8 text-center text-xs font-mono border-t border-ink/10">
        &copy; {new Date().getFullYear()} BK Computer. BK_DIGITAL_TICKET_SYSTEM.
      </footer>
    </div>
  );
}
