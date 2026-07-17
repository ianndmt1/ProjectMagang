// =========================================================
// KONFIGURASI AKUN LOGIN
// Password TIDAK disimpan sebagai teks biasa lagi — yang disimpan cuma
// hash SHA-256-nya. Kalau mau ganti/tambah password, jalankan fungsi
// "buatHashPassword" secara manual dari editor Apps Script (isi dulu
// variabel PASSWORD_UNTUK_DIHASH di bawahnya), lalu salin hasil hash
// yang muncul di Log ke sini.
// =========================================================
var AKUN_LOGIN = {
  "kasir": { passwordHash: "f02b7c1e519e4fa436147f7e1399974f9510aa9c8e0cb8be29151eb540f9d214", role: "kasir" }, // kasir123
  "demo": { passwordHash: "43c27b4e263fa191a6a7ec198cd4d5b47d17413c49d77dc533a01720707e3202", role: "admin" }  // demo2026
};

function hashPassword(teks) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, teks, Utilities.Charset.UTF_8);
  return digest.map(function(b) {
    var v = (b < 0) ? b + 256 : b;
    var hex = v.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Jalankan fungsi ini manual dari editor Apps Script untuk membuat hash
// password baru. Ganti isi PASSWORD_UNTUK_DIHASH, klik Run, lalu buka
// menu Executions/Log untuk lihat hasilnya, dan salin ke AKUN_LOGIN di atas.
function buatHashPassword() {
  var PASSWORD_UNTUK_DIHASH = "GANTI_DENGAN_PASSWORD_BARU";
  Logger.log("Hash untuk '" + PASSWORD_UNTUK_DIHASH + "' -> " + hashPassword(PASSWORD_UNTUK_DIHASH));
}

// --- FUNGSI UTAMA WEB ---
function doGet() {
  return HtmlService
    .createTemplateFromFile('Beranda')
    .evaluate()
    .setTitle('Sistem Kasir Pintar')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =========================================================
// FUNGSI LOGIN & OTORISASI
// =========================================================
function cekLogin(username, password) {
  var akun = AKUN_LOGIN[username];
  if (akun && hashPassword(password) === akun.passwordHash) {
    var token = Utilities.getUuid();
    var cache = CacheService.getScriptCache();
    cache.put(token, akun.role, 21600); // berlaku 6 jam
    return { sukses: true, role: akun.role, token: token, username: username };
  }
  return { sukses: false, pesan: "Username atau password salah!" };
}

function cekTokenValid(token) {
  if (!token) return null;
  var cache = CacheService.getScriptCache();
  return cache.get(token); // "admin" / "kasir" / null
}

function cekTokenAdmin(token) {
  return cekTokenValid(token) === "admin";
}

function logout(token) {
  var cache = CacheService.getScriptCache();
  cache.remove(token);
  return true;
}

// =========================================================
// FUNGSI RESET DATA AWAL
// Jalankan fungsi ini SATU KALI secara manual dari editor Apps Script
// (pilih "resetDataAwal" di dropdown fungsi, lalu klik Run) untuk
// mengosongkan seluruh data Produk & Transaksi sebelum memakai skema
// ID barang/transaksi yang baru.
// =========================================================
function resetDataAwal() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetProduk = ss.getSheetByName("Produk");
  var sheetTransaksi = ss.getSheetByName("Transaksi");
  var sheetKategoriKode = ss.getSheetByName("KategoriKode");

  if (sheetProduk && sheetProduk.getLastRow() > 1) {
    sheetProduk.getRange(2, 1, sheetProduk.getLastRow() - 1, sheetProduk.getLastColumn()).clearContent();
  }
  if (sheetTransaksi && sheetTransaksi.getLastRow() > 1) {
    sheetTransaksi.getRange(2, 1, sheetTransaksi.getLastRow() - 1, sheetTransaksi.getLastColumn()).clearContent();
  }
  // Reset juga peta kode kategori supaya penomoran ID barang mulai bersih dari awal
  if (sheetKategoriKode) {
    ss.deleteSheet(sheetKategoriKode);
  }

  return "Semua data Produk, Transaksi, dan peta kode kategori berhasil direset.";
}

// =========================================================
// FUNGSI KODE KATEGORI (untuk ID Barang otomatis per kategori)
// Format ID: [KODE KATEGORI]-[4 digit urutan], contoh: M-0001
// Jika ada 2 kategori berhuruf depan sama (mis. Minuman & Minyak),
// keduanya otomatis dibedakan jadi 2 huruf (depan+belakang): MN & MK
// =========================================================
function pastikanSheetKategoriKode(ss) {
  var sheet = ss.getSheetByName("KategoriKode");
  if (!sheet) {
    sheet = ss.insertSheet("KategoriKode");
    sheet.appendRow(["Kategori", "Kode", "UrutanTerakhir"]);
    sheet.hideSheet();
  }
  return sheet;
}

function dapatkanKodeDanUrutanKategori(ss, namaKategori) {
  namaKategori = (namaKategori || "").trim();
  var sheet = pastikanSheetKategoriKode(ss);
  var data = sheet.getDataRange().getValues();

  // 1) Kategori sudah pernah dipakai -> pakai kode yang sama, naikkan urutannya
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === namaKategori.toLowerCase()) {
      var urutanBaru = (Number(data[i][2]) || 0) + 1;
      sheet.getRange(i + 1, 3).setValue(urutanBaru);
      return { kode: data[i][1], urutan: urutanBaru };
    }
  }

  // 2) Kategori baru -> tentukan kode barunya
  var hurufBersih = namaKategori.replace(/[^a-zA-Z]/g, '');
  if (!hurufBersih) hurufBersih = "X";
  var kodeSatuHuruf = hurufBersih.charAt(0).toUpperCase();

  var barisTabrakan = -1;
  for (var j = 1; j < data.length; j++) {
    if (String(data[j][1]).trim().toUpperCase() === kodeSatuHuruf) {
      barisTabrakan = j;
      break;
    }
  }

  var kodeFinal;
  if (barisTabrakan === -1) {
    // Tidak ada tabrakan huruf depan, aman pakai 1 huruf
    kodeFinal = kodeSatuHuruf;
  } else {
    // Tabrakan huruf depan dengan kategori lain (mis. Minuman vs Minyak)
    // -> ubah kode kategori LAMA jadi huruf depan+belakang
    var kategoriLama = String(data[barisTabrakan][0]).trim();
    var hurufLama = kategoriLama.replace(/[^a-zA-Z]/g, '') || "X";
    var kodeDuaHurufLama = (hurufLama.charAt(0) + hurufLama.charAt(hurufLama.length - 1)).toUpperCase();
    sheet.getRange(barisTabrakan + 1, 2).setValue(kodeDuaHurufLama);

    // Kategori BARU ini juga pakai huruf depan+belakang
    var kodeDuaHurufBaru = (hurufBersih.charAt(0) + hurufBersih.charAt(hurufBersih.length - 1)).toUpperCase();

    // Jaga-jaga: kalau kode 2 huruf ini kebetulan sudah dipakai kategori lain juga,
    // tambahkan angka di belakang supaya tetap unik
    var counter = 2;
    var masihTabrakan = true;
    while (masihTabrakan) {
      masihTabrakan = false;
      for (var k = 1; k < data.length; k++) {
        if (k === barisTabrakan) continue;
        if (String(data[k][1]).trim().toUpperCase() === kodeDuaHurufBaru) {
          kodeDuaHurufBaru = kodeDuaHurufBaru.replace(/\d+$/, '') + counter;
          counter++;
          masihTabrakan = true;
        }
      }
    }
    kodeFinal = kodeDuaHurufBaru;
  }

  sheet.appendRow([namaKategori, kodeFinal, 1]);
  return { kode: kodeFinal, urutan: 1 };
}

// =========================================================
// FUNGSI ID TRANSAKSI (reset otomatis tiap ganti bulan)
// Format: TRX + DD + MM + YY + 4 digit urutan, contoh: TRX1107260001
// Urutan berlanjut sepanjang bulan yang sama, dan kembali ke 0001
// begitu tanggal masuk ke bulan berikutnya.
// =========================================================
// =========================================================
// FUNGSI UPLOAD FOTO PRODUK KE GOOGLE DRIVE
// PENTING: Ganti nilai ID_FOLDER_FOTO_PRODUK di bawah dengan ID folder
// Drive tempat menyimpan foto produk. Cara mendapatkan ID folder:
// buka folder-nya di Google Drive lewat browser, ID ada di URL
// setelah "/folders/", contoh:
// https://drive.google.com/drive/folders/INI_ID_FOLDERNYA
// Kalau dibiarkan kosong/salah, foto akan otomatis disimpan di folder
// utama (My Drive) akun yang menjalankan script ini.
// =========================================================
var ID_FOLDER_FOTO_PRODUK = "GANTI_DENGAN_ID_FOLDER_DRIVE_ANDA";

function unggahFotoProduk(base64Data, mimeType, namaFile) {
  var folder;
  try {
    folder = DriveApp.getFolderById(ID_FOLDER_FOTO_PRODUK);
  } catch (e) {
    folder = DriveApp.getRootFolder();
  }

  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType, namaFile);
  var file = folder.createFile(blob);

  // Coba atur sharing publik secara eksplisit. Kalau folder induknya sudah
  // di-share "Anyone with link", file baru biasanya OTOMATIS mewarisi setting
  // itu — jadi baris ini sifatnya jaga-jaga saja. Dibungkus try-catch supaya
  // kalau baris ini gagal (mis. scope izin belum mencakup ubah sharing),
  // upload foto tetap dianggap BERHASIL, tidak menggagalkan simpan produk.
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (errSharing) {
    Logger.log("PERINGATAN unggahFotoProduk: gagal set sharing eksplisit (" + errSharing.message + "). Lanjut pakai warisan sharing folder induk.");
  }

  return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
}

// =========================================================
// TES UPLOAD FOTO MANUAL — jalankan SATU KALI dari editor Apps Script
// (pilih fungsi "tesUploadFotoManual" di dropdown, lalu klik Run).
// Fungsi ini menguji PERSIS jalur kode yang sama dengan unggahFotoProduk
// asli (termasuk setSharing), supaya hasil tesnya benar-benar mewakili.
// Setelah berhasil, hapus file "tes-izin-drive.txt" dari Drive secara manual.
// =========================================================
function tesUploadFotoManual() {
  var teksUji = "Ini file uji coba dari POS Pintar - aman dihapus.";
  var blob = Utilities.newBlob(teksUji, "text/plain", "tes-izin-drive.txt");

  var folder;
  try {
    folder = DriveApp.getFolderById(ID_FOLDER_FOTO_PRODUK);
    Logger.log("OK: Folder foto produk ditemukan -> " + folder.getName());
  } catch (e) {
    Logger.log("PERINGATAN: ID_FOLDER_FOTO_PRODUK salah/tidak bisa diakses (" + e.message + "). Fallback ke folder utama (My Drive).");
    folder = DriveApp.getRootFolder();
  }

  var file = folder.createFile(blob);
  Logger.log("OK: File berhasil dibuat -> " + file.getUrl());

  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    Logger.log("OK: setSharing berhasil.");
  } catch (errSharing) {
    Logger.log("PERINGATAN: setSharing GAGAL (" + errSharing.message + ") - tapi ini tidak masalah selama folder induknya sudah public.");
  }

  Logger.log("SELESAI. Link file uji: " + file.getUrl());
  return "Berhasil! Cek Log eksekusi untuk detail lengkap, lalu hapus file 'tes-izin-drive.txt' dari Drive.";
}

// =========================================================
// FUNGSI KATEGORI (MASTER DATA)
// Sheet "Kategori" — header: ID_Kategori | Nama_Kategori
// =========================================================
function getDataKategori() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Kategori");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  data.shift();
  return data; // [[id, nama], ...]
}

function tambahKategori(nama, token) {
  if (!cekTokenAdmin(token)) return "Error: Akses ditolak. Hanya Admin yang bisa mengelola kategori.";
  nama = (nama || "").trim();
  if (!nama) return "Error: Nama kategori tidak boleh kosong.";

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Kategori");
  if (!sheet) return "Error: Sheet 'Kategori' tidak ditemukan.";

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === nama.toLowerCase()) {
      return "Error: Kategori '" + nama + "' sudah ada.";
    }
  }

  var idBaru = "KTG-" + ("0000" + sheet.getLastRow()).slice(-4);
  sheet.appendRow([idBaru, nama]);
  return "Kategori berhasil ditambahkan.";
}

function updateKategori(id, namaBaru, token) {
  if (!cekTokenAdmin(token)) return "Error: Akses ditolak.";
  namaBaru = (namaBaru || "").trim();
  if (!namaBaru) return "Error: Nama kategori tidak boleh kosong.";

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Kategori");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      var namaLama = data[i][1];
      sheet.getRange(i + 1, 2).setValue(namaBaru);

      // Ikut perbarui nama kategori di semua produk yang memakainya
      if (String(namaLama).trim() !== namaBaru) {
        var sheetProduk = ss.getSheetByName("Produk");
        var dataProduk = sheetProduk.getDataRange().getValues();
        for (var j = 1; j < dataProduk.length; j++) {
          if (String(dataProduk[j][2]).trim() === String(namaLama).trim()) {
            sheetProduk.getRange(j + 1, 3).setValue(namaBaru);
          }
        }
      }
      return "Kategori berhasil diperbarui.";
    }
  }
  return "Error: Kategori tidak ditemukan.";
}

function hapusKategori(id, token) {
  if (!cekTokenAdmin(token)) return "Error: Akses ditolak.";

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Kategori");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      var nama = data[i][1];

      var sheetProduk = ss.getSheetByName("Produk");
      var dataProduk = sheetProduk.getDataRange().getValues();
      var dipakai = 0;
      for (var j = 1; j < dataProduk.length; j++) {
        if (String(dataProduk[j][2]).trim() === String(nama).trim()) dipakai++;
      }
      if (dipakai > 0) {
        return "Error: Kategori '" + nama + "' masih dipakai oleh " + dipakai + " produk. Ubah kategori produk tersebut dulu sebelum menghapus.";
      }

      sheet.deleteRow(i + 1);
      return "Kategori berhasil dihapus.";
    }
  }
  return "Error: Kategori tidak ditemukan.";
}

// =========================================================
// FUNGSI SATUAN (MASTER DATA) - grup Besar & Ecer
// Sheet "Satuan" — header: ID_Satuan | Nama_Satuan | Tipe
// =========================================================
function getDataSatuan() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Satuan");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  data.shift();
  return data; // [[id, nama, tipe], ...]
}

function tambahSatuan(nama, tipe, token) {
  if (!cekTokenAdmin(token)) return "Error: Akses ditolak.";
  nama = (nama || "").trim();
  tipe = (tipe || "").trim();
  if (!nama) return "Error: Nama satuan tidak boleh kosong.";
  if (tipe !== "Besar" && tipe !== "Ecer") return "Error: Tipe satuan harus 'Besar' atau 'Ecer'.";

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Satuan");
  if (!sheet) return "Error: Sheet 'Satuan' tidak ditemukan.";

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === nama.toLowerCase()) {
      return "Error: Satuan '" + nama + "' sudah ada.";
    }
  }

  var idBaru = "STN-" + ("0000" + sheet.getLastRow()).slice(-4);
  sheet.appendRow([idBaru, nama, tipe]);
  return "Satuan berhasil ditambahkan.";
}

function updateSatuan(id, namaBaru, tipeBaru, token) {
  if (!cekTokenAdmin(token)) return "Error: Akses ditolak.";
  namaBaru = (namaBaru || "").trim();
  if (!namaBaru) return "Error: Nama satuan tidak boleh kosong.";
  if (tipeBaru !== "Besar" && tipeBaru !== "Ecer") return "Error: Tipe satuan tidak valid.";

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Satuan");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.getRange(i + 1, 2, 1, 2).setValues([[namaBaru, tipeBaru]]);
      return "Satuan berhasil diperbarui.";
    }
  }
  return "Error: Satuan tidak ditemukan.";
}

