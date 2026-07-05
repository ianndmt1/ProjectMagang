Baca DESIGN_BRIEF.md (versi terbaru) dan PROJECT_CONTEXT.md di root project sebagai acuan.

Bangun ulang landing page (app/page.tsx) dengan gaya sesuai DESIGN_BRIEF.md:

1. Header: logo "BK Computer" (icon mark gradient teal-biru + teks), menu navigasi: Beranda, Layanan, Cek Service, Sparepart, Cara Service, Kontak, dan tombol Login (mengarah ke /admin/login, gaya outline agar beda dari CTA utama). Header sticky, hamburger menu di mobile.

2. Hero section: badge pill kecil, headline besar dengan kata kunci di-highlight gradient teks, sub-headline pakai value proposition asli BK Computer (bergaransi, cepat, rating 4.8 dari 483 ulasan, homeservice area Laweyan) dari store-info.ts. Dua tombol CTA: "Cek Status Service" (ke /cek-status) dan "Chat AI Sekarang" (scroll ke chat widget / buka panelnya). Ilustrasi laptop + 2 kartu ikon mengambang di sisi kanan, dibuat sebagai SVG asli (bukan gambar stock), plus badge kecil "4.8 ★" mengambang.

3. Section Kategori Layanan: 4 kartu — Servis Laptop, Servis PC, Sparepart, Upgrade RAM/SSD.

4. Section Cara Service: diagram 6 status alur servis dari PROJECT_CONTEXT.md (Diterima → Dicek → Menunggu Sparepart → Dikerjakan → Selesai → Sudah Diambil), tiap status warna beda, terhubung garis.

5. Section Testimoni: judul "Dipercaya 483+ Pelanggan di Google (4.8★)", 4 kartu dari testimonialThemes di store-info.ts, tombol "Lihat semua ulasan di Google Maps" mengarah ke googleMapsUrl.

6. Section Lokasi & Jam: alamat, jam operasional (versi final: Senin-Jumat 09.00-20.00, Sabtu 09.00-17.00, Minggu tutup), dari store-info.ts.

7. Footer: kontak, jam singkat, link cepat ke halaman lain.

8. Floating chat widget di pojok kanan bawah (belum perlu terhubung ke API Gemini, cukup UI-nya dulu dengan dummy response):
   - Button bulat gradient teal-biru dengan ikon chat
   - Saat diklik, buka panel chat (desktop: mengambang ~380x520px; mobile: bottom sheet full-width)
   - Pesan pembuka: "Halo! Ceritakan kerusakan laptop/PC kamu, nanti saya bantu perkirakan penyebabnya. Atau ketik nomor invoice untuk cek status servis."
   - Ada tombol "Hubungi via WhatsApp" di dalam panel, mengarah ke wa.me dengan nomor dari store-info.ts

Pakai data dari lib/store-info.ts untuk semua konten (alamat, jam, testimoni, WA), jangan ada teks placeholder generik. Pastikan responsif penuh di mobile dan desktop.

Chat AI belum perlu terhubung ke Gemini API sungguhan di langkah ini — itu dikerjakan di Tahap 6. Fokus dulu ke tampilan dan UX-nya.