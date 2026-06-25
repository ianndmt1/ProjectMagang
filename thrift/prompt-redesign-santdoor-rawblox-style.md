PERAN
Kamu adalah senior frontend engineer & e-commerce UX specialist yang melakukan
redesign pass pada proyek SANTDOOR.2ND yang sudah berjalan (Next.js + Tailwind).
Ini adalah pivot arah visual, BUKAN proyek baru — pertahankan struktur folder,
data model, dan brand name yang sudah ada.

KONTEKS PERUBAHAN ARAH VISUAL
2 screenshot terlampir (referensi brand "RAWBLOX") adalah acuan gaya BARU yang
diinginkan: latar terang/putih, fotografi produk besar full-bleed, tipografi
bold sans-serif hitam, badge minimalis, layout editorial streetwear. Ini
menggantikan tema dark-dominan sebelumnya — TAPI token warna brand (rust,
olive, mustard) dan font (Oswald/Work Sans/Space Mono) yang sudah ditetapkan
TETAP DIPAKAI sebagai aksen, supaya brand tetap konsisten, bukan ganti
identitas total.

═══════════════════════════════════════
DESIGN SYSTEM — REVISI
═══════════════════════════════════════
| Token | Hex | Penggunaan |
|---|---|---|
| bg-base (BARU, jadi default) | #F7F5F1 | Latar utama, ganti dari dark |
| text-primary | #15151A | Teks utama di atas bg terang |
| panel-alt | #EDE8DD | Section pembeda/alternating |
| rust | #C1502E | CTA utama, badge, harga |
| olive | #5C6B47 | Aksen sekunder |
| mustard | #D9A441 | Highlight kecil, eyebrow text |
| dark-spotlight | #15151A | KHUSUS untuk 1 section "produk unggulan" |
| paper | #EDE8DD | Teks di atas elemen solid gelap |

Mode gelap (dark mode toggle yang sudah dibuat sebelumnya via next-themes)
TETAP DIPERTAHANKAN sebagai opsi pengguna — tapi defaultTheme sekarang "light",
bukan "dark" lagi, karena arah visual baru ini terang-dominan.

Font tetap: Oswald (display/judul besar bold), Work Sans (body), Space Mono
(harga, kode LOT). Komponen signature GradeStamp dan LOT N°___ TETAP DIPAKAI,
tinggal disesuaikan warnanya agar kontras baik di latar terang (mis. border
solid bukan dashed, warna rust/olive di atas putih).

═══════════════════════════════════════
BAGIAN 1 — REDESIGN STOREFRONT (mengikuti struktur referensi)
═══════════════════════════════════════

TASK A — Top utility bar & header
- Bar tipis di atas: ikon sosial (Instagram, WhatsApp) kiri, link kanan:
  "Cara Beli", "FAQ", "Rekber", "Bantuan"
- Header: wordmark SANTDOOR.2ND kiri (bold, Oswald), nav tengah/kanan:
  Katalog, Brand (dropdown: The North Face, Napapijri, Patagonia, dst),
  Semua Produk, Tentang Kami, Kontak — tombol "Tanya AI" menggantikan ikon
  keranjang (karena order langsung via WhatsApp, bukan cart multi-item)

TASK B — Hero (mirip layout referensi image 2)
- Foto model/produk full-bleed di sisi kanan atau sebagai background
- Headline besar bold: "JAKET SECOND. BUKAN SECOND-RATE." + subteks singkat
  soal kurasi kondisi & 1 stok per item
- Tombol CTA pill putih dengan ikon panah "Belanja Sekarang" + tombol
  sekunder outline "Tanya AI Cariin Jaket"
- Indikator slide 01-05 di bagian bawah hero, isinya kategori: Outdoor,
  Casual, Windbreaker, Bundling, Promo Minggu Ini

TASK C — Section "Baru Masuk" (New Drops)
- Grid 3 kolom produk, tiap card: foto full-bleed, badge hitam pill
  "BARU MASUK" pojok kiri atas, nama produk bold, 1 baris deskripsi singkat
- Harga: tampilkan harga ritel ASLI brand (dicoret/strikethrough) di sebelah
  harga jual thrift sekarang — ini elemen JUJUR dan relevan (bukan diskon
  palsu), menunjukkan value asli barang second ke pembeli
- Badge grade kondisi tetap muncul di pojok foto (versi terang dari GradeStamp)

TASK D — Section "Kategori Pilihan" (gaya Featured Drops di referensi)
- Grid kecil dengan navigasi panah kiri-kanan (carousel)
- Isi: kategori produk (Anorak, Windbreaker, Fleece, Full-Zip) bukan
  aksesoris generik, karena toko fokus jaket saja