function hapusSatuan(id, token) {
  if (!cekTokenAdmin(token)) return "Error: Akses ditolak.";

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Satuan");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      var nama = data[i][1];

      var sheetProduk = ss.getSheetByName("Produk");
      var dataProduk = sheetProduk.getDataRange().getValues();
      var dipakai = 0;
      for (var j = 1; j < dataProduk.length; j++) {
        if (String(dataProduk[j][8]).trim() === String(nama).trim() || String(dataProduk[j][9]).trim() === String(nama).trim()) dipakai++;
      }
      if (dipakai > 0) {
        return "Error: Satuan '" + nama + "' masih dipakai oleh " + dipakai + " produk.";
      }

      sheet.deleteRow(i + 1);
      return "Satuan berhasil dihapus.";
    }
  }
  return "Error: Satuan tidak ditemukan.";
}

// =========================================================
// SEEDING DATA AWAL KATEGORI & SATUAN
// Jalankan SATU KALI secara manual dari editor Apps Script (pilih fungsi
// "seedKategoriSatuanAwal" di dropdown, lalu klik Run) untuk mengisi
// kategori & satuan contoh. Hanya mengisi kalau sheet-nya masih kosong,
// jadi aman dijalankan berkali-kali.
// =========================================================
function seedKategoriSatuanAwal() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetKategori = ss.getSheetByName("Kategori");
  var sheetSatuan = ss.getSheetByName("Satuan");

  if (!sheetKategori || !sheetSatuan) {
    return "Error: Sheet 'Kategori' dan/atau 'Satuan' belum dibuat. Buat dulu sheet-nya dengan header yang sesuai.";
  }

  if (sheetKategori.getLastRow() <= 1) {
    var daftarKategori = ["Sembako", "Minuman", "Snack", "Rokok", "Bumbu Dapur", "Kebutuhan Mandi", "Pembersih", "Obat"];
    daftarKategori.forEach(function(nama, idx) {
      var id = "KTG-" + ("0000" + (idx + 1)).slice(-4);
      sheetKategori.appendRow([id, nama]);
    });
  }

  if (sheetSatuan.getLastRow() <= 1) {
    var daftarBesar = ["Dus", "Lusin", "Slop", "Renceng", "Karung", "Krat", "Drum", "Jurigen", "Pack", "Kodi"];
    var daftarEcer = ["Pcs", "Kg", "Gram", "Bungkus", "Sachet", "Butir", "Botol"];
    var urut = 1;
    daftarBesar.forEach(function(nama) {
      sheetSatuan.appendRow(["STN-" + ("0000" + urut).slice(-4), nama, "Besar"]);
      urut++;
    });
    daftarEcer.forEach(function(nama) {
      sheetSatuan.appendRow(["STN-" + ("0000" + urut).slice(-4), nama, "Ecer"]);
      urut++;
    });
  }

  return "Kategori dan Satuan awal berhasil ditambahkan (kalau sebelumnya masih kosong).";
}

