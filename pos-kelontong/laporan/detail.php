<?php
/**
 * File: laporan/detail.php
 * Deskripsi: Halaman rincian transaksi belanja dan item dari transaksi_detail
 * Hak Akses:
 *   - Pemilik: Dapat melihat detail seluruh transaksi
 *   - Kasir: Hanya dapat melihat transaksi dirinya sendiri hari ini
 * Aturan: Menggunakan prepared statement, CSS @media print, komentar di setiap blok logika
 */

// ==========================================
// 1. BUFFERING, MEMUAT TEMPLATE & CEK AUTENTIKASI
// ==========================================
ob_start();
$page_title  = 'Detail Transaksi';
$active_menu = 'laporan';
require_once __DIR__ . '/../template/header.php';

// Validasi login
cek_login();

$user_id   = (int)$_SESSION['id'];
$user_role = $_SESSION['role'] ?? 'kasir';
$id_transaksi = (int)($_GET['id'] ?? 0);

if ($id_transaksi <= 0) {
    header("Location: index.php");
    exit;
}

// ==========================================
// 2. MENGAMBIL DATA TRANSAKSI MASTER (PREPARED STATEMENT)
// ==========================================
$query_trx = "SELECT t.*, u.nama_lengkap AS nama_kasir 
              FROM transaksi t 
              LEFT JOIN users u ON t.id_kasir = u.id 
              WHERE t.id = ? 
              LIMIT 1";
$stmt_trx = mysqli_prepare($conn, $query_trx);
mysqli_stmt_bind_param($stmt_trx, "i", $id_transaksi);
mysqli_stmt_execute($stmt_trx);
$res_trx = mysqli_stmt_get_result($stmt_trx);
$trx = mysqli_fetch_assoc($res_trx);
mysqli_stmt_close($stmt_trx);

// Validasi keberadaan transaksi
if (!$trx) {
    echo "<div class='alert alert-danger'>Transaksi dengan ID tersebut tidak ditemukan!</div>";
    require_once __DIR__ . '/../template/footer.php';
    exit;
}

// ==========================================
// 3. VALIDASI HAK AKSES PERAN KASIR
// ==========================================
// Jika pengguna adalah kasir, pastikan transaksi adalah miliknya dan terjadi hari ini
if ($user_role === 'kasir') {
    $tgl_transaksi = date('Y-m-d', strtotime($trx['created_at']));
    $hari_ini      = date('Y-m-d');

    if ((int)$trx['id_kasir'] !== $user_id || $tgl_transaksi !== $hari_ini) {
        echo "<div class='alert alert-warning py-3'>
                <i class='bi bi-shield-exclamation me-2 fs-5'></i>
                <strong>Akses Ditolak:</strong> Sebagai kasir, Anda hanya diizinkan melihat rincian transaksi yang Anda layani pada hari ini.
              </div>";
        echo "<a href='index.php' class='btn btn-outline-secondary'><i class='bi bi-arrow-left me-1'></i> Kembali ke Laporan</a>";
        require_once __DIR__ . '/../template/footer.php';
        exit;
    }
}

// ==========================================
// 4. MENGAMBIL ITEM DARI TRANSAKSI_DETAIL
// ==========================================
$query_detail = "SELECT td.*, b.kode_barang, b.satuan 
                 FROM transaksi_detail td 
                 LEFT JOIN barang b ON td.id_barang = b.id 
                 WHERE td.id_transaksi = ? 
                 ORDER BY td.id ASC";
$stmt_detail = mysqli_prepare($conn, $query_detail);
mysqli_stmt_bind_param($stmt_detail, "i", $id_transaksi);
mysqli_stmt_execute($stmt_detail);
$res_detail = mysqli_stmt_get_result($stmt_detail);

// Nama toko & data pengguna untuk kop dokumen cetak
$nama_toko = "Toko Kelontong";
$user_nama = $_SESSION['nama_lengkap'] ?? 'Petugas';
?>

<style>
/* ==========================================================================
   STYLE KHUSUS CETAK (@media print) HALAMAN DETAIL TRANSAKSI
   ==========================================================================
   Alasan & Fungsi Per Bagian:
   1. @page: Ukuran standar A4 portrait dengan margin 1.5cm.
   2. .no-print & elemen web: Menyembunyikan navbar, footer, tombol navigasi/cetak,
      serta kartu sidebar web agar tabel item dapat membentang penuh di kertas.
   3. .print-only: Menampilkan kop dokumen formal, tabel metadata transaksi, dan
      lembar tanda tangan kasir/pelanggan.
   4. table.table-print: Border tipis rapi 1px solid, font 9pt, thead berulang jika lebih
      dari 1 halaman, dan tr dicegah terpotong.
   ========================================================================== */

