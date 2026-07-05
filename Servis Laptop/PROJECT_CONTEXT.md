# PRD — Website Servis Laptop, Komputer & Sparepart (BK Computer Solo)
Versi final, konsolidasi dari seluruh diskusi. Simpan file ini sebagai `PROJECT_CONTEXT.md` di root project dan jadikan acuan tunggal di setiap sesi Antigravity IDE.

**Status project:** Tahap 0 (persiapan akun) & Tahap 1 (database Supabase) sudah selesai. Siap masuk Tahap 2 (setup project Next.js).

---

## 1. Profil Bisnis

| Field | Nilai |
|---|---|
| Nama | BK Computer — Pusat Service Laptop Solo |
| Tagline | Service laptop, komputer & sparepart terpercaya, cepat, dan bergaransi |
| Alamat | Jl. K.H Samanhudi No.138, Sondakan, Kec. Laweyan, Kota Surakarta, Jawa Tengah 57147 |
| Koordinat | -7.5649413, 110.7944999 |
| Google Maps | https://maps.google.com/?cid=17320240362327567896 |
| Telepon/WA | +62 857-2542-0666 (aktif, dipakai untuk semua tombol WhatsApp) |
| Rating | 4.8 dari 483 ulasan Google |

### Jam Operasional Toko (final, versi Google Business)
| Hari | Jam |
|---|---|
| Senin–Jumat | 09.00–20.00 |
| Sabtu | 09.00–17.00 |
| Minggu | Tutup |

### Jam Homeservice
Senin–Jumat, 08.00–16.00 (hari kerja saja, terpisah dari jam toko).

### Cakupan Homeservice
Hanya Kecamatan Laweyan. Biaya tambahan Rp 10.000/km untuk jarak di luar radius 10km dari toko. Distance & biaya transport diisi manual oleh admin saat input order (bukan otomatis dihitung sistem).

### Testimoni (ringkasan tema, untuk landing page)
- Berhasil memperbaiki motherboard tanpa perlu ganti total, di kasus yang tempat lain hanya menawarkan penggantian penuh
- Pelayanan ramah, teknisi menjelaskan detail kerusakan dengan sabar, respons cepat
- Harga bersahabat, cocok untuk mahasiswa
- Terbuka soal kondisi sparepart sebelum servis dilakukan

---

## 2. Kategori Layanan
- Servis laptop
- Servis PC / komputer rakitan
- Jual sparepart (katalog saja, transaksi via WhatsApp — bukan e-commerce)
- Upgrade RAM/SSD

## 3. Model Harga
Kombinasi: setiap kategori punya harga dasar acuan (`base_price_estimate`), harga final ditentukan setelah teknisi mengecek langsung. Semua komunikasi harga (termasuk dari AI chat) wajib menyertakan disclaimer bahwa itu estimasi awal.

## 4. Alur Servis
- Input order **hanya oleh admin** (manual, saat customer datang/telepon) — tidak ada self-service booking dari customer.
- Status: `Diterima → Dicek → Menunggu Sparepart → Dikerjakan → Selesai → Sudah Diambil`
- Customer cek status pakai **kode invoice** (format: `SRV-YYYYMMDD-000X`)
- Saat servis selesai: admin klik tombol di dashboard → sistem generate link `wa.me` dengan pesan siap kirim ke nomor customer (bukan otomatis terkirim, admin yang klik kirim manual)

## 5. AI Chat
- Provider: Google Gemini API
- Kemampuan 1 — Diagnosa awal: customer jelaskan keluhan → AI kasih estimasi kemungkinan penyebab & saran, **tidak membuat tiket/booking**
- Kemampuan 2 — Cek antrian: customer masukkan nomor invoice → AI query status order (read-only) dan jawab dalam bahasa natural
- Kemampuan 3 — Homeservice: kalau customer tanya soal homeservice, AI kasih info jam & cakupan area, lalu arahkan ke tombol WhatsApp untuk penjadwalan (AI tidak membuat booking sendiri)
- Tombol "Hubungi via WhatsApp" selalu tersedia di chat, mengarah ke satu nomor admin: `6285725420666`
- Aturan mutlak: AI tidak pernah bisa UPDATE/DELETE data, tidak pernah kasih harga sebagai final, dan riwayat chat **tidak perlu** ditampilkan ke admin (cukup dipakai runtime saja)

## 6. Admin Panel
- Satu admin, satu level akses (tidak perlu role/permission bertingkat)
- Kelola order: lihat list, filter status, ubah status, isi harga final & catatan
- Laporan/rekap tersedia **sejak awal**: total order, total selesai, total pendapatan, total homeservice per bulan

## 7. Non-fungsional
- Bahasa: Indonesia saja
- Tidak ada login/register customer — semua interaksi guest, identifikasi lewat nomor invoice/HP
- WhatsApp: pakai `wa.me` link gratis, tidak pakai WhatsApp Business API berbayar (untuk fase ini)

---

## 8. Skema Database (SUDAH DIBUAT di Supabase — jangan digenerate ulang)

### `service_categories`
```
id uuid PK
name text
description text
base_price_estimate numeric
is_active boolean
created_at timestamptz
```

### `sparepart_catalog`
```
id uuid PK
name text
category text
price_note text
image_url text
is_available boolean
created_at timestamptz
```