// =========================================================
// DATA DEMO UNTUK SCREENSHOT — jalankan SATU KALI manual dari editor
// Apps Script (pilih fungsi "isiDataDemoUntukScreenshot", klik Run).
// Mengisi Kategori, Satuan, ~14 produk toko kelontong, dan beberapa
// transaksi contoh (tersebar bulan ini & bulan lalu, biar dashboard/
// grafik ada isinya) — supaya tampilan tidak kosong saat screenshot.
//
// AMAN: hanya jalan kalau sheet Produk & Transaksi MASIH KOSONG, supaya
// tidak menimpa data asli tokomu secara tidak sengaja.
//
// SETELAH SELESAI SCREENSHOT: jalankan resetDataAwal() untuk membersihkan
// data dummy ini sebelum aplikasi dipakai transaksi sungguhan.
// =========================================================
function isiDataDemoUntukScreenshot() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetProduk = ss.getSheetByName("Produk");
  var sheetTransaksi = ss.getSheetByName("Transaksi");

  if (!sheetProduk || !sheetTransaksi) {
    return "Error: Sheet 'Produk' dan/atau 'Transaksi' belum ada.";
  }
  if (sheetProduk.getLastRow() > 1 || sheetTransaksi.getLastRow() > 1) {
    return "Dibatalkan: sheet Produk/Transaksi sudah ada isinya. Fungsi ini hanya jalan kalau keduanya masih kosong " +
           "(biar data asli tokomu tidak ketiban data dummy). Kosongkan dulu pakai resetDataAwal() kalau memang mau isi ulang dengan data demo.";
  }

  seedKategoriSatuanAwal();

  var produkDemo = [
    { nama: "Beras Rojolele 5kg", kategori: "Sembako", hpp: 60000, harga: 68000, stok: 25, minStok: 5, satuanBesar: "Karung", satuanEcer: "Kg", konversi: 25 },
    { nama: "Minyak Goreng Bimoli 1L", kategori: "Sembako", hpp: 16000, harga: 19000, stok: 40, minStok: 8, satuanBesar: "Dus", satuanEcer: "Pcs", konversi: 12 },
    { nama: "Teh Pucuk Harum 350ml", kategori: "Minuman", hpp: 3000, harga: 4000, stok: 60, minStok: 10, satuanBesar: "Dus", satuanEcer: "Pcs", konversi: 24 },
    { nama: "Coca-Cola Kaleng 330ml", kategori: "Minuman", hpp: 4500, harga: 6000, stok: 3, minStok: 10, satuanBesar: "Dus", satuanEcer: "Pcs", konversi: 24 },
    { nama: "Chitato Sapi Panggang", kategori: "Snack", hpp: 8000, harga: 10000, stok: 30, minStok: 5, satuanBesar: "", satuanEcer: "Pcs", konversi: 1 },
    { nama: "Indomie Goreng", kategori: "Snack", hpp: 2800, harga: 3500, stok: 100, minStok: 20, satuanBesar: "Dus", satuanEcer: "Pcs", konversi: 40 },
    { nama: "Surya 12", kategori: "Rokok", hpp: 20000, harga: 25000, stok: 24, minStok: 5, satuanBesar: "Slop", satuanEcer: "Bungkus", konversi: 10 },
    { nama: "Sampoerna Mild 16", kategori: "Rokok", hpp: 24000, harga: 29000, stok: 0, minStok: 5, satuanBesar: "Slop", satuanEcer: "Bungkus", konversi: 10 },
    { nama: "Royco Ayam Sachet", kategori: "Bumbu Dapur", hpp: 500, harga: 1000, stok: 80, minStok: 15, satuanBesar: "", satuanEcer: "Sachet", konversi: 1 },
    { nama: "Kecap Bango 135ml", kategori: "Bumbu Dapur", hpp: 7000, harga: 9000, stok: 20, minStok: 5, satuanBesar: "", satuanEcer: "Botol", konversi: 1 },
    { nama: "Sabun Lifebuoy 85gr", kategori: "Kebutuhan Mandi", hpp: 2500, harga: 3500, stok: 45, minStok: 10, satuanBesar: "", satuanEcer: "Pcs", konversi: 1 },
    { nama: "Pepsodent 190gr", kategori: "Kebutuhan Mandi", hpp: 6000, harga: 8000, stok: 18, minStok: 5, satuanBesar: "", satuanEcer: "Pcs", konversi: 1 },
    { nama: "Sunlight 400ml", kategori: "Pembersih", hpp: 5500, harga: 7000, stok: 22, minStok: 5, satuanBesar: "", satuanEcer: "Botol", konversi: 1 },
    { nama: "Paracetamol Strip", kategori: "Obat", hpp: 2000, harga: 3000, stok: 4, minStok: 5, satuanBesar: "", satuanEcer: "Pcs", konversi: 1 }
  ];

  var idProduk = [];
  produkDemo.forEach(function(p) {
    var infoKategori = dapatkanKodeDanUrutanKategori(ss, p.kategori);
    var urutanStr = ("0000" + infoKategori.urutan).slice(-4);
    var id = infoKategori.kode + "-" + urutanStr;
    sheetProduk.appendRow([id, p.nama, p.kategori, p.hpp, p.harga, p.stok, "", p.minStok, p.satuanBesar, p.satuanEcer, p.konversi]);
    idProduk.push({ id: id, nama: p.nama, harga: p.harga, hpp: p.hpp });
  });
  sheetProduk.getRange(2, 4, sheetProduk.getLastRow() - 1, 2).setNumberFormat("#,##0");

  // --- Transaksi contoh: disebar ke bulan ini & bulan lalu biar grafik ada isinya ---
  function buatTransaksiDemo(tanggal, itemIndexList, metode, status) {
    var itemTerjual = itemIndexList.map(function(i) {
      var qty = 1 + Math.floor(Math.random() * 3);
      return { id: idProduk[i].id, nama: idProduk[i].nama, harga: idProduk[i].harga, qty: qty };
    });
    var totalHarga = 0, totalModal = 0;
    itemTerjual.forEach(function(it, idx) {
      totalHarga += it.harga * it.qty;
      totalModal += idProduk[itemIndexList[idx]].hpp * it.qty;
    });
    var totalLaba = totalHarga - totalModal;
    var bayar = (metode === "Tunai") ? totalHarga + 5000 : totalHarga;
    var kembali = bayar - totalHarga;

    var id = generateIdTransaksi(sheetTransaksi, tanggal);
    sheetTransaksi.appendRow([id, tanggal, JSON.stringify(itemTerjual), totalHarga, totalLaba, bayar, kembali, metode, status]);
  }

  var y = new Date().getFullYear();
  var m = new Date().getMonth();

  // Bulan lalu (3 transaksi)
  buatTransaksiDemo(new Date(y, m - 1, 5, 9, 30), [0, 2], "Tunai", "Selesai");
  buatTransaksiDemo(new Date(y, m - 1, 14, 13, 0), [4, 6], "QRIS", "Selesai");
  buatTransaksiDemo(new Date(y, m - 1, 22, 16, 45), [1, 9, 10], "Transfer", "Selesai");

  // Bulan ini (6 transaksi, termasuk 1 dibatalkan)
  buatTransaksiDemo(new Date(y, m, 2, 8, 20), [2, 4], "Tunai", "Selesai");
  buatTransaksiDemo(new Date(y, m, 5, 11, 10), [0, 1, 6], "Transfer", "Selesai");
  buatTransaksiDemo(new Date(y, m, 8, 14, 5), [5, 9], "QRIS", "Selesai");
  buatTransaksiDemo(new Date(y, m, 11, 9, 50), [3, 12], "Tunai", "Dibatalkan");
  buatTransaksiDemo(new Date(y, m, 13, 17, 30), [6, 8], "Tunai", "Selesai");
  buatTransaksiDemo(new Date(y, m, 15, 10, 0), [2, 5, 11], "QRIS", "Selesai");

  var lastRowTrx = sheetTransaksi.getLastRow();
  sheetTransaksi.getRange(2, 4, lastRowTrx - 1, 4).setNumberFormat("#,##0");

  return "Data demo berhasil dibuat: " + produkDemo.length + " produk & 9 transaksi contoh. " +
         "Login pakai akun 'demo' (lihat AKUN_LOGIN) untuk screenshot. " +
         "Setelah selesai, jalankan resetDataAwal() untuk membersihkan sebelum dipakai sungguhan.";
}