/* Di layar monitor biasa: Sembunyikan elemen khusus cetak */
.print-only {
    display: none !important;
}

@media print {
    /* 1. Pengaturan Halaman Cetak Kertas A4 */
    @page {
        size: A4 portrait;
        margin: 1.5cm;
    }

    /* 2. Sembunyikan Elemen Antarmuka Web */
    .navbar,
    footer,
    #modalLogout,
    .no-print,
    .btn,
    .btn-group,
    nav,
    aside {
        display: none !important;
    }

    /* 3. Tampilkan Elemen Khusus Dokumen Cetak */
    .print-only {
        display: block !important;
    }

    .print-only-row {
        display: table-row !important;
    }

    /* 4. Reset Warna Latar Belakang & Layout */
    body {
        background: #ffffff !important;
        background-color: #ffffff !important;
        color: #000000 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 10pt !important;
        margin: 0 !important;
        padding: 0 !important;
    }

    main {
        padding: 0 !important;
        margin: 0 !important;
    }

    .container, .container-fluid {
        max-width: 100% !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
    }

    .card, .card-custom {
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
    }

    .card-body {
        padding: 0 !important;
    }

    .col-lg-8 {
        width: 100% !important;
        max-width: 100% !important;
        flex: 0 0 100% !important;
    }

    .table-responsive {
        overflow: visible !important;
    }

    /* 5. Styling Tabel Transaksi Detail */
    table.table-print {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-top: 8px !important;
        font-size: 9pt !important;
        color: #000000 !important;
    }

    table.table-print th,
    table.table-print td {
        border: 1px solid #333333 !important;
        padding: 5px 8px !important;
        background-color: transparent !important;
        color: #000000 !important;
    }

    table.table-print thead th {
        background-color: #f2f2f2 !important;
        font-weight: bold !important;
        text-align: center;
        border-bottom: 2px solid #000000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    table.table-print tfoot td {
        background-color: #f9f9f9 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    thead {
        display: table-header-group;
    }

    tr {
        page-break-inside: avoid;
        break-inside: avoid;
    }

    .print-signature-area {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-top: 25px !important;
        width: 100% !important;
    }

    .text-primary, .text-success, .text-muted, .text-secondary, .text-dark {
        color: #000000 !important;
    }

    .badge {
        border: none !important;
        background: transparent !important;
        color: #000000 !important;
        padding: 0 !important;
        font-weight: normal !important;
    }

    a {
        text-decoration: none !important;
        color: #000000 !important;
    }
}
</style>

<!-- ========================================== -->
<!-- KOP & HEADER NOTA DETAIL (HANYA SAAT PRINT) -->
<!-- ========================================== -->
<div class="print-only mb-3">
    <!-- Garis Kop Toko -->
    <div style="border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 12px;">
        <table style="width: 100%;">
            <tr>
                <td style="vertical-align: middle;">
                    <h2 style="margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; font-size: 16pt;">
                        <?= htmlspecialchars($nama_toko) ?>
                    </h2>
                    <div style="font-size: 9pt; color: #444;">Sistem Informasi Penjualan & Kasir (POS)</div>
                </td>
                <td style="vertical-align: middle; text-align: right;">
                    <h3 style="margin: 0; font-weight: 800; text-transform: uppercase; font-size: 14pt; letter-spacing: 0.5px;">
                        RINCIAN TRANSAKSI PENJUALAN
                    </h3>
                    <div style="font-size: 10pt; font-family: monospace; font-weight: bold;">
                        #<?= htmlspecialchars($trx['kode_transaksi']) ?>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Metadata Informasi Transaksi -->
    <table style="width: 100%; font-size: 9pt; margin-bottom: 12px; border-collapse: collapse;">
        <tr>
            <td style="width: 16%; font-weight: bold; padding: 2px 0;">Kode Transaksi</td>
            <td style="width: 34%; font-family: monospace; font-weight: bold; padding: 2px 0;">: <?= htmlspecialchars($trx['kode_transaksi']) ?></td>
            <td style="width: 16%; font-weight: bold; padding: 2px 0;">Petugas Kasir</td>
            <td style="width: 34%; padding: 2px 0;">: <?= htmlspecialchars($trx['nama_kasir'] ?? 'Kasir') ?></td>
        </tr>
        <tr>
            <td style="font-weight: bold; padding: 2px 0;">Waktu Transaksi</td>
            <td style="padding: 2px 0;">: <?= date('d/m/Y H:i:s', strtotime($trx['created_at'])) ?> WIB</td>
            <td style="font-weight: bold; padding: 2px 0;">Status Bayar</td>
            <td style="padding: 2px 0;">: Lunas (Tunai)</td>
        </tr>
        <tr>
            <td style="font-weight: bold; padding: 2px 0;">Waktu Cetak</td>
            <td style="padding: 2px 0;">: <?= date('d/m/Y H:i') ?> WIB</td>
            <td style="font-weight: bold; padding: 2px 0;">Dicetak Oleh</td>
            <td style="padding: 2px 0;">: <?= htmlspecialchars($user_nama) ?> (<?= ucfirst($user_role) ?>)</td>
        </tr>
    </table>
