import React from 'react';
import { ShieldCheck, MapPin, BadgeCheck, Microscope } from 'lucide-react';

const reasons = [
  {
    icon: ShieldCheck,
    title: 'Rekber Tersedia',
    desc: 'Dukung transaksi aman via rekening bersama — kamu baru bayar setelah barang sampai dan oke.',
    color: 'text-tan',
  },
  {
    icon: MapPin,
    title: 'Kirim dari Klaten',
    desc: 'Pengiriman dari depot kami di Klaten via JNE, J&T, Sicepat, atau COD area Klaten & Jogja.',
    color: 'text-tan',
  },
  {
    icon: BadgeCheck,
    title: 'Harga Jujur',
    desc: 'Kami tampilkan harga ritel brand asli dan harga second kami — supaya kamu tahu value sesungguhnya.',
    color: 'text-tan',
  },
  {
    icon: Microscope,
    title: 'Kondisi Diinspeksi',
    desc: 'Setiap cacat fisik — sekecil apapun — kami dokumentasikan secara jujur sebelum dipasarkan.',
    color: 'text-tan',
  },
];

export default function WhyShopHere() {
  return (
    <section id="tentang" className="w-full py-20 sm:py-28 bg-bg border-t border-hairline/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-tan mb-3">
            Kenapa SANTDOOR.2ND
          </p>
          <h2 className="font-serif italic text-3xl sm:text-4xl font-bold text-text-main">
            Kenapa Belanja di Sini
          </h2>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="group p-6 bg-white border border-border hover:border-tan transition-all duration-300 rounded-[2px] shadow-[0_1px_6px_rgba(0,0,0,0.02)] product-card-hover"
              >
                <div className={`mb-4 ${item.color}`}>
                  <Icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="font-sans text-sm font-semibold tracking-wide text-text-main mb-2">
                  {item.title}
                </h3>
                <p className="font-sans text-[12px] text-text-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