function generateIdTransaksi(sheetTransaksi, tanggal) {
  var tz = Session.getScriptTimeZone();
  var dd = Utilities.formatDate(tanggal, tz, "dd");
  var mm = Utilities.formatDate(tanggal, tz, "MM");
  var yy = Utilities.formatDate(tanggal, tz, "yy");

  var data = sheetTransaksi.getDataRange().getValues();
  var polaBulanIni = new RegExp("^TRX\\d{2}" + mm + yy + "(\\d{4})$");
  var urutanTerakhir = 0;

  for (var i = 1; i < data.length; i++) {
    var idLama = String(data[i][0] || "");
    var cocok = idLama.match(polaBulanIni);
    if (cocok) {
      var urutan = parseInt(cocok[1], 10);
      if (urutan > urutanTerakhir) urutanTerakhir = urutan;
    }
  }

  var urutanBaru = urutanTerakhir + 1;
  var urutanStr = ("0000" + urutanBaru).slice(-4);
  return "TRX" + dd + mm + yy + urutanStr;
}

// --- FUNGSI DATA PRODUK ---
function getDataProduk() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Produk");
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  data.shift();
  return data;
}

function tambahProdukBaru(dataProduk, token) {
  if (!cekTokenAdmin(token)) return "Error: Akses ditolak. Hanya Admin yang bisa menambah barang.";

  var lock = LockService.getDocumentLock();
  try {
    lock.waitLock(30000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Produk");

    var infoKategori = dapatkanKodeDanUrutanKategori(ss, dataProduk.kategori);
    var urutanStr = ("0000" + infoKategori.urutan).slice(-4);
    var idBarang = infoKategori.kode + "-" + urutanStr;

    var fotoUrl = "";
    if (dataProduk.fotoBase64) {
      try {
        fotoUrl = unggahFotoProduk(dataProduk.fotoBase64, dataProduk.fotoMime || "image/jpeg", idBarang);
      } catch (errFoto) {
        Logger.log("GAGAL UPLOAD FOTO (tambahProdukBaru): nama=" + errFoto.name + " | pesan=" + errFoto.message + " | stack=" + errFoto.stack);
        return "Error: Gagal mengunggah foto ke Google Drive [" + errFoto.name + ": " + errFoto.message + "]. " +
               "Kemungkinan besar script belum diberi izin akses Drive, atau ID_FOLDER_FOTO_PRODUK di code.gs salah. " +
               "Coba jalankan fungsi 'tesUploadFotoManual' sekali secara manual dari editor Apps Script untuk memicu izin & mendiagnosis.";
      }
    }

    sheet.appendRow([
      idBarang,
      dataProduk.nama,
      dataProduk.kategori,
      Number(dataProduk.hpp) || 0,
      Number(dataProduk.harga) || 0,
      Number(dataProduk.stok) || 0,
      fotoUrl,
      Number(dataProduk.minStok) || 5,
      dataProduk.satuanBesar || "",
      dataProduk.satuanEcer || "",
      Number(dataProduk.konversi) || 1
    ]);

    var barisTerakhir = sheet.getLastRow();
    sheet.getRange(barisTerakhir, 4, 1, 2).setNumberFormat("#,##0");

    return "Barang berhasil ditambahkan dengan ID: " + idBarang;
  } catch (e) {
    return "Error sistem: " + e.message;
  } finally {
    lock.releaseLock();
  }
}

function updateProduk(dataProduk, token) {
  if (!cekTokenAdmin(token)) return "Error: Akses ditolak. Hanya Admin yang bisa mengubah barang.";

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Produk");
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == dataProduk.id) {
      var fotoUrl = data[i][6] || "";
      if (dataProduk.fotoBase64) {
        try {
          fotoUrl = unggahFotoProduk(dataProduk.fotoBase64, dataProduk.fotoMime || "image/jpeg", dataProduk.id);
        } catch (errFoto) {
          Logger.log("GAGAL UPLOAD FOTO (updateProduk): nama=" + errFoto.name + " | pesan=" + errFoto.message + " | stack=" + errFoto.stack);
          return "Error: Gagal mengunggah foto baru ke Google Drive [" + errFoto.name + ": " + errFoto.message + "]. " +
                 "Data lain BELUM disimpan. Kemungkinan besar script belum diberi izin akses Drive, atau ID_FOLDER_FOTO_PRODUK di code.gs salah. " +
                 "Coba jalankan fungsi 'tesUploadFotoManual' sekali secara manual dari editor Apps Script untuk memicu izin & mendiagnosis.";
        }
      }

      sheet.getRange(i + 1, 2, 1, 10).setValues([[
        dataProduk.nama,
        dataProduk.kategori,
        Number(dataProduk.hpp) || 0,
        Number(dataProduk.harga) || 0,
        Number(dataProduk.stok) || 0,
        fotoUrl,
        Number(dataProduk.minStok) || 5,
        dataProduk.satuanBesar || "",
        dataProduk.satuanEcer || "",
        Number(dataProduk.konversi) || 1
      ]]);
      sheet.getRange(i + 1, 4, 1, 2).setNumberFormat("#,##0");
      return "Data barang berhasil diperbarui!";
    }
  }
  return "Barang tidak ditemukan.";
}

