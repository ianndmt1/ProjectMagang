import React from 'react';
import { formatIDR } from '@/lib/mock-data';
import { ShieldCheck, Flame, Compass, MessageSquare } from 'lucide-react';
import GradeStamp from '@/components/ui/grade-stamp';

export default function AboutSurplus() {
  return (
    <section id="about" className="w-full py-16 sm:py-24 bg-panel border-b border-hairline relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Curation Story */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center space-x-2 font-mono text-[9px] sm:text-[10px] tracking-widest text-mustard uppercase">
              <span>// SURPLUS DEPOT STORY</span>
              <span className="text-hairline">|</span>
              <span>EST. 2024</span>
            </div>
            
            <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-text-main">
              ABOUT SANTDOOR.2ND
            </h2>
            
            <p className="text-sm text-text-muted leading-relaxed">
              SANTDOOR.2ND lahir di Klaten, Jawa Tengah, dari kecintaan terhadap fungsionalitas dan durabilitas pakaian outdoor military &amp; alpine-surplus. Kami memahami bahwa jaket gunung berkualitas premium seringkali tidak terjangkau.
            </p>
            <p className="text-sm text-text-muted leading-relaxed">
              Misi kami sederhana: memberikan akses pakaian outdoor berkualitas tinggi dengan harga yang masuk akal. Setiap barang second yang masuk melewati proses pencucian menyeluruh (deep cleaning), disinfeksi, pemeriksaan kecacatan mendalam, dan penentuan grade kondisi fisik secara jujur.
            </p>

            {/* Quality Seals */}
            <div className="pt-4 border-t border-hairline/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-mustard flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-mono text-xs uppercase font-bold text-text-main">Honest Tagging</h4>
                  <p className="text-[11px] text-text-muted leading-relaxed">Kecacatan detail (noda gesek, seal mengelupas) kami cantumkan sejelas-jelasnya.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Flame className="w-5 h-5 text-rust flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-mono text-xs uppercase font-bold text-text-main">1 of 1 Stock</h4>
                  <p className="text-[11px] text-text-muted leading-relaxed">Setiap nomor LOT adalah barang unik dengan karakteristiknya sendiri. Sold out berarti hilang selamanya.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Static Mock Chat Preview */}
          <div className="lg:col-span-6">
            <div className="w-full max-w-md mx-auto bg-bg border border-hairline rounded-none overflow-hidden shadow-2xl">
              
              {/* Chat Header */}
              <div className="px-4 py-3 bg-panel border-b border-hairline flex items-center justify-between select-none">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-rust animate-pulse" />
                  <div className="font-mono text-xs tracking-wider uppercase">
                    <span className="font-bold text-text-main">SANTDOOR AI</span>
                    <span className="text-text-muted text-[10px] ml-2">DEMO PREVIEW</span>
                  </div>
                </div>
                <MessageSquare className="w-4 h-4 text-text-muted" />
              </div>

              {/* Chat Body */}
              <div className="p-4 space-y-4 max-h-[360px] overflow-y-auto font-sans text-xs">
                
                {/* User Message */}
                <div className="flex flex-col items-end space-y-1">
                  <span className="font-mono text-[9px] text-text-muted">PEMBELI // 16:35</span>
                  <div className="bg-panel border border-hairline text-text-main px-3 py-2 max-w-[85%] rounded-none">
                    Cari jaket TNF ukuran XL yang harganya di bawah 800rb dong.
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex flex-col items-start space-y-1">
                  <span className="font-mono text-[9px] text-mustard uppercase font-bold">SANTDOOR AI assistant // 16:35</span>
                  <div className="bg-rust text-paper px-3 py-2.5 max-w-[85%] rounded-none space-y-3 shadow-md">
                    <p>Siap. Menemukan 1 item yang sesuai filter Anda:</p>
                    
                    {/* Mini Product Card inside bubble */}
                    <div className="bg-bg text-text-main border border-hairline/60 p-2 flex space-x-3 items-center rounded-none relative">
                      <div className="w-14 h-14 bg-panel border border-hairline flex-shrink-0 relative overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=150&auto=format&fit=crop" 
                          alt="TNF Mountain Light Jacket"
                          className="w-full h-full object-cover opacity-70"
                        />
                        <div className="absolute bottom-0 right-0">
                          <GradeStamp grade={95} size="sm" className="scale-65 origin-bottom-right" />
                        </div>
                      </div>
                      
                      <div className="flex-grow min-w-0 font-sans">
                        <p className="font-mono text-[9px] text-mustard font-bold">LOT N°042</p>
                        <p className="font-display font-bold uppercase text-[10px] text-text-main tracking-tight truncate">
                          Gore-Tex Mountain Light
                        </p>
                        <p className="font-mono text-[10px] text-paper font-bold mt-1">
                          {formatIDR(750000)}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] opacity-90 leading-relaxed">
                      Jaket ini berukuran **XL** dengan kondisi mulus **95%** (Approved). Terdapat noda tipis di saku depan kanan bawah (tercatat di defect report). Apakah Anda ingin melihat detail gear ini?
                    </p>
                  </div>
                </div>

              </div>

              {/* Chat Input Mock */}
              <div className="p-3 border-t border-hairline bg-panel flex space-x-2 select-none pointer-events-none opacity-55">
                <div className="flex-grow bg-bg border border-hairline px-3 py-1.5 font-mono text-[10px] text-text-muted flex items-center justify-between">
                  <span>Tanya AI mengenai stock jaket...</span>
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div className="bg-rust text-paper px-3 flex items-center justify-center font-mono text-[10px] font-bold uppercase">
                  Kirim
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
