import Link from "next/link";
import { Phone, MapPin, Clock, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-dark-green text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-white/10 pb-8">
          
          {/* Kolom 1: Info Toko */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-wide text-cream-soft">
              🌸 Bakoel Kembang
            </h3>
            <p className="text-sm text-white/80 leading-relaxed max-w-sm">
              Toko bunga dan tanaman terpercaya di Boyolali. Menyediakan bunga segar, tanaman hias, pupuk, media tanam, serta konsultasi kesehatan tanaman berbasis AI.
            </p>
            <div className="flex items-start gap-2 text-sm text-white/80">
              <MapPin className="h-5 w-5 text-sage flex-shrink-0 mt-0.5" />
              <span>Mojosongo, Boyolali, Jawa Tengah</span>
            </div>
          </div>

          {/* Kolom 2: Navigasi */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-cream-soft">Navigasi</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link href="/" className="hover:text-sage transition-colors duration-150">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/katalog" className="hover:text-sage transition-colors duration-150">
                  Katalog Produk
                </Link>
              </li>
              <li>
                <Link href="/plant-doctor" className="hover:text-sage transition-colors duration-150">
                  AI Plant Doctor
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Kontak & Operasional */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-cream-soft">Kontak & Jam Buka</h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li>
                <a
                  href="https://wa.me/6285725280724"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-sage transition-colors duration-150 group"
                >
                  <Phone className="h-5 w-5 text-sage group-hover:scale-110 transition-transform" />
                  <span>0857-2528-0724 (WhatsApp)</span>
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-sage" />
                <span>Senin–Sabtu, 08.00–17.00 WIB</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Hak Cipta */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-xs text-white/60 gap-4">
          <p>© 2025 Bakoel Kembang Boyolali. Hak Cipta Dilindungi.</p>
          <p className="flex items-center gap-1">
            Dibuat dengan <Heart className="h-3.5 w-3.5 text-red-400 fill-red-400" /> untuk pecinta tanaman di Boyolali
          </p>
        </div>
      </div>
    </footer>
  );
}