function hapusProduk(id, token) {
  if (!cekTokenAdmin(token)) return "Error: Akses ditolak. Hanya Admin yang bisa menghapus barang.";

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Produk");
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return "Barang berhasil dihapus.";
    }
  }
  return "Barang tidak ditemukan.";
}

// --- FUNGSI TRANSAKSI ---
function simpanTransaksi(keranjang, totalHarga, totalModal, uangBayar, uangKembali, metodePembayaran, token) {
  if (!cekTokenValid(token)) return "Error: Sesi login tidak valid. Silakan login kembali.";

  var lock = LockService.getDocumentLock();

  try {
    lock.waitLock(30000);

    if (!keranjang || keranjang.length === 0) {
      return "Error: Keranjang kosong.";
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetProduk = ss.getSheetByName("Produk");
    var sheetTransaksi = ss.getSheetByName("Transaksi");

    if (!sheetProduk || !sheetTransaksi) {
      return "Error: Database tidak ditemukan.";
    }

    var dataProduk = sheetProduk.getDataRange().getValues();

    // VALIDASI STOK SERVER
    for (var i = 0; i < keranjang.length; i++) {
      var itemKeranjang = keranjang[i];
      var ditemukan = false;

      for (var j = 1; j < dataProduk.length; j++) {
        if (dataProduk[j][0] == itemKeranjang.id) {
          ditemukan = true;
          var stokAktual = Number(dataProduk[j][5]) || 0;
          if (stokAktual < itemKeranjang.qty) {
            return "Gagal: Stok '" + itemKeranjang.nama + "' tidak mencukupi. (Sisa: " + stokAktual + ")";
          }
          break;
        }
      }
      if (!ditemukan) {
        return "Gagal: Barang '" + itemKeranjang.nama + "' tidak ditemukan.";
      }
    }

    // SIMPAN TRANSAKSI
    var tanggal = new Date();
    var idTransaksi = generateIdTransaksi(sheetTransaksi, tanggal);
    var itemTerjual = JSON.stringify(keranjang);
    var totalLaba = totalHarga - totalModal;

    sheetTransaksi.appendRow([idTransaksi, tanggal, itemTerjual, totalHarga, totalLaba, uangBayar, uangKembali, metodePembayaran, "Selesai"]);
    var lastRow = sheetTransaksi.getLastRow();
    sheetTransaksi.getRange(lastRow, 4, 1, 4).setNumberFormat("#,##0");

    // UPDATE STOK
    for (var i = 0; i < keranjang.length; i++) {
      var item = keranjang[i];
      for (var j = 1; j < dataProduk.length; j++) {
        if (dataProduk[j][0] == item.id) {
          var stokLama = Number(dataProduk[j][5]) || 0;
          var stokBaru = stokLama - item.qty;
          sheetProduk.getRange(j + 1, 6).setValue(stokBaru);
          break;
        }
      }
    }

    return "Transaksi Berhasil!";

  } catch (e) {
    return "Error sistem: " + e.message;
  } finally {
    lock.releaseLock();
  }
}

function batalTransaksi(idTransaksi, token) {
  if (!cekTokenAdmin(token)) return "Error: Akses ditolak. Hanya Admin yang bisa membatalkan transaksi.";

  var lock = LockService.getDocumentLock();
  try {
    lock.waitLock(30000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetTransaksi = ss.getSheetByName("Transaksi");
    var sheetProduk = ss.getSheetByName("Produk");
    var data = sheetTransaksi.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == idTransaksi) {
        if (data[i][8] === "Dibatalkan") {
          return "Transaksi ini sudah pernah dibatalkan sebelumnya.";
        }

        var items = JSON.parse(data[i][2] || "[]");
        var dataProduk = sheetProduk.getDataRange().getValues();

        items.forEach(function (item) {
          for (var j = 1; j < dataProduk.length; j++) {
            if (dataProduk[j][0] == item.id) {
              var stokBaru = (Number(dataProduk[j][5]) || 0) + Number(item.qty);
              sheetProduk.getRange(j + 1, 6).setValue(stokBaru);
              break;
            }
          }
        });

        sheetTransaksi.getRange(i + 1, 9).setValue("Dibatalkan");
        return "Transaksi berhasil dibatalkan. Stok barang telah dikembalikan.";
      }
    }
    return "Transaksi tidak ditemukan.";
  } catch (e) {
    return "Error sistem: " + e.message;
  } finally {
    lock.releaseLock();
  }
}