### `service_orders`
```
id uuid PK
invoice_code text unique          -- format: SRV-YYYYMMDD-000X
customer_name text
customer_phone text                -- format 62xxxxxxxxxx
category_id uuid FK -> service_categories
device_info text
complaint text
service_type enum('toko','homeservice')
address text
distance_km numeric
transport_fee numeric
status enum('diterima','dicek','menunggu_sparepart','dikerjakan','selesai','sudah_diambil')
base_price_estimate numeric
final_price numeric
admin_notes text
created_at, updated_at, completed_at timestamptz
```

### `order_status_history`
```
id uuid PK
order_id uuid FK -> service_orders
status enum (sama seperti di atas)
note text
changed_at timestamptz
```
Terisi otomatis lewat trigger `trg_log_status_change`. Jangan insert manual dari kode aplikasi.

### View `report_monthly`
Kolom: `bulan, total_order, total_selesai, total_pendapatan, total_homeservice`. Read-only, dipakai halaman laporan admin.

### RLS
Semua tabel `enable row level security`, **tanpa policy** untuk anon/authenticated — akses hanya lewat `service_role key` di server (API routes).

### Admin Auth
Pakai Supabase Auth bawaan, 1 user sudah dibuat lewat dashboard. Tidak ada tabel `admins` custom.

---

## 9. API Endpoint

| Endpoint | Method | Akses | Fungsi |
|---|---|---|---|
| `/api/categories` | GET | Publik | List kategori servis |
| `/api/sparepart` | GET | Publik | List katalog sparepart |
| `/api/orders/track` | GET `?invoice=` | Publik | Cek status servis |
| `/api/chat` | POST | Publik | AI diagnosa + cek antrian (Gemini function calling) |
| `/api/admin/orders` | GET, POST | Admin | List/filter order, buat order baru |
| `/api/admin/orders/[id]` | PATCH | Admin | Update status/harga/catatan |
| `/api/admin/orders/[id]/wa-link` | GET | Admin | Generate link wa.me siap kirim |
| `/api/admin/reports` | GET | Admin | Data dari view `report_monthly` |

Login admin pakai Supabase Auth langsung dari client, tidak perlu endpoint custom.

Setiap endpoint `/api/admin/*` wajib cek session sebelum proses apapun (401 kalau invalid).

---

## 10. Struktur Folder

```
app/
  page.tsx                          # Landing page
  cek-status/page.tsx
  sparepart/page.tsx
  admin/
    layout.tsx
    login/page.tsx
    page.tsx
    orders/[id]/page.tsx
    reports/page.tsx
  api/
    categories/route.ts
    sparepart/route.ts
    orders/track/route.ts
    chat/route.ts
    admin/
      orders/route.ts
      orders/[id]/route.ts
      orders/[id]/wa-link/route.ts
      reports/route.ts
components/
  landing/
  chat-widget/
  admin/
  ui/
lib/
  supabase/server.ts
  supabase/client.ts
  gemini.ts
  wa.ts
  invoice.ts
  store-info.ts                     # sudah dibuat, berisi data toko di atas
middleware.ts
```

---

## 11. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
ADMIN_WHATSAPP_NUMBER=6285725420666
```

---

## 12. Aturan Keamanan (TIDAK BOLEH DILANGGAR)

1. Semua akses ke tabel Supabase wajib lewat API route Next.js, tidak pernah query langsung dari client component.
2. `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server, tidak boleh prefix `NEXT_PUBLIC_`, tidak boleh sampai ke client bundle.
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` hanya untuk login admin di client, bukan untuk query data.
4. Setiap endpoint `/api/admin/*` wajib validasi session di awal function.
5. Tool AI chat hanya boleh SELECT (read-only), tidak boleh INSERT/UPDATE/DELETE.
6. AI chat selalu sertakan disclaimer estimasi harga, tidak pernah kasih harga final.

## 13. Batasan Fitur (di luar MVP, jangan dikerjakan kecuali diminta eksplisit)
- E-commerce sparepart penuh (checkout, payment gateway, stok otomatis)
- WhatsApp Business API otomatis
- Multi-admin dengan role berbeda
- Login/register customer
- AI analisa dari foto kerusakan

## 14. Tech Stack
Next.js 14+ App Router + TypeScript, Tailwind CSS, Supabase (Postgres + Auth), Google Gemini API (`@google/generative-ai`), `wa.me` link, deploy Vercel, IDE Antigravity.

---

## 15. Urutan Pengerjaan

| Tahap | Isi | Status |
|---|---|---|
| 0 | Persiapan akun (Supabase, Vercel, GitHub, Gemini API key) | Selesai |
| 1 | Backend — skema database, RLS, data dummy | Selesai |
| 2 | Setup project Next.js, koneksi Supabase | Selanjutnya |
| 3 | Endpoint API (satu per satu, tes tiap endpoint) | Belum |
| 4 | UI template (data dummy dulu) | Belum |
| 5 | Frontend logic (hubungkan ke API) | Belum |
| 6 | Integrasi AI, WhatsApp, testing, deploy Vercel | Belum |

## 16. Cara Kerja yang Diharapkan dari AI di Antigravity
- Kerjakan satu tahap/task pada satu waktu, jangan sekaligus bikin semua endpoint + UI + logic dalam satu prompt besar.
- Setelah selesai satu bagian, tawarkan untuk dites dulu sebelum lanjut ke bagian berikutnya.
- Kalau ada keputusan yang belum jelas dari dokumen ini, tanya dulu, jangan asumsi sendiri.
- Ikuti struktur folder di atas, jangan reorganisasi tanpa alasan.
