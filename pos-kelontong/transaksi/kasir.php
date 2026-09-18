<?php
/**
 * File: transaksi/kasir.php
 * Deskripsi: Antarmuka utama Kasir & Penjualan POS Toko Kelontong
 * Hak Akses: Pemilik & Kasir (terautentikasi)
 * Aturan:
 *   - Cari barang via AJAX & keranjang belanja client-side JS array
 *   - Perhitungan real-time total & kembalian (validasi bayar >= total)
 *   - Transaksi database (begin/commit/rollback)
 *   - Insert transaksi -> insert transaksi_detail -> update stok barang
 *   - Validasi ketersediaan stok sebelum commit
 *   - Redirect ke struk.php setelah transaksi berhasil
 */

// ==========================================
// 1. BUFFERING, SESI & DEPENDENSI
// ==========================================
ob_start();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../auth/cek_session.php';

// Proteksi: Pengguna wajib login
cek_login();

$id_kasir   = (int)$_SESSION['id'];
$nama_kasir = $_SESSION['nama_lengkap'] ?? 'Kasir';
$pesan_error = '';

// ==========================================
// 2. PEMROSESAN SIMPAN TRANSAKSI (POST)
// ==========================================
// PENTING (CATATAN ARSITEKTUR / URUTAN PROSES):
// Seluruh logika pemrosesan form transaksi (validasi input, pengecekan stok,
// database transaction ACID, insert transaksi & detail, update stok,
// serta insert piutang jika ada kasbon) WAJIB dieksekusi DI SINI,
// SEBELUM file template/header.php di-include atau output HTML apapun dicetak.
// Di PHP, header('Location: ...') tidak dapat memodifikasi header HTTP jika
// sudah ada output HTML yang dikirim ke browser (mencegah error fatal:
// "Warning: Cannot modify header information - headers already sent").
// ==========================================
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['proses_transaksi'])) {
    if (!validasi_csrf()) {
        $pesan_error = 'Token keamanan CSRF tidak valid atau sesi telah kedaluwarsa. Silakan muat ulang halaman.';
    } else {
        $metode_pembayaran = trim($_POST['metode_pembayaran'] ?? 'tunai');
        if (!in_array($metode_pembayaran, ['tunai', 'piutang'])) {
            $metode_pembayaran = 'tunai';
        }

        $items_raw = $_POST['items_json'] ?? '[]';
        $items     = json_decode($items_raw, true);

        // Validasi keranjang belanja
        if (empty($items) || !is_array($items)) {
            $pesan_error = 'Keranjang belanja masih kosong! Silakan pilih barang terlebih dahulu.';
        } else {
            // Memulai Transaksi Database (ACID)
            mysqli_begin_transaction($conn);

            try {
                $total_belanja = 0;
                $items_valid = [];

                // Statement untuk mengecek dan mengunci baris data stok (FOR UPDATE)
                $stmt_cek = mysqli_prepare($conn, "SELECT id, nama_barang, harga_jual, stok FROM barang WHERE id = ? FOR UPDATE");

                // Loop 1: Validasi stok & harga terkini dari database
                foreach ($items as $item) {
                    $id_barang = (int)($item['id'] ?? 0);
                    $qty       = (int)($item['qty'] ?? 0);

                    if ($id_barang <= 0 || $qty <= 0) {
                        throw new Exception("Data barang tidak valid.");
                    }

                    mysqli_stmt_bind_param($stmt_cek, "i", $id_barang);
                    mysqli_stmt_execute($stmt_cek);
                    $res_cek = mysqli_stmt_get_result($stmt_cek);
                    $barang_db = mysqli_fetch_assoc($res_cek);

                    if (!$barang_db) {
                        throw new Exception("Barang dengan ID {$id_barang} tidak ditemukan dalam database.");
                    }

                    // Validasi stok mencukupi
                    if ((int)$barang_db['stok'] < $qty) {
                        throw new Exception("Stok untuk '{$barang_db['nama_barang']}' tidak mencukupi! Tersisa: {$barang_db['stok']}, Diminta: {$qty}.");
                    }

                    $harga_satuan = (float)$barang_db['harga_jual'];
                    $subtotal     = $harga_satuan * $qty;
                    $total_belanja += $subtotal;

                    $items_valid[] = [
                        'id_barang'    => $id_barang,
                        'nama_barang'  => $barang_db['nama_barang'],
                        'harga_satuan' => $harga_satuan,
                        'jumlah'       => $qty,
                        'subtotal'     => $subtotal
                    ];
                }
                mysqli_stmt_close($stmt_cek);

                // Variabel pembayaran
                $id_pelanggan  = null;
                $uang_bayar    = 0;
                $kembalian     = 0;
                $total_piutang = 0;
                $sisa_piutang  = 0;
                $status_piutang = 'belum_lunas';
                $uang_muka     = 0;

                // Percabangan berdasarkan Metode Pembayaran
                if ($metode_pembayaran === 'piutang') {
                    // Validasi Pemilihan Pelanggan Kasbon
                    $id_pelanggan = (int)($_POST['id_pelanggan'] ?? 0);
                    if ($id_pelanggan <= 0) {
                        throw new Exception("Untuk transaksi Piutang / Kasbon, nama pelanggan wajib dipilih!");
                    }

                    // Verifikasi keberadaan data pelanggan
                    $stmt_pel_cek = mysqli_prepare($conn, "SELECT id, nama FROM pelanggan WHERE id = ? LIMIT 1");
                    mysqli_stmt_bind_param($stmt_pel_cek, "i", $id_pelanggan);
                    mysqli_stmt_execute($stmt_pel_cek);
                    $res_pel_cek = mysqli_stmt_get_result($stmt_pel_cek);
                    $pelanggan_db = mysqli_fetch_assoc($res_pel_cek);
                    mysqli_stmt_close($stmt_pel_cek);

                    if (!$pelanggan_db) {
                        throw new Exception("Data pelanggan yang dipilih tidak ditemukan dalam database!");
                    }

                    // Menangkap uang muka / DP (opsional)
                    $uang_muka = (float)str_replace(['.', ','], ['', '.'], $_POST['uang_muka'] ?? 0);
                    if ($uang_muka < 0) {
                        throw new Exception("Nominal uang muka (DP) tidak boleh bernilai negatif!");
                    }
                    if ($uang_muka > $total_belanja) {
                        throw new Exception("Nominal uang muka tidak boleh melebihi total belanja (Rp " . number_format($total_belanja, 0, ',', '.') . ")!");
                    }

                    $uang_bayar    = $uang_muka;
                    $kembalian     = 0;
                    $total_piutang = $total_belanja;
                    $sisa_piutang  = $total_belanja - $uang_muka;
                    $status_piutang = ($sisa_piutang <= 0) ? 'lunas' : 'belum_lunas';

                } else {
                    // Metode Tunai (Cash)
                    $uang_bayar = (float)str_replace(['.', ','], ['', '.'], $_POST['uang_bayar'] ?? 0);

                    // Validasi uang bayar mencukupi total belanja
                    if ($uang_bayar < $total_belanja) {
                        throw new Exception("Uang pembayaran (Rp " . number_format($uang_bayar, 0, ',', '.') . ") kurang dari total belanja (Rp " . number_format($total_belanja, 0, ',', '.') . ")!");
                    }

                    $kembalian = $uang_bayar - $total_belanja;
                }

                // Generate Kode Transaksi Unik (Format: TRX-YYYYMMDD-XXXX)
                $today_prefix = 'TRX-' . date('Ymd') . '-';
                $stmt_seq = mysqli_prepare($conn, "SELECT COUNT(*) AS total FROM transaksi WHERE kode_transaksi LIKE ?");
                $like_prefix = $today_prefix . '%';
                mysqli_stmt_bind_param($stmt_seq, "s", $like_prefix);
                mysqli_stmt_execute($stmt_seq);
                $res_seq = mysqli_stmt_get_result($stmt_seq);
                $seq_row = mysqli_fetch_assoc($res_seq);
                $next_num = ((int)$seq_row['total']) + 1;
                mysqli_stmt_close($stmt_seq);

                $kode_transaksi = $today_prefix . sprintf('%04d', $next_num);

                // 1. Insert Data ke Tabel transaksi (termasuk metode_pembayaran dan id_pelanggan)
                $stmt_trx = mysqli_prepare($conn, "INSERT INTO transaksi (kode_transaksi, id_kasir, metode_pembayaran, id_pelanggan, total_belanja, uang_bayar, kembalian, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
                mysqli_stmt_bind_param($stmt_trx, "sssiddd", $kode_transaksi, $id_kasir, $metode_pembayaran, $id_pelanggan, $total_belanja, $uang_bayar, $kembalian);

                if (!mysqli_stmt_execute($stmt_trx)) {
                    throw new Exception("Gagal menyimpan data transaksi master.");
                }
                $id_transaksi_baru = mysqli_insert_id($conn);
                mysqli_stmt_close($stmt_trx);

                // Prepared statement untuk insert detail & update stok
                $stmt_detail = mysqli_prepare($conn, "INSERT INTO transaksi_detail (id_transaksi, id_barang, nama_barang, harga_satuan, jumlah, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt_stok   = mysqli_prepare($conn, "UPDATE barang SET stok = stok - ?, updated_at = NOW() WHERE id = ?");

                // 2. Insert Setiap Item ke transaksi_detail & Kurangi Stok
                foreach ($items_valid as $val) {
                    mysqli_stmt_bind_param($stmt_detail, "iisdid", 
                        $id_transaksi_baru, 
                        $val['id_barang'], 
                        $val['nama_barang'], 
                        $val['harga_satuan'], 
                        $val['jumlah'], 
                        $val['subtotal']
                    );
                    if (!mysqli_stmt_execute($stmt_detail)) {
                        throw new Exception("Gagal menyimpan detail belanja untuk '{$val['nama_barang']}'.");
                    }

                    // Kurangi stok barang
                    mysqli_stmt_bind_param($stmt_stok, "ii", $val['jumlah'], $val['id_barang']);
                    if (!mysqli_stmt_execute($stmt_stok)) {
                        throw new Exception("Gagal memperbarui stok untuk '{$val['nama_barang']}'.");
                    }
                }
                mysqli_stmt_close($stmt_detail);
                mysqli_stmt_close($stmt_stok);

                // 3. Jika Metode Pembayaran Piutang: Insert ke Tabel piutang & pembayaran_piutang (jika ada DP)
                if ($metode_pembayaran === 'piutang') {
                    $stmt_piutang = mysqli_prepare($conn, "INSERT INTO piutang (id_transaksi, id_pelanggan, total_piutang, sisa_piutang, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
                    mysqli_stmt_bind_param($stmt_piutang, "iidds", $id_transaksi_baru, $id_pelanggan, $total_piutang, $sisa_piutang, $status_piutang);
                    if (!mysqli_stmt_execute($stmt_piutang)) {
                        throw new Exception("Gagal menyimpan data piutang / kasbon pelanggan.");
                    }
                    $id_piutang_baru = mysqli_insert_id($conn);
                    mysqli_stmt_close($stmt_piutang);

                    // Catat pembayaran DP jika uang muka > 0
                    if ($uang_muka > 0) {
                        $stmt_dp = mysqli_prepare($conn, "INSERT INTO pembayaran_piutang (id_piutang, jumlah_bayar, tanggal_bayar, keterangan) VALUES (?, ?, NOW(), ?)");
                        $ket_dp = "Uang Muka (DP) Transaksi Kasir";
                        mysqli_stmt_bind_param($stmt_dp, "ids", $id_piutang_baru, $uang_muka, $ket_dp);
                        if (!mysqli_stmt_execute($stmt_dp)) {
                            throw new Exception("Gagal mencatat rincian pembayaran DP kasbon.");
                        }
                        mysqli_stmt_close($stmt_dp);
                    }
                }

                // Jika seluruh proses sukses, COMMIT transaksi DB
                mysqli_commit($conn);

                // Redirect ke halaman cetak struk SEBELUM output HTML apapun
                header("Location: struk.php?id=" . $id_transaksi_baru . "&status=sukses");
                exit;

            } catch (Exception $e) {
                // Jika terjadi kesalahan atau stok tidak cukup, ROLLBACK seluruh query
                mysqli_rollback($conn);
                $pesan_error = $e->getMessage();
            }
        }
    }
}

// ==========================================
// 3. PENGAMBILAN DATA UNTUK TAMPILAN KASIR
// ==========================================
// Mengambil daftar kategori untuk tab filter di kasir
$q_kategori_kasir = mysqli_query($conn, "SELECT id, nama_kategori FROM kategori ORDER BY nama_kategori ASC");
$kategori_tabs = [];
while ($row_kat = mysqli_fetch_assoc($q_kategori_kasir)) {
    $kategori_tabs[] = $row_kat;
}

// Mengambil daftar pelanggan untuk opsi transaksi kasbon / piutang
$q_pelanggan = mysqli_query($conn, "SELECT id, nama, no_hp FROM pelanggan ORDER BY nama ASC");
$pelanggan_list = [];
while ($row_pel = mysqli_fetch_assoc($q_pelanggan)) {
    $pelanggan_list[] = $row_pel;
}

// ==========================================
// 4. MEMUAT TEMPLATE HEADER & RENDER TAMPILAN
// ==========================================
$page_title  = 'Transaksi Kasir';
$active_menu = 'transaksi';
require_once __DIR__ . '/../template/header.php';
?>

<div class="row g-3">
    <!-- ========================================== -->
    <!-- 3. KOLOM KIRI: PENCARIAN & KATALOG PRODUK  -->
    <!-- ========================================== -->
    <div class="col-lg-7 kasir-product-col">
        <div class="card card-custom h-100">
            <div class="card-header bg-white py-3 border-bottom">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0 fw-bold text-primary"><i class="bi bi-search me-2"></i>Pilih & Cari Barang</h6>
                    <span class="badge bg-light text-secondary border small">Scan / Ketik Nama / Kode</span>
                </div>
                <!-- Input Pencarian Barang AJAX -->
                <div class="input-group mb-2">
                    <span class="input-group-text bg-white text-muted"><i class="bi bi-search"></i></span>
                    <input type="text" id="inputCariBarang" class="form-control" placeholder="Ketik nama produk atau scan barcode / kode barang..." autocomplete="off" autofocus>
                    <button class="btn btn-outline-secondary" type="button" id="btnResetCari" title="Bersihkan pencarian">
                        <i class="bi bi-x-circle"></i>
                    </button>
                </div>

                <!-- Tab / Pill Filter Kategori Cepat -->
                <div class="d-flex gap-1 overflow-x-auto pb-1" id="kategoriFilterTabs" style="scrollbar-width: thin; -webkit-overflow-scrolling: touch;">
                    <button type="button" class="btn btn-sm btn-primary rounded-pill px-3 text-nowrap btn-tab-kategori active" data-id="">
                        <i class="bi bi-grid-fill me-1"></i> Semua
                    </button>
                    <?php foreach ($kategori_tabs as $kt): ?>
                        <button type="button" class="btn btn-sm btn-outline-secondary rounded-pill px-3 text-nowrap btn-tab-kategori" data-id="<?= $kt['id'] ?>">
                            <i class="bi bi-tag me-1"></i> <?= htmlspecialchars($kt['nama_kategori']) ?>
                        </button>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Area Tampilan Hasil Pencarian / Katalog Produk -->
            <div class="card-body p-3 kasir-product-area" style="min-height: 480px; max-height: 600px; overflow-y: auto;">
                <div id="loadingIndicator" class="text-center py-5 d-none">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Memuat data barang...</span>
                    </div>
                    <p class="text-muted small mt-2">Mencari barang...</p>
                </div>

                <div id="produkGrid" class="row g-2">
                    <!-- Produk akan dirender oleh JavaScript dari kasir_ajax.php -->
                </div>

                <div id="pesanKosong" class="text-center py-5 d-none text-muted">
                    <i class="bi bi-box-seam fs-1 d-block mb-2 text-secondary"></i>
                    Barang tidak ditemukan atau stok kosong.
                </div>
            </div>
        </div>
    </div>

    <!-- ========================================== -->
    <!-- 4. KOLOM KANAN: KERANJANG & PEMBAYARAN    -->
    <!-- ========================================== -->
    <div class="col-lg-5 kasir-cart-col">
        <div class="card card-custom h-100 d-flex flex-column">
            <!-- Header Keranjang -->
            <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0 fw-bold text-dark"><i class="bi bi-cart3 me-2 text-success"></i>Keranjang Belanja</h6>
                    <small class="text-muted">Kasir: <?= htmlspecialchars($nama_kasir) ?></small>
                </div>
                <button type="button" class="btn btn-outline-danger btn-sm" id="btnKosongkanKeranjang" title="Kosongkan Semua Item">
                    <i class="bi bi-trash me-1"></i> Kosongkan
                </button>
            </div>

            <!-- Notifikasi Kesalahan Validasi -->
            <?php if (!empty($pesan_error)): ?>
                <div class="alert alert-danger alert-dismissible fade show m-3 mb-0 py-2 px-3 small" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i> <?= htmlspecialchars($pesan_error) ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            <?php endif; ?>

            <!-- Daftar Item Belanja (Keranjang) -->
            <div class="card-body p-2 flex-grow-1 kasir-cart-area" style="max-height: 280px; overflow-y: auto;">
                <div class="table-responsive">
                    <table class="table table-sm align-middle mb-0" id="tabelKeranjang">
                        <thead class="table-light small">
                            <tr>
                                <th>Produk</th>
                                <th class="text-center" style="width: 100px;">Qty</th>
                                <th class="text-end" style="width: 90px;">Subtotal</th>
                                <th class="text-center" style="width: 35px;"></th>
                            </tr>
                        </thead>
                        <tbody id="keranjangBody">
                            <!-- Item belanja akan dirender oleh JavaScript -->
                            <tr id="keranjangKosongRow">
                                <td colspan="4" class="text-center py-4 text-muted small">
                                    <i class="bi bi-cart-x fs-3 d-block mb-1 text-secondary"></i>
                                    Keranjang masih kosong. Klik produk di sebelah kiri untuk menambahkannya.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Ringkasan Total & Form Pembayaran -->
            <div class="card-footer bg-light p-3 border-top mt-auto">
                <!-- Tampilan Total Belanja Besar -->
                <div class="bg-primary bg-gradient text-white p-3 rounded-3 mb-3 text-end shadow-sm">
                    <span class="small text-white-50 text-uppercase fw-semibold d-block">Total Pembayaran</span>
                    <h2 class="fw-bold mb-0 font-monospace" id="displayTotal">Rp 0</h2>
                </div>

                <!-- Form POST ke Server -->
                <form action="" method="POST" id="formTransaksi" autocomplete="off">
                    <?= csrf_field() ?>
                    <input type="hidden" name="items_json" id="inputItemsJson" value="[]">
                    <input type="hidden" name="proses_transaksi" value="1">

                    <!-- Pilihan Metode Pembayaran: Tunai vs Piutang -->
                    <div class="mb-3">
                        <label class="form-label fw-bold small text-secondary mb-1">Metode Pembayaran</label>
                        <div class="btn-group w-100" role="group">
                            <input type="radio" class="btn-check" name="metode_pembayaran" id="metodeTunai" value="tunai" checked autocomplete="off">
                            <label class="btn btn-outline-primary fw-semibold" for="metodeTunai">
                                <i class="bi bi-cash-stack me-1"></i> Tunai (Cash)
                            </label>

                            <input type="radio" class="btn-check" name="metode_pembayaran" id="metodePiutang" value="piutang" autocomplete="off">
                            <label class="btn btn-outline-warning fw-semibold text-dark" for="metodePiutang">
                                <i class="bi bi-journal-text me-1"></i> Piutang / Kasbon
                            </label>
                        </div>
                    </div>

                    <!-- Section Pembayaran Tunai -->
                    <div id="sectionTunai">
                        <!-- Input Nominal Bayar -->
                        <div class="mb-2">
                            <label for="inputUangBayar" class="form-label fw-bold small text-secondary mb-1">Nominal Bayar (Tunai)</label>
                            <div class="input-group input-group-lg">
                                <span class="input-group-text bg-white fw-bold">Rp</span>
                                <input type="text" inputmode="numeric" class="form-control text-end fw-bold font-monospace format-ribuan" id="inputUangBayar" name="uang_bayar" placeholder="0" data-value="0">
                            </div>
                            <div class="form-text small text-muted">Masukkan angka, pemisah ribuan otomatis</div>
                        </div>

                        <!-- Tombol Pecahan Uang Cepat -->
                        <div class="d-flex flex-wrap gap-1 mb-3">
                            <button type="button" class="btn btn-outline-secondary btn-sm flex-fill btn-pecahan" id="btnUangPas">Uang Pas</button>
                            <button type="button" class="btn btn-outline-secondary btn-sm flex-fill btn-pecahan" data-nominal="10000">10.000</button>
                            <button type="button" class="btn btn-outline-secondary btn-sm flex-fill btn-pecahan" data-nominal="20000">20.000</button>
                            <button type="button" class="btn btn-outline-secondary btn-sm flex-fill btn-pecahan" data-nominal="50000">50.000</button>
                            <button type="button" class="btn btn-outline-secondary btn-sm flex-fill btn-pecahan" data-nominal="100000">100.000</button>
                        </div>

                        <!-- Informasi Kembalian -->
                        <div class="d-flex justify-content-between align-items-center p-2 rounded-2 mb-3 bg-white border">
                            <span class="fw-semibold text-secondary small">Kembalian:</span>
                            <h4 class="fw-bold mb-0 font-monospace text-success" id="displayKembalian">Rp 0</h4>
                        </div>

                        <!-- Peringatan Pembayaran Kurang -->
                        <div id="alertKurangBayar" class="alert alert-warning py-1 px-2 small mb-2 d-none">
                            <i class="bi bi-info-circle me-1"></i> Uang bayar masih kurang: <strong id="nominalKurang">Rp 0</strong>
                        </div>
                    </div>

                    <!-- Section Pembayaran Piutang / Kasbon -->
                    <div id="sectionPiutang" class="d-none">
                        <div class="p-3 bg-warning-subtle rounded-3 border border-warning-subtle mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <label for="selectPelanggan" class="form-label fw-bold small text-dark mb-0">Pilih Pelanggan <span class="text-danger">*</span></label>
                                <button type="button" class="btn btn-sm btn-primary py-0 px-2 small" data-bs-toggle="modal" data-bs-target="#modalTambahPelangganCepat">
                                    <i class="bi bi-person-plus-fill me-1"></i> + Pelanggan Baru
                                </button>
                            </div>
                            <select class="form-select mb-3" id="selectPelanggan" name="id_pelanggan">
                                <option value="">-- Pilih Pelanggan Terdaftar --</option>
                                <?php foreach ($pelanggan_list as $pel): ?>
                                    <option value="<?= $pel['id'] ?>"><?= htmlspecialchars($pel['nama']) ?> <?= !empty($pel['no_hp']) ? '('.htmlspecialchars($pel['no_hp']).')' : '' ?></option>
                                <?php endforeach; ?>
                            </select>

                            <!-- Input DP Opsional -->
                            <label for="inputUangMuka" class="form-label fw-bold small text-dark mb-1">Uang Muka / DP (Opsional)</label>
                            <div class="input-group mb-1">
                                <span class="input-group-text bg-white">Rp</span>
                                <input type="text" inputmode="numeric" class="form-control text-end font-monospace format-ribuan" id="inputUangMuka" name="uang_muka" placeholder="0" value="0" data-value="0">
                            </div>
                            <div class="form-text small text-muted mb-2">Masukkan angka, pemisah ribuan otomatis</div>

                            <div class="d-flex justify-content-between align-items-center p-2 rounded-2 bg-white border">
                                <span class="small text-muted fw-semibold">Sisa Tagihan Kasbon:</span>
                                <h5 class="fw-bold mb-0 font-monospace text-danger" id="displaySisaKasbon">Rp 0</h5>
                            </div>
                        </div>
                    </div>

                    <!-- Tombol Eksekusi Transaksi -->
                    <button type="submit" class="btn btn-success btn-lg w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" id="btnProsesTransaksi" disabled>
                        <i class="bi bi-check-circle-fill"></i> <span id="btnProsesText">Simpan Transaksi & Cetak Struk</span>
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- MODAL TAMBAH PELANGGAN CEPAT (DARI KASIR)  -->
<!-- ========================================== -->
<div class="modal fade" id="modalTambahPelangganCepat" tabindex="-1" aria-labelledby="modalTambahPelangganCepatLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content border-0 shadow">
            <form id="formTambahPelangganCepat" autocomplete="off">
                <?= csrf_field() ?>
                <input type="hidden" name="is_ajax" value="1">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="modalTambahPelangganCepatLabel"><i class="bi bi-person-plus-fill me-2"></i>Tambah Pelanggan Baru</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div id="alertPelangganCepat" class="alert alert-danger py-1 px-2 small d-none mb-2"></div>
                    <div class="mb-2">
                        <label for="cepat_nama" class="form-label fw-semibold small">Nama Pelanggan <span class="text-danger">*</span></label>
                        <input type="text" class="form-control form-control-sm" id="cepat_nama" name="nama" placeholder="Contoh: Ibu Rina, Pak Joko" required maxlength="100">
                    </div>
                    <div class="mb-2">
                        <label for="cepat_no_hp" class="form-label fw-semibold small">No. Handphone / WhatsApp</label>
                        <input type="text" class="form-control form-control-sm" id="cepat_no_hp" name="no_hp" placeholder="Contoh: 081234567890" maxlength="20">
                    </div>
                    <div class="mb-2">
                        <label for="cepat_alamat" class="form-label fw-semibold small">Alamat / Keterangan</label>
                        <textarea class="form-control form-control-sm" id="cepat_alamat" name="alamat" rows="2" placeholder="Alamat rumah / patokan"></textarea>
                    </div>
                </div>
                <div class="modal-footer bg-light py-2">
                    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-primary btn-sm" id="btnSimpanPelangganCepat"><i class="bi bi-check-lg me-1"></i> Simpan & Pilih</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 5. JAVASCRIPT LOGIKA KASIR & AJAX REALTIME -->
<!-- ========================================== -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // State Keranjang Belanja (Array di Client) & Kategori Aktif
    let keranjang = [];
    let selectedKategori = '';

    // DOM Elements
    const inputCari          = document.getElementById('inputCariBarang');
    const btnResetCari       = document.getElementById('btnResetCari');
    const produkGrid         = document.getElementById('produkGrid');
    const loadingIndicator   = document.getElementById('loadingIndicator');
    const pesanKosong        = document.getElementById('pesanKosong');
    const btnTabKategori     = document.querySelectorAll('.btn-tab-kategori');
    const keranjangBody      = document.getElementById('keranjangBody');
    const keranjangKosongRow = document.getElementById('keranjangKosongRow');
    const displayTotal       = document.getElementById('displayTotal');
    const inputUangBayar     = document.getElementById('inputUangBayar');
    const displayKembalian   = document.getElementById('displayKembalian');
    const alertKurangBayar   = document.getElementById('alertKurangBayar');
    const nominalKurang      = document.getElementById('nominalKurang');
    const btnProsesTransaksi = document.getElementById('btnProsesTransaksi');
    const btnKosongkan       = document.getElementById('btnKosongkanKeranjang');
    const inputItemsJson     = document.getElementById('inputItemsJson');
    const btnUangPas         = document.getElementById('btnUangPas');
    const btnPecahan         = document.querySelectorAll('.btn-pecahan[data-nominal]');

    // Fungsi Format Mata Uang Rupiah
    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    }

    // ==========================================
    // A. FETCH BARANG DARI KASIR_AJAX.PHP
    // ==========================================
    let searchTimeout = null;
    function muatBarang(keyword = '', kategoriId = selectedKategori) {
        loadingIndicator.classList.remove('d-none');
        produkGrid.innerHTML = '';
        pesanKosong.classList.add('d-none');

        const url = `kasir_ajax.php?aksi=cari&keyword=${encodeURIComponent(keyword)}&id_kategori=${encodeURIComponent(kategoriId)}`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                loadingIndicator.classList.add('d-none');
                if (data.status === 'success' && data.data.length > 0) {
                    renderKatalog(data.data);
                } else {
                    pesanKosong.classList.remove('d-none');
                }
            })
            .catch(err => {
                loadingIndicator.classList.add('d-none');
                console.error('Gagal mengambil data barang:', err);
            });
    }

    // Render Kartu Produk di Grid
    function renderKatalog(list) {
        produkGrid.innerHTML = '';
        list.forEach(p => {
            const col = document.createElement('div');
            col.className = 'col-sm-6 col-md-4 produk-card-col';
            col.innerHTML = `
                <div class="card h-100 p-2 border card-product" style="cursor: pointer; transition: all 0.2s;" data-id="${p.id}">
                    <div class="d-flex justify-content-between align-items-start mb-1 gap-1">
                        <span class="badge bg-light text-dark font-monospace border" style="font-size: 0.7rem;">${p.kode_barang}</span>
                        ${p.nama_kategori ? `<span class="badge bg-primary-subtle text-primary border border-primary-subtle text-truncate" style="font-size: 0.65rem; max-width: 90px;" title="${p.nama_kategori}"><i class="bi bi-tag"></i> ${p.nama_kategori}</span>` : ''}
                        <span class="badge ${p.stok <= 5 ? 'bg-warning text-dark' : 'bg-success-subtle text-success'} rounded-pill" style="font-size: 0.7rem;">Stok: ${p.stok}</span>
                    </div>
                    <div class="fw-semibold text-truncate small mb-1" title="${p.nama_barang}">${p.nama_barang}</div>
                    <div class="fw-bold text-primary small font-monospace mt-auto">${formatRupiah(p.harga_jual)} <span class="text-muted fw-normal" style="font-size: 0.75rem;">/${p.satuan}</span></div>
                </div>
            `;

            // Klik produk untuk tambah ke keranjang
            col.querySelector('.card-product').addEventListener('click', function() {
                tambahKeKeranjang(p);
            });

            produkGrid.appendChild(col);
        });
    }

    // Event Klik Tab Kategori
    btnTabKategori.forEach(btn => {
        btn.addEventListener('click', function() {
            btnTabKategori.forEach(b => {
                b.classList.remove('btn-primary', 'active');
                b.classList.add('btn-outline-secondary');
            });
            this.classList.remove('btn-outline-secondary');
            this.classList.add('btn-primary', 'active');

            selectedKategori = this.dataset.id;
            muatBarang(inputCari.value.trim(), selectedKategori);
        });
    });

    // Event input pencarian dengan debounce 300ms
    inputCari.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            muatBarang(this.value.trim(), selectedKategori);
        }, 300);
    });

    // Reset pencarian
    btnResetCari.addEventListener('click', function() {
        inputCari.value = '';
        muatBarang('', selectedKategori);
        inputCari.focus();
    });

    // ==========================================
    // B. LOGIKA MANAJEMEN KERANJANG BELANJA
    // ==========================================
    function tambahKeKeranjang(produk) {
        const index = keranjang.findIndex(item => item.id === produk.id);
        if (index !== -1) {
            // Jika sudah ada di keranjang, validasi batas stok
            if (keranjang[index].qty + 1 > produk.stok) {
                if (typeof window.posToast === 'function') {
                    window.posToast(`Stok '${produk.nama_barang}' hanya tersedia ${produk.stok} ${produk.satuan}.`, 'warning');
                } else {
                    alert(`Tidak dapat menambah! Stok '${produk.nama_barang}' hanya tersedia ${produk.stok} ${produk.satuan}.`);
                }
                return;
            }
            keranjang[index].qty += 1;
            keranjang[index].subtotal = keranjang[index].qty * keranjang[index].harga;
        } else {
            // Jika belum ada di keranjang
            if (produk.stok < 1) {
                if (typeof window.posToast === 'function') {
                    window.posToast(`Stok '${produk.nama_barang}' habis!`, 'danger');
                } else {
                    alert(`Stok '${produk.nama_barang}' habis!`);
                }
                return;
            }
            keranjang.push({
                id: produk.id,
                kode: produk.kode_barang,
                nama: produk.nama_barang,
                harga: produk.harga_jual,
                stok: produk.stok,
                satuan: produk.satuan,
                qty: 1,
                subtotal: produk.harga_jual
            });
        }
        if (typeof window.posToast === 'function') {
            window.posToast(`+ ${produk.nama_barang} masuk ke keranjang`, 'success', 1800);
        }
        renderKeranjang();
    }

    function ubahQty(id, delta) {
        const item = keranjang.find(i => i.id === id);
        if (!item) return;

        const newQty = item.qty + delta;
        if (newQty <= 0) {
            hapusItem(id);
            return;
        }
        if (newQty > item.stok) {
            alert(`Stok tidak mencukupi! Maksimum stok tersisa adalah ${item.stok} ${item.satuan}.`);
            return;
        }
        item.qty = newQty;
        item.subtotal = item.qty * item.harga;
        renderKeranjang();
    }

    function ubahQtyManual(id, newQty) {
        const item = keranjang.find(i => i.id === id);
        if (!item) return;

        let qtyVal = parseInt(newQty);
        if (isNaN(qtyVal) || qtyVal <= 0) {
            qtyVal = 1;
        }
        if (qtyVal > item.stok) {
            alert(`Stok tidak mencukupi! Maksimum stok tersisa adalah ${item.stok} ${item.satuan}.`);
            qtyVal = item.stok;
        }
        item.qty = qtyVal;
        item.subtotal = item.qty * item.harga;
        renderKeranjang();
    }

    function hapusItem(id) {
        keranjang = keranjang.filter(i => i.id !== id);
        renderKeranjang();
    }

    btnKosongkan.addEventListener('click', function() {
        if (keranjang.length === 0) return;
        if (typeof window.posConfirm === 'function') {
            window.posConfirm({
                title: 'Kosongkan Keranjang',
                message: 'Apakah Anda yakin ingin mengosongkan seluruh isi keranjang belanja?',
                confirmText: 'Ya, Kosongkan',
                confirmClass: 'btn-danger',
                onConfirm: function() {
                    keranjang = [];
                    renderKeranjang();
                    if (typeof window.posToast === 'function') {
                        window.posToast('Keranjang belanja telah dikosongkan.', 'info');
                    }
                }
            });
        } else if (confirm('Apakah Anda yakin ingin mengosongkan seluruh keranjang belanja?')) {
            keranjang = [];
            renderKeranjang();
        }
    });

    // Render Tampilan Keranjang
    function renderKeranjang() {
        keranjangBody.innerHTML = '';

        if (keranjang.length === 0) {
            keranjangBody.appendChild(keranjangKosongRow);
            displayTotal.innerText = formatRupiah(0);
            inputItemsJson.value = '[]';
            hitungPembayaran();
            return;
        }

        let total = 0;
        keranjang.forEach(item => {
            total += item.subtotal;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="fw-semibold small text-truncate" style="max-width: 130px;">${item.nama}</div>
                    <div class="text-muted font-monospace" style="font-size: 0.7rem;">@ ${formatRupiah(item.harga)}</div>
                </td>
                <td class="text-center">
                    <div class="input-group input-group-sm d-inline-flex" style="width: 90px;">
                        <button class="btn btn-outline-secondary btn-sm px-1 py-0 btn-kurang" type="button">-</button>
                        <input type="number" class="form-control form-control-sm text-center px-1 py-0 input-qty" value="${item.qty}" min="1" max="${item.stok}">
                        <button class="btn btn-outline-secondary btn-sm px-1 py-0 btn-tambah" type="button">+</button>
                    </div>
                </td>
                <td class="text-end fw-bold font-monospace small">${formatRupiah(item.subtotal)}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-link text-danger p-0 btn-hapus" title="Hapus item">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </td>
            `;

            // Event Listeners pada item baris keranjang
            tr.querySelector('.btn-kurang').addEventListener('click', () => ubahQty(item.id, -1));
            tr.querySelector('.btn-tambah').addEventListener('click', () => ubahQty(item.id, 1));
            tr.querySelector('.input-qty').addEventListener('change', (e) => ubahQtyManual(item.id, e.target.value));
            tr.querySelector('.btn-hapus').addEventListener('click', () => hapusItem(item.id));

            keranjangBody.appendChild(tr);
        });

        displayTotal.innerText = formatRupiah(total);
        inputItemsJson.value = JSON.stringify(keranjang.map(i => ({ id: i.id, qty: i.qty })));
        hitungPembayaran();
    }

    // DOM Elements Tambahan Piutang & Pelanggan
    const radioMetodeTunai   = document.getElementById('metodeTunai');
    const radioMetodePiutang = document.getElementById('metodePiutang');
    const sectionTunai       = document.getElementById('sectionTunai');
    const sectionPiutang     = document.getElementById('sectionPiutang');
    const selectPelanggan    = document.getElementById('selectPelanggan');
    const inputUangMuka      = document.getElementById('inputUangMuka');
    const displaySisaKasbon  = document.getElementById('displaySisaKasbon');
    const btnProsesText      = document.getElementById('btnProsesText');
    const formCepatPelanggan = document.getElementById('formTambahPelangganCepat');
    const alertPelangganCepat= document.getElementById('alertPelangganCepat');
    const modalCepatEl       = document.getElementById('modalTambahPelangganCepat');
    const modalCepat         = modalCepatEl ? new bootstrap.Modal(modalCepatEl) : null;

    // ==========================================
    // C. PERHITUNGAN REAL-TIME TOTAL & KEMBALIAN / PIUTANG
    // ==========================================
    function hitungPembayaran() {
        const total = keranjang.reduce((acc, curr) => acc + curr.subtotal, 0);
        const isPiutang = radioMetodePiutang && radioMetodePiutang.checked;

        if (isPiutang) {
            // Tampilan mode Piutang/Kasbon
            sectionTunai.classList.add('d-none');
            sectionPiutang.classList.remove('d-none');
            inputUangBayar.removeAttribute('required');
            selectPelanggan.setAttribute('required', 'required');
            btnProsesText.innerText = 'Simpan Transaksi Kasbon & Cetak Struk';

            const dp = window.getRawValue ? window.getRawValue(inputUangMuka) : (parseFloat(String(inputUangMuka.value).replace(/\D/g, '')) || 0);
            const sisaKasbon = Math.max(0, total - dp);
            displaySisaKasbon.innerText = formatRupiah(sisaKasbon);

            // Validasi simpan: keranjang ada barang, pelanggan dipilih, dan DP tidak melebihi total belanja
            if (total > 0 && selectPelanggan.value !== '' && dp <= total) {
                btnProsesTransaksi.removeAttribute('disabled');
            } else {
                btnProsesTransaksi.setAttribute('disabled', 'disabled');
            }
        } else {
            // Tampilan mode Tunai (Cash)
            sectionTunai.classList.remove('d-none');
            sectionPiutang.classList.add('d-none');
            inputUangBayar.setAttribute('required', 'required');
            selectPelanggan.removeAttribute('required');
            btnProsesText.innerText = 'Simpan Transaksi & Cetak Struk';

            const bayar = window.getRawValue ? window.getRawValue(inputUangBayar) : (parseFloat(String(inputUangBayar.value).replace(/\D/g, '')) || 0);

            if (total > 0 && bayar >= total) {
                const kembalian = bayar - total;
                displayKembalian.innerText = formatRupiah(kembalian);
                displayKembalian.className = 'fw-bold mb-0 font-monospace text-success';
                alertKurangBayar.classList.add('d-none');
                btnProsesTransaksi.removeAttribute('disabled');
            } else if (total > 0 && bayar < total && bayar > 0) {
                const kurang = total - bayar;
                displayKembalian.innerText = 'Rp 0';
                nominalKurang.innerText = formatRupiah(kurang);
                alertKurangBayar.classList.remove('d-none');
                btnProsesTransaksi.setAttribute('disabled', 'disabled');
            } else {
                displayKembalian.innerText = 'Rp 0';
                alertKurangBayar.classList.add('d-none');
                btnProsesTransaksi.setAttribute('disabled', 'disabled');
            }
        }
    }

    // Event listener pergantian metode pembayaran
    if (radioMetodeTunai && radioMetodePiutang) {
        radioMetodeTunai.addEventListener('change', hitungPembayaran);
        radioMetodePiutang.addEventListener('change', hitungPembayaran);
    }
    if (selectPelanggan) {
        selectPelanggan.addEventListener('change', hitungPembayaran);
    }
    if (inputUangMuka) {
        inputUangMuka.addEventListener('input', hitungPembayaran);
    }

    // Event listener input tunai
    inputUangBayar.addEventListener('input', hitungPembayaran);

    // Tombol Uang Pas
    btnUangPas.addEventListener('click', function() {
        const total = keranjang.reduce((acc, curr) => acc + curr.subtotal, 0);
        if (total > 0) {
            inputUangBayar.value = total;
            inputUangBayar.dispatchEvent(new Event('input'));
            hitungPembayaran();
        }
    });

    // Tombol Pecahan Cepat
    btnPecahan.forEach(btn => {
        btn.addEventListener('click', function() {
            const nominal = parseFloat(this.dataset.nominal);
            inputUangBayar.value = nominal;
            inputUangBayar.dispatchEvent(new Event('input'));
            hitungPembayaran();
        });
    });

    // AJAX Form Tambah Pelanggan Cepat
    if (formCepatPelanggan) {
        formCepatPelanggan.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            alertPelangganCepat.classList.add('d-none');

            fetch('../master/pelanggan.php?aksi=tambah', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(res => {
                if (res.status === 'success') {
                    // Tambahkan opsi baru ke dropdown pelanggan dan pilih otomatis
                    const opt = document.createElement('option');
                    opt.value = res.data.id;
                    opt.textContent = res.data.nama + (res.data.no_hp ? ' (' + res.data.no_hp + ')' : '');
                    opt.selected = true;
                    selectPelanggan.appendChild(opt);

                    formCepatPelanggan.reset();
                    if (modalCepat) modalCepat.hide();
                    hitungPembayaran();
                } else {
                    alertPelangganCepat.innerText = res.pesan || 'Gagal menambahkan pelanggan';
                    alertPelangganCepat.classList.remove('d-none');
                }
            })
            .catch(err => {
                alertPelangganCepat.innerText = 'Terjadi kesalahan sistem saat menyimpan data pelanggan.';
                alertPelangganCepat.classList.remove('d-none');
            });
        });
    }

    // Inisialisasi: Muat barang awal siap jual
    muatBarang('');
});
</script>

<?php
require_once __DIR__ . '/../template/footer.php';
?>