function getDataTransaksi() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Transaksi");

  if (!sheet) {
    return "Error: Sheet Transaksi tidak ditemukan";
  }

  var data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return [];
  }

  data.shift();

  var dataAman = data.map(function(row) {
    if (row[1] instanceof Date) {
      row[1] = row[1].toISOString();
    }
    if (!row[8]) row[8] = "Selesai"; // data transaksi lama sebelum kolom Status dibuat
    return row;
  });

  return dataAman.reverse();
}

// --- FUNGSI DASHBOARD ---
function getDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetProduk = ss.getSheetByName("Produk");
  var sheetTransaksi = ss.getSheetByName("Transaksi");

  var produk = sheetProduk ? sheetProduk.getDataRange().getValues() : [];
  var transaksi = sheetTransaksi ? sheetTransaksi.getDataRange().getValues() : [];

  var hariIni = new Date();
  var omzetHariIni = 0;
  var labaHariIni = 0;
  var jumlahTransaksi = 0;
  var produkTerjual = {};

  for (var i = 1; i < transaksi.length; i++) {
    var tanggal = new Date(transaksi[i][1]);
    var status = transaksi[i][8] || "Selesai";
    if (status === "Dibatalkan") continue;

    if (
      tanggal.getDate() == hariIni.getDate() &&
      tanggal.getMonth() == hariIni.getMonth() &&
      tanggal.getFullYear() == hariIni.getFullYear()
    ) {
      omzetHariIni += Number(transaksi[i][3]) || 0;
      labaHariIni += Number(transaksi[i][4]) || 0;
      jumlahTransaksi++;

      try {
        var items = JSON.parse(transaksi[i][2]);
        items.forEach(function(item){
          if(!produkTerjual[item.nama]){
            produkTerjual[item.nama] = 0;
          }
          produkTerjual[item.nama] += Number(item.qty);
        });
      } catch(err){}
    }
  }

  var produkTerlaris = "-";
  var qtyTerlaris = 0;

  for (var nama in produkTerjual) {
    if (produkTerjual[nama] > qtyTerlaris) {
      qtyTerlaris = produkTerjual[nama];
      produkTerlaris = nama;
    }
  }

  var stokMenipis = [];
  var stokHabis = 0;
  var nilaiStok = 0;

  for (var j = 1; j < produk.length; j++) {
    var stok = Number(produk[j][5]) || 0;
    var hpp = Number(produk[j][3]) || 0;
    
    nilaiStok += (stok * hpp);

    if (stok == 0) {
      stokHabis++;
    }
    
    var minStok = Number(produk[j][7]) || 5; // kolom H: MinStok custom per produk, default 5 kalau kosong

    if (stok <= minStok && stok > 0) { 
      stokMenipis.push({
        nama: produk[j][1],
        stok: stok,
        minStok: minStok
      });
    }
  }

  return {
    omzet: omzetHariIni,
    laba: labaHariIni,
    transaksi: jumlahTransaksi,
    produkTerlaris: produkTerlaris,
    qtyTerlaris: qtyTerlaris,
    stokMenipis: stokMenipis,
    stokHabis: stokHabis,
    totalProduk: produk.length > 1 ? produk.length - 1 : 0,
    nilaiStok: nilaiStok
  };
}

// Mengambil N transaksi paling baru untuk tabel "Transaksi Terbaru" di Dashboard
// (baca dari bawah sheet langsung supaya tidak perlu memuat seluruh riwayat)
function getTransaksiTerbaru(jumlah) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Transaksi");
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  jumlah = jumlah || 5;
  var mulaiBaris = Math.max(2, lastRow - jumlah + 1);
  var jumlahBaris = lastRow - mulaiBaris + 1;
  var data = sheet.getRange(mulaiBaris, 1, jumlahBaris, sheet.getLastColumn()).getValues();

  var dataAman = data.map(function(row) {
    if (row[1] instanceof Date) row[1] = row[1].toISOString();
    if (!row[8]) row[8] = "Selesai";
    return row;
  });

  return dataAman.reverse(); // yang terbaru tampil paling atas
}

function getStatistikBulanan() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Transaksi");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var hasil = {};

  for (var i = 1; i < data.length; i++) {
    if ((data[i][8] || "Selesai") === "Dibatalkan") continue;

    var tanggal = new Date(data[i][1]);
    var bulan = Utilities.formatDate(tanggal, Session.getScriptTimeZone(), "MMM yyyy");

    if (!hasil[bulan]) {
      hasil[bulan] = { omzet: 0, laba: 0 };
    }
    
    hasil[bulan].omzet += Number(data[i][3]) || 0;
    hasil[bulan].laba += Number(data[i][4]) || 0;
  }

  var output = [];
  for (var b in hasil) {
    output.push({ bulan: b, omzet: hasil[b].omzet, laba: hasil[b].laba });
  }

  return output;
}

function getProdukTerlaris() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Transaksi");
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var produk = {};

  for (var i = 1; i < data.length; i++) {
    if ((data[i][8] || "Selesai") === "Dibatalkan") continue;
    try {
      var items = JSON.parse(data[i][2]);
      items.forEach(function(item){
        if (!produk[item.nama]) { produk[item.nama] = 0; }
        produk[item.nama] += Number(item.qty);
      });
    } catch(err){}
  }

  var hasil = [];
  for (var nama in produk) {
    hasil.push({ nama: nama, qty: produk[nama] });
  }

  hasil.sort(function(a,b){ return b.qty - a.qty; });
  return hasil.slice(0,10);
}