</div>

<!-- Header Halaman Web (Disembunyikan Saat Print) -->
<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 btn-action-area no-print">
    <div>
        <a href="index.php" class="text-decoration-none small text-muted mb-1 d-inline-block">
            <i class="bi bi-arrow-left me-1"></i> Kembali ke Daftar Laporan
        </a>
        <h4 class="fw-bold mb-0">
            Detail Transaksi <span class="text-primary font-monospace">#<?= htmlspecialchars($trx['kode_transaksi']) ?></span>
        </h4>
    </div>
    <div class="d-flex gap-2">
        <a href="<?= BASE_URL ?>transaksi/struk.php?id=<?= $trx['id'] ?>" target="_blank" class="btn btn-outline-primary no-print">
            <i class="bi bi-receipt me-1"></i> Buka Struk Kasir
        </a>
        <button type="button" class="btn btn-primary no-print" onclick="window.print();">
            <i class="bi bi-printer me-1"></i> Cetak Detail Transaksi
        </button>
    </div>
</div>

<div class="row g-4">
    <!-- ========================================== -->
    <!-- 5. KARTU INFORMASI UTAMA TRANSAKSI (WEB)   -->
    <!-- ========================================== -->
    <div class="col-lg-4 no-print">
        <div class="card card-custom h-100">
            <div class="card-header bg-white py-3 border-bottom">
                <h6 class="mb-0 fw-semibold text-secondary"><i class="bi bi-info-circle me-2"></i>Informasi Transaksi</h6>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <span class="text-muted small d-block">Nomor Struk / Kode</span>
                    <h5 class="fw-bold font-monospace text-primary mb-0"><?= htmlspecialchars($trx['kode_transaksi']) ?></h5>
                </div>

                <div class="mb-3">
                    <span class="text-muted small d-block">Waktu Transaksi</span>
                    <span class="fw-semibold text-dark">
                        <i class="bi bi-calendar3 me-1 text-muted"></i>
                        <?= date('d F Y, H:i:s', strtotime($trx['created_at'])) ?> WIB
                    </span>
                </div>

                <div class="mb-3">
                    <span class="text-muted small d-block">Petugas Kasir</span>
                    <span class="fw-semibold text-dark">
                        <i class="bi bi-person-badge me-1 text-muted"></i>
                        <?= htmlspecialchars($trx['nama_kasir'] ?? 'Kasir') ?>
                    </span>
                </div>

                <div class="mb-3">
                    <span class="text-muted small d-block">Status Pembayaran</span>
                    <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill">
                        <i class="bi bi-check-circle me-1"></i> Lunas (Tunai)
                    </span>
                </div>

                <hr>

                <!-- Ringkasan Finansial Web -->
                <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Total Belanja</span>
                    <strong class="font-monospace">Rp <?= number_format($trx['total_belanja'], 0, ',', '.') ?></strong>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Uang Tunai (Bayar)</span>
                    <span class="font-monospace">Rp <?= number_format($trx['uang_bayar'], 0, ',', '.') ?></span>
                </div>
                <div class="d-flex justify-content-between text-success fw-bold">
                    <span>Kembalian</span>
                    <span class="font-monospace">Rp <?= number_format($trx['kembalian'], 0, ',', '.') ?></span>
                </div>
            </div>
        </div>
    </div>

    <!-- ========================================== -->
    <!-- 6. TABEL RINCIAN ITEM (TRANSAKSI_DETAIL)   -->
    <!-- ========================================== -->
    <div class="col-lg-8">
        <div class="card card-custom h-100">
            <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center no-print">
                <h6 class="mb-0 fw-semibold text-secondary"><i class="bi bi-bag-check me-2"></i>Rincian Item Belanja</h6>
                <span class="badge bg-light text-secondary border">Item dari transaksi_detail</span>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-custom table-print align-middle mb-0">
                    <thead>
                        <tr>
                            <th class="text-center" style="width: 40px;">No</th>
                            <th>Nama Barang</th>
                            <th class="text-end">Harga Satuan</th>
                            <th class="text-center" style="width: 90px;">Jumlah</th>
                            <th class="text-end">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php 
                        $no = 1;
                        $total_qty = 0;
                        while ($item = mysqli_fetch_assoc($res_detail)): 
                            $total_qty += (int)$item['jumlah'];
                        ?>
                            <tr>
                                <td class="text-center text-muted"><?= $no++ ?></td>
                                <td>
                                    <div class="fw-semibold text-dark"><?= htmlspecialchars($item['nama_barang']) ?></div>
                                    <?php if (!empty($item['kode_barang'])): ?>
                                        <small class="font-monospace text-muted"><?= htmlspecialchars($item['kode_barang']) ?></small>
                                    <?php endif; ?>
                                </td>
                                <td class="text-end font-monospace">
                                    Rp <?= number_format($item['harga_satuan'], 0, ',', '.') ?>
                                </td>
                                <td class="text-center">
                                    <?= $item['jumlah'] ?> <?= htmlspecialchars($item['satuan'] ?? 'pcs') ?>
                                </td>
                                <td class="text-end fw-bold font-monospace">
                                    Rp <?= number_format($item['subtotal'], 0, ',', '.') ?>
                                </td>
                            </tr>
                        <?php endwhile; ?>
                    </tbody>
                    <tfoot class="table-light">
                        <tr class="fw-bold">
                            <td colspan="3" class="text-end">TOTAL KESELURUHAN (<?= $total_qty ?> item):</td>
                            <td class="text-center"><?= $total_qty ?></td>
                            <td class="text-end font-monospace fs-5">
                                Rp <?= number_format($trx['total_belanja'], 0, ',', '.') ?>
                            </td>
                        </tr>
                        <!-- Baris Rincian Finansial Tambahan Khusus Print -->
                        <tr class="print-only-row">
                            <td colspan="4" class="text-end fw-semibold">Uang Tunai (Bayar):</td>
                            <td class="text-end font-monospace fw-semibold">
                                Rp <?= number_format($trx['uang_bayar'], 0, ',', '.') ?>
                            </td>
                        </tr>
                        <tr class="print-only-row">
                            <td colspan="4" class="text-end fw-bold">Kembalian:</td>
                            <td class="text-end font-monospace fw-bold">
                                Rp <?= number_format($trx['kembalian'], 0, ',', '.') ?>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- LEMBAR TANDA TANGAN (HANYA MUNCUL SAAT PRINT) -->
<!-- ========================================== -->
<div class="print-only print-signature-area">
    <table style="width: 100%; margin-top: 30px;">
        <tr>
            <td style="width: 50%; text-align: center; vertical-align: top;">
                <div style="font-size: 9.5pt;">Pelanggan / Penerima,</div>
                <div style="height: 60px;"></div>
                <div style="font-weight: bold; text-decoration: underline; font-size: 10pt;">
                    ( ........................................ )
                </div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
                <div style="font-size: 9.5pt;">Petugas Kasir,</div>
                <div style="height: 60px;"></div>
                <div style="font-weight: bold; text-decoration: underline; font-size: 10pt;">
                    <?= htmlspecialchars($trx['nama_kasir'] ?? 'Kasir') ?>
                </div>
            </td>
        </tr>
    </table>
    <div style="text-align: right; font-size: 8pt; color: #555; margin-top: 20px;">
        Dicetak otomatis melalui Aplikasi POS Toko Kelontong pada <?= date('d/m/Y H:i:s') ?> WIB
    </div>
</div>

<?php
if (isset($stmt_detail) && $stmt_detail) {
    mysqli_stmt_close($stmt_detail);
}
require_once __DIR__ . '/../template/footer.php';
?>
