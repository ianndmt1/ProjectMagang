export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { Product } from "@/types";
import ProductCard from "@/components/catalog/ProductCard";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Bot,
  Star,
  MapPin,
  Phone,
  Clock,
  Sparkles,
} from "lucide-react";

// Fetch data dari /api/products
async function getFeaturedProducts(): Promise<Product[]> {
  let products: Product[] = [];
  
  try {
    // Dapatkan host secara dinamis dari headers agar bekerja di production/staging
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    
    const res = await fetch(`${baseUrl}/api/products`, {
      cache: "no-store",
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        products = json.data.slice(0, 4);
      }
    }
  } catch (error) {
    console.error("Gagal fetch dari API /api/products, menggunakan fallback DB query:", error);
    
    // Fallback: Query langsung dari database menggunakan admin client jika API fetch gagal/saat build
    try {
      const supabase = createAdminClient();
      const { data, error: dbError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(4);
        
      if (!dbError && data) {
        products = data;
      }
    } catch (fallbackError) {
      console.error("Fallback query database gagal:", fallbackError);
    }
  }
  
  return products;
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  const advantages = [
    {
      icon: <ShieldCheck className="h-8 w-8 text-sage" />,
      title: "Tanaman Segar",
      desc: "Setiap tanaman dipilih langsung dan dirawat dengan penuh perhatian dari kebun terbaik kami.",
    },
    {
      icon: <Truck className="h-8 w-8 text-sage" />,
      title: "Pengiriman Cepat",
      desc: "Layanan kirim cepat dan aman khusus untuk area Boyolali dan sekitarnya guna menjaga kesegaran tanaman.",
    },
    {
      icon: <Bot className="h-8 w-8 text-sage" />,
      title: "Plant Doctor AI",
      desc: "Diagnosis penyakit tanaman kesayangan Anda secara instan dan gratis menggunakan teknologi AI pintar kami.",
    },
  ];

  const testimonials = [
    {
      name: "Rina Wijayanti",
      role: "Pecinta Tanaman Hias",
      rating: 5,
      comment:
        "Bunga mawar potong yang saya pesan segar sekali dan wanginya tahan lama! Pelayanan ramah dan pengiriman super cepat.",
    },
    {
      name: "Budi Santoso",
      role: "Pemilik Rumah Hijau",
      rating: 5,
      comment:
        "Fitur AI Plant Doctor sangat membantu! Tanaman monstera saya yang layu terdiagnosis dengan cepat dan sekarang sudah subur kembali setelah beli obat di sini.",
    },
    {
      name: "Dewi Lestari",
      role: "Pelanggan Setia",
      rating: 5,
      comment:
        "Toko bunga terlengkap di Boyolali. Harganya sangat bersahabat dibanding kualitas premium tanaman yang didapat.",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sage to-dark-green py-24 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-cream-soft" />
              <span>Toko Bunga & Tanaman Pilihan Boyolali</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-cream-soft leading-tight">
              Temukan Keindahan Alam di Bakoel Kembang
            </h1>
            <p className="text-lg text-white/90 sm:text-xl leading-relaxed max-w-2xl">
              Toko bunga dan tanaman segar terlengkap di Boyolali. Dari tanaman hias estetis hingga bunga potong segar, kami hadir untuk memperindah setiap sudut rumah Anda.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link
                href="/katalog"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-base font-bold text-dark-green shadow-sm transition-all duration-200 hover:bg-cream-soft hover:scale-105 active:scale-95"
              >
                Lihat Katalog
              </Link>
              <Link
                href="/plant-doctor"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3.5 text-base font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95"
              >
                Coba Plant Doctor 🌿
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: KEUNGGULAN */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-extrabold text-dark-green sm:text-4xl">
              Mengapa Memilih Bakoel Kembang?
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Kami berkomitmen untuk memberikan kualitas produk tanaman terbaik dan layanan inovatif bagi kepuasan Anda.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {advantages.map((adv, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-8 rounded-2xl border border-cream-soft bg-cream-soft/30 hover:shadow-md transition-all duration-300"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm mb-6">
                  {adv.icon}
                </div>
                <h3 className="text-xl font-bold text-dark-green mb-3">{adv.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: TENTANG KAMI */}
      <section className="py-20 bg-cream-soft/40 border-y border-cream-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Teks Kiri */}
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-dark-green sm:text-4xl leading-tight">
                Dari Kebun Lokal Menuju Keindahan Rumah Anda
              </h2>
              <p className="text-gray-600 leading-relaxed">
                <strong>Bakoel Kembang Boyolali</strong> bermula dari kecintaan kami terhadap flora nusantara. Berlokasi di Mojosongo, Boyolali, kami adalah toko bunga lokal yang berdedikasi melayani dengan hati.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Kami menyediakan berbagai macam tanaman hias berkualitas, bunga potong segar untuk momen spesial, serta produk pelengkap seperti pupuk berkualitas dan pestisida. Kami juga bangga memperkenalkan teknologi AI Plant Doctor untuk membantu merawat tanaman Anda.
              </p>
              <div className="pt-2">
                <a
                  href="https://wa.me/6285725280724"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-dark-green font-bold hover:text-sage transition-colors group"
                >
                  Hubungi Tim Kami
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
            {/* Gambar Kanan */}
            <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden shadow-lg border border-cream-soft bg-gray-200 min-h-[300px]">
              <Image
                src="/images/about-store.png"
                alt="Bakoel Kembang Storefront"
                fill
                sizes="(max-w-1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: PRODUK UNGGULAN */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold text-dark-green sm:text-4xl">
                Koleksi Produk Terpopuler
              </h2>
              <p className="text-gray-500 leading-relaxed">
                Lihat pilihan produk bunga dan tanaman terbaik kami yang paling banyak diminati.
              </p>
            </div>
            <Link
              href="/katalog"
              className="inline-flex items-center gap-2 rounded-xl bg-sage px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#769768] transition-colors self-start sm:self-auto"
            >
              Lihat Semua Produk
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-cream-soft rounded-2xl bg-cream-soft/10">
              <p className="text-gray-500">Belum ada produk yang ditampilkan saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: CTA PLANT DOCTOR */}
      <section className="bg-dark-green py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 relative space-y-6">
          <h2 className="text-3xl font-extrabold sm:text-4xl text-cream-soft leading-tight">
            Tanaman Anda Terlihat Layu atau Sakit?
          </h2>
          <p className="text-lg text-white/90 leading-relaxed max-w-2xl mx-auto">
            Jangan biarkan tanaman kesayangan mati sia-sia. Deteksi gejala penyakit daun secara instan dengan mengambil foto dan mengunggahnya ke AI Plant Doctor kami gratis.
          </p>
          <div className="pt-4">
            <Link
              href="/plant-doctor"
              className="inline-flex items-center justify-center rounded-xl bg-sage px-8 py-4 text-base font-bold text-white shadow-md hover:bg-[#769768] transition-all hover:scale-105 active:scale-95"
            >
              Coba Diagnosis Gratis Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 6: TESTIMONI */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-dark-green sm:text-4xl">
              Ulasan Pelanggan Setia
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Dengarkan kepuasan mereka yang telah mempercayakan kebutuhan tanaman kepada kami.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testi, index) => (
              <div
                key={index}
                className="flex flex-col justify-between p-8 rounded-2xl border border-cream-soft bg-cream-soft/10 hover:shadow-sm transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Rating Bintang */}
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(testi.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed italic">
                    "{testi.comment}"
                  </p>
                </div>
                <div className="mt-6 pt-6 border-t border-cream-soft">
                  <h4 className="font-bold text-dark-green">{testi.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{testi.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: LOKASI */}
      <section className="py-20 bg-cream-soft/30 border-t border-cream-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Informasi Toko */}
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-dark-green sm:text-4xl leading-tight">
                Kunjungi Toko Kami
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Kami sangat senang menyambut Anda secara langsung. Datang dan pilih langsung berbagai varietas tanaman hias segar, bunga potong cantik, serta perlengkapan berkebun terlengkap di galeri kami.
              </p>
              
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-sage flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">
                    <strong>Alamat:</strong> Jl. Raya Mojosongo, Mojosongo, Kecamatan Mojosongo, Kabupaten Boyolali, Jawa Tengah 57322
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-sage flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">
                    <strong>WhatsApp:</strong> 0857-2528-0724
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-sage flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">
                    <strong>Jam Operasional:</strong> Senin–Sabtu, 08.00–17.00 WIB
                  </span>
                </div>
              </div>
              
              <div className="pt-4">
                <a
                  href="https://maps.google.com/?q=Mojosongo,+Boyolali,+Jawa+Tengah"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-sage px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors duration-200 hover:bg-[#769768]"
                >
                  Buka di Google Maps
                </a>
              </div>
            </div>

            {/* Google Maps Iframe */}
            <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-cream-soft bg-gray-200 h-[350px] relative">
              <iframe
                title="Peta Lokasi Bakoel Kembang Boyolali"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.126429532454!2d110.6080536!3d-7.5358055!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a6edb9dfd306b%3A0xc3c54d3d3a4b087c!2sMojosongo%2C%20Boyolali%20Regency%2C%20Central%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