TASK E — Dark spotlight section (gaya "Nightfall Hoodie" di referensi)
- SATU-SATUNYA section dengan bg dark-spotlight (#15151A) di seluruh halaman
- Highlight "Produk Pilihan Minggu Ini": foto besar kanan, headline + deskripsi
  + harga + GradeStamp + CTA "Pesan via WhatsApp" kiri, thumbnail galeri
  foto multi-angle di bawah foto utama

TASK F — Banner CTA full-bleed
- Background gradient rust→olive (BUKAN merah generik dari referensi,
  tetap dalam palet brand), headline ajakan, foto model, tombol CTA

TASK G — Section "Kenapa Belanja di Sini"
- 4 kolom ikon + teks singkat: Rekber Tersedia, Kirim dari Klaten,
  Harga Jujur, Kondisi Diinspeksi — gaya sama seperti "Why shop with us"
  di referensi tapi isinya relevan ke thrift jaket

═══════════════════════════════════════
BAGIAN 2 — AI ASSISTANT (storefront, UI saja dulu)
═══════════════════════════════════════
- Floating button "Tanya AI" pojok kanan bawah, reskin ke gaya terang
  (bubble chat rust untuk balasan AI, bubble abu muda untuk pesan pembeli)
- AI fokus jawab seputar jaket: ketersediaan, ukuran, harga, kondisi, brand
- Tampilkan kartu produk mini di dalam bubble chat saat AI menemukan hasil
  yang cocok

═══════════════════════════════════════
BAGIAN 3 — REDESIGN ADMIN (samakan design system dengan storefront)
═══════════════════════════════════════
TASK H — Terapkan ulang UI admin dengan token bg-base terang sebagai default
(dark mode tetap tersedia via toggle), pakai komponen Button/Badge/Card yang
sama persis dengan storefront — JANGAN biarkan admin terasa proyek terpisah.

TASK I — Tambahkan fitur share untuk admin
- Tombol "Bagikan ke Sosial Media" di tiap baris produk pada tabel inventory
- Saat diklik: generate caption promosi otomatis dari data produk
  (contoh: "BARU MASUK [emoji jaket] Anorak The North Face size L, kondisi
  90%, Rp350.000. Order: link produk. #santdoor2nd #thriftjaket") dan salin
  ke clipboard, atau trigger Web Share API kalau browser mendukung

═══════════════════════════════════════
BAGIAN 4 — FITUR SHARE UNTUK PEMBELI
═══════════════════════════════════════
- Tombol ikon "Bagikan" di tiap product card dan halaman detail produk
- Pakai Web Share API (navigator.share) sebagai cara utama di perangkat yang
  mendukung (otomatis buka share sheet native)
- Fallback untuk browser yang tidak mendukung: dropdown menu manual dengan
  opsi WhatsApp, Instagram (salin tautan + caption), X/Twitter, dan
  "Salin Tautan"

═══════════════════════════════════════
BAGIAN 5 — AUDIT BAHASA INDONESIA (WAJIB, MENYELURUH)
═══════════════════════════════════════
Telusuri SEMUA halaman dan komponen (storefront + admin), ganti SEMUA teks
UI berbahasa Inggris yang masih tersisa ke Bahasa Indonesia, termasuk:
- Status produk: "AVAILABLE" -> "Tersedia", "SOLD" -> "Terjual",
  "SOLD OUT" -> "Habis Terjual"
- Tombol aksi: "MARK SOLD" -> "Tandai Terjual", "RESTOCK" -> "Stok Ulang"
- Label sidebar/nav admin, placeholder input, pesan error/empty state,
  semua harus Bahasa Indonesia
- Hanya istilah teknis yang memang lazim dipakai apa adanya boleh tetap
  (mis. "LOT", nama brand)

═══════════════════════════════════════
ANTI-PATTERN
═══════════════════════════════════════
- Jangan hapus identitas brand (token rust/olive/mustard, font Oswald/Work
  Sans/Space Mono, sistem LOT & GradeStamp) — yang berubah adalah dominasi
  warna latar, bukan identitas brand
- Jangan biarkan admin punya gaya visual berbeda dari storefront
- Jangan tinggalkan teks Inggris yang lolos audit

DEFINITION OF DONE
- Latar default seluruh storefront terang (#F7F5F1), hanya 1 section
  "produk unggulan" yang gelap
- Admin pakai design system identik dengan storefront
- Fitur share berfungsi di storefront (produk) dan admin (promosi produk)
- AI assistant UI tampil di storefront, reskin sesuai tema terang
- Tidak ada lagi teks berbahasa Inggris di UI manapun
- Lolos uji responsive di 375px, 768px, dan 1280px
