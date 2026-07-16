<div align="center">

# 🛒 POS Pintar

### Sistem Kasir & Manajemen Toko Berbasis Google Apps Script

Ringan, cepat, dan mobile-friendly — dibangun di atas Google Sheets sebagai database, tanpa biaya hosting.

![Status](https://img.shields.io/badge/status-aktif-brightgreen)
[![Demo](https://img.shields.io/badge/demo-lihat%20sekarang-blueviolet)](https://kasirpintar-bice.vercel.app/)
[![Platform](https://img.shields.io/badge/backend-Google%20Apps%20Script-4285F4)](https://www.google.com/script/start/)
[![Database](https://img.shields.io/badge/database-Google%20Sheets-0F9D58)](https://www.google.com/sheets/about/)
[![Hosting](https://img.shields.io/badge/hosting-Vercel-000000)](https://vercel.com/)
![Mobile](https://img.shields.io/badge/mobile--friendly-yes-orange)

</div>

---

## 🔗 Live Demo

Coba langsung aplikasinya tanpa perlu setup apapun:

**🌐 [kasirpintar-bice.vercel.app](https://kasirpintar-bice.vercel.app/)**

| Field | Nilai |
|---|---|
| Username | `demo` |
| Password | `demo2026` |

> ⚠️ Ini akun **demo publik** — data yang kamu masukkan bisa dilihat/diubah pengguna lain yang mencoba demo ini juga. Jangan gunakan data asli. Untuk pemakaian produksi, deploy versi sendiri mengikuti [langkah setup](#-cara-setup-dari-nol) di bawah dan ganti kredensial login.



---

## 📖 Tentang Proyek

**POS Pintar** adalah aplikasi kasir (Point of Sale) untuk toko kelontong/retail skala kecil-menengah. Dibangun sepenuhnya dengan **Google Apps Script**, memakai **Google Sheets** sebagai database — tanpa perlu server, tanpa biaya bulanan, dan bisa diakses dari mana saja lewat browser.

Aplikasi ini punya dua peran akses: **Admin** (kelola barang, dashboard, laporan) dan **Kasir** (transaksi harian saja), dengan tampilan yang dirancang mobile-first karena mayoritas penggunaan lewat HP.

---

## ✨ Fitur

### 🛍️ Kasir & Transaksi
- Katalog produk dengan foto, kategori bubble, dan pencarian real-time
- Sort produk: Terbaru / Terlama / A-Z / Z-A
- Keranjang belanja dengan validasi stok otomatis
- Multi metode pembayaran: **Tunai**, **Transfer Bank** (nomor rekening otomatis tampil), **QRIS** (gambar QR + total tagihan otomatis tampil)
- Cetak struk thermal langsung dari browser
- Void/batalkan transaksi (khusus Admin) — stok otomatis dikembalikan

### 📦 Manajemen Produk
- Foto produk (upload langsung ke Google Drive)
- Kelola Kategori & Kelola Satuan sebagai master data (bukan teks bebas lagi)
- Satuan Besar & Satuan Ecer dengan konversi stok (contoh: 1 Dus = 12 Pcs)
- Reminder stok minimum kustom per produk

### 🔐 Multi-Role & Keamanan
- Login berbasis token (Admin & Kasir terpisah aksesnya)
- Kasir hanya bisa akses Menu Kasir & Riwayat Transaksi (read-only)
- Semua aksi sensitif (tambah/edit/hapus barang, void transaksi) tervalidasi di server, bukan cuma di tampilan

### 📊 Dashboard & Laporan
- Omset & laba harian real-time
- Grafik omset dan laba bulanan (Chart.js)
- Peringatan stok menipis & stok habis
- Riwayat transaksi lengkap dengan status (Selesai/Dibatalkan)

### 🎨 Pengalaman Pengguna
- Toast notifikasi & modal konfirmasi custom (bukan `alert()`/`confirm()` bawaan browser)
- Desain mobile-first, tetap rapi di desktop
- Tema warna modern, konsisten di seluruh halaman

---

## 🏗️ Arsitektur

```
┌─────────────────┐      iframe       ┌──────────────────────┐      baca/tulis      ┌───────────────────┐
│   Vercel         │  ────────────▶   │  Google Apps Script   │  ─────────────────▶  │  Google Sheets     │
│  (index.html)     │                   │  (Web App .../exec)   │                       │  (Database)         │
│  Domain publik     │                   │  Code.gs + HTML       │                       │  Produk, Transaksi, │
│                     │                   │                        │                       │  Kategori, Satuan   │
└─────────────────┘                   └──────────────────────┘                       └───────────────────┘
```

**Kenapa dibungkus iframe di Vercel?** Supaya URL yang dilihat pengguna adalah domain kamu sendiri, bukan URL bawaan `script.google.com` — sekaligus menyembunyikan banner "Dibuat oleh pengguna Google Apps Script" yang otomatis muncul kalau `.../exec` dibuka langsung.

---

## 📂 Struktur Repository

```
ProjectMagang/POS/
├── index.html      # Entry point yang di-deploy Vercel (berisi <iframe> ke Apps Script)
├── vercel.json     # Konfigurasi header Vercel (opsional)
├── Beranda.html    # Backup kode — halaman utama Apps Script (setara Index.html di editor)
├── Style.html      # Backup kode — seluruh CSS aplikasi
├── Script.html     # Backup kode — seluruh JavaScript aplikasi
├── Code.gs         # Backup kode — seluruh backend/server-side (Apps Script)
└── README.md       # Dokumentasi ini
```

> ⚠️ File `Beranda.html`, `Style.html`, `Script.html`, dan `Code.gs` di repo ini **hanya backup/histori kode**. File yang benar-benar dijalankan tetap ada di dalam **Apps Script Editor** milik Google Sheets kamu — bukan dieksekusi dari GitHub/Vercel.

---

## 🚀 Cara Setup dari Nol

### 1. Siapkan Google Sheets (Database)

Buat 1 spreadsheet baru dengan 4 sheet berikut:

| Nama Sheet | Kolom (header baris 1) |
|---|---|
| **Produk** | `ID_Barang`, `Nama_Barang`, `Kategori`, `Harga_Modal`, `Harga_Jual`, `Stok`, `FotoURL`, `MinStok`, `SatuanBesar`, `SatuanEcer`, `Konversi` |
| **Transaksi** | `ID_Transaksi`, `Tanggal`, `Item_Terjual`, `Total_Harga`, `Total_Laba`, `Uang_Bayar`, `Uang_Kembali`, `Metode`, `Status` |
| **Kategori** | `ID_Kategori`, `Nama_Kategori` |
| **Satuan** | `ID_Satuan`, `Nama_Satuan`, `Tipe` |

### 2. Deploy Apps Script

1. Di spreadsheet tadi, buka **Ekstensi → Apps Script**
2. Buat file: `Code.gs`, `Index.html`, `Style.html`, `Script.html`
3. Copy-paste isi dari `Beranda.html` → `Index.html`, dan sisanya sesuai nama
4. Klik **Deploy → New deployment** → pilih tipe **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Salin URL `.../exec` yang muncul — ini dipakai di langkah berikutnya

### 3. Konfigurasi Awal di Kode

Di `Code.gs`, ganti akun login default:
```javascript
var AKUN_LOGIN = {
  "admin": { password: "GANTI_PASSWORD_ADMIN", role: "admin" },
  "kasir": { password: "GANTI_PASSWORD_KASIR", role: "kasir" }
};
```

Di `Script.html`, ganti data pembayaran:
```javascript
var QRIS_IMAGE_URL = "URL_GAMBAR_QRIS_TOKO_ANDA";
var BANK_NAMA = "Nama Bank Anda";
var BANK_NOREK = "Nomor Rekening Anda";
var BANK_ATASNAMA = "Nama Toko Anda";
```

### 4. Deploy Wrapper ke Vercel

1. Buat file `index.html` di root repo ini, isi:
   ```html
   <!DOCTYPE html>
   <html lang="id">
   <head>
     <meta charset="UTF-8">
     <title>POS Pintar</title>
     <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
     <style>
       * { margin: 0; padding: 0; box-sizing: border-box; }
       html, body { height: 100%; overflow: hidden; }
       iframe { width: 100%; height: 100dvh; border: none; display: block; }
     </style>
   </head>
   <body>
     <iframe src="GANTI_DENGAN_URL_EXEC_APPS_SCRIPT" allow="camera"></iframe>
   </body>
   </html>
   ```
2. Ganti `GANTI_DENGAN_URL_EXEC_APPS_SCRIPT` dengan URL dari langkah 2
3. Push ke GitHub → hubungkan repo ini ke [vercel.com](https://vercel.com) → **Deploy**
4. (Opsional) Pasang domain sendiri lewat **Project Settings → Domains**

### 5. Selesai 🎉

Buka domain Vercel kamu (atau domain custom) — aplikasi siap dipakai, login pakai akun yang sudah dikonfigurasi di langkah 3.

---

## 🗺️ Roadmap

Fitur yang direncanakan untuk pengembangan berikutnya:

- [ ] Manajemen supplier
- [ ] Cetak label harga/barcode massal
- [ ] Grafik perbandingan periode (minggu ini vs minggu lalu)
- [ ] Backup otomatis database ke Drive
- [ ] Log aktivitas admin

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Google Apps Script |
| Database | Google Sheets |
| Grafik | Chart.js |
| Penyimpanan Foto | Google Drive |
| Hosting Wrapper | Vercel |

---

<div align="center">

Dibangun dengan ketekunan untuk kebutuhan toko kelontong sehari-hari. 🏪

</div>
