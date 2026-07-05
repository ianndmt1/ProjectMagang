# DESIGN_BRIEF.md
Acuan visual untuk semua halaman di Tahap 4. Simpan di root project, referensikan di setiap prompt pembuatan UI supaya konsisten antar halaman.

## Konsep
Website ini terasa seperti **tiket servis / nota bengkel elektronik yang didigitalkan** — bukan template SaaS generik. Elemen visual diambil dari dunia nyata bengkel servis: nota dengan garis putus-putus sobekan, jalur PCB (papan sirkuit) sebagai motif garis alur proses, dan warna hijau PCB asli sebagai salah satu aksen (bukan kebetulan — warna itu memang warna motherboard sungguhan).

Hindari: hero dengan gradient besar, kartu serba rounded-corner generik, ikon stock generik berlebihan, warna pastel SaaS, layout yang bisa dipakai untuk bisnis apa saja tanpa berubah.

## Palet Warna
| Nama | Hex | Peran |
|---|---|---|
| Paper | `#EDEFE9` | Background utama, warna kertas nota sedikit kehijauan |
| Ink | `#1B2430` | Teks utama, header, elemen gelap |
| Solder Orange | `#E8720C` | Aksen utama, CTA, highlight harga |
| PCB Green | `#1F5C3D` | Aksen sekunder — status "selesai", badge garansi, jalur diagram alur servis |
| Warn Amber | `#C98A1A` | Status "menunggu sparepart" / perhatian |
| Muted Gray | `#6B6F63` | Teks sekunder, label, caption |

## Tipografi
- **Display/Heading**: `Space Grotesk` — karakter tegas, sedikit teknikal, dipakai untuk headline dan judul section
- **Body**: `Inter` — netral, sangat mudah dibaca untuk paragraf dan UI
- **Utility/Data**: `IBM Plex Mono` — dipakai KHUSUS untuk kode invoice, harga, spesifikasi part, nomor telepon. Ini yang bikin terasa seperti nota/struk asli, bukan dekorasi sembarangan.

Load dari Google Fonts.

## Motif Struktural (Signature Element)
1. **Garis putus-putus horizontal** ala sobekan nota, dipakai sebagai pembatas antar section (bukan garis solid biasa)
2. **Diagram alur servis sebagai jalur PCB**: 6 status servis (Diterima → Dicek → Menunggu Sparepart → Dikerjakan → Selesai → Sudah Diambil) digambar sebagai garis dengan belokan siku 90 derajat + titik node di tiap status, meniru jalur sirkuit di motherboard. Ini dipakai di landing page (cara kerja) dan di halaman cek status (progress tracker).
3. **Sudut crosshair kecil** (seperti titik solder/via PCB) di pojok kartu-kartu penting, bukan rounded-corner biasa untuk semua elemen.

## Layout per Halaman

### Landing Page
```
[Header: logo + nav + tombol WA]
[Hero: headline + CTA "Cek Status" & "Chat AI" + ilustrasi/foto workshop nyata bukan stock generik]
[Garis putus-putus]
[Kategori Layanan: 4 kartu - Laptop, PC, Sparepart, Upgrade]
[Garis putus-putus]
[Cara Kerja: diagram jalur PCB 6 status]
[Garis putus-putus]
[Testimoni: dari testimonialThemes di store-info.ts, gaya kutipan di "nota" kecil]
[Garis putus-putus]
[Lokasi & Jam: alamat, peta, jam operasional dari store-info.ts]
[Footer: kontak, jam, link cek status/sparepart]
[Chat widget: floating button pojok kanan bawah]
```

### Halaman Cek Status
Form input invoice bergaya "tempel struk", hasil ditampilkan sebagai tiket digital dengan progress diagram jalur PCB yang menyoroti status saat ini.

### Katalog Sparepart
Grid kartu produk, harga dalam font mono, badge "Tersedia"/"Habis".

## Responsif
- Mobile-first: breakpoint utama di 640px dan 1024px
- Chat widget di mobile: full-width bottom sheet saat dibuka, bukan popup kecil yang kepotong
- Navigasi mobile: hamburger menu, tombol WA tetap sticky terlihat di bawah layar
- Tabel admin (nanti di Tahap 4 bagian dashboard) di mobile berubah jadi card list, bukan tabel discroll horizontal

## Konten
Semua copy pakai data asli dari `lib/store-info.ts` (nama, alamat, jam, testimoni) — jangan pakai lorem ipsum atau placeholder generik seperti "Lorem Company" atau "123 Main Street".
