<?php
/**
 * File: laporan/index.php
 * Deskripsi: Halaman Laporan Penjualan Toko Kelontong
 * Hak Akses:
 *   - Pemilik: Dapat melihat semua data transaksi + filter tanggal & kasir
 *   - Kasir: Hanya dapat melihat transaksi dirinya sendiri pada hari ini (WHERE id_kasir = [login] AND DATE(created_at) = CURDATE())
 * Aturan: Menggunakan prepared statement, komentar di setiap blok logika
 */

// ==========================================
// 1. BUFFERING, MEMUAT TEMPLATE & CEK AUTENTIKASI
// ==========================================
ob_start();
$page_title  = 'Laporan Penjualan';
$active_menu = 'laporan';
require_once __DIR__ . '/../template/header.php';

// Pastikan pengguna telah login
cek_login();

$user_id   = (int)$_SESSION['id'];
$user_role = $_SESSION['role'] ?? 'kasir';

// ==========================================
// 2. FILTER & PENGAMBILAN DATA SESUAI ROLE
// ==========================================
$tgl_mulai    = trim($_GET['tgl_mulai'] ?? '');
$tgl_selesai  = trim($_GET['tgl_selesai'] ?? '');
$filter_kasir = (int)($_GET['kasir'] ?? 0);

if ($user_role === 'kasir') {
    // --- KASIR: Hanya melihat transaksi dirinya hari ini ---
    $query_trx = "SELECT t.*, u.nama_lengkap AS nama_kasir 
                  FROM transaksi t 
                  LEFT JOIN users u ON t.id_kasir = u.id 
                  WHERE t.id_kasir = ? AND DATE(t.created_at) = CURDATE() 
                  ORDER BY t.id DESC";
    $stmt_trx = mysqli_prepare($conn, $query_trx);
    mysqli_stmt_bind_param($stmt_trx, "i", $user_id);
    mysqli_stmt_execute($stmt_trx);
    $result_trx = mysqli_stmt_get_result($stmt_trx);

    // Ringkasan untuk Kasir
    $query_sum = "SELECT COUNT(*) AS total_trx, COALESCE(SUM(total_belanja), 0) AS total_omset 
                  FROM transaksi 
                  WHERE id_kasir = ? AND DATE(created_at) = CURDATE()";
    $stmt_sum = mysqli_prepare($conn, $query_sum);
    mysqli_stmt_bind_param($stmt_sum, "i", $user_id);
    mysqli_stmt_execute($stmt_sum);
    $res_sum = mysqli_stmt_get_result($stmt_sum);
    $ringkasan = mysqli_fetch_assoc($res_sum);
    mysqli_stmt_close($stmt_sum);

} else {
    // --- PEMILIK: Melihat semua transaksi dengan opsi filter tanggal & kasir ---
    $where_conditions = [];
    $params = [];
    $types  = "";

    if (!empty($tgl_mulai)) {
        $where_conditions[] = "DATE(t.created_at) >= ?";
        $params[] = $tgl_mulai;
        $types   .= "s";
    }
    if (!empty($tgl_selesai)) {
        $where_conditions[] = "DATE(t.created_at) <= ?";
        $params[] = $tgl_selesai;
        $types   .= "s";
    }
    if ($filter_kasir > 0) {
        $where_conditions[] = "t.id_kasir = ?";
        $params[] = $filter_kasir;
        $types   .= "i";
    }

    $where_sql = !empty($where_conditions) ? "WHERE " . implode(" AND ", $where_conditions) : "";

    // Query Data Transaksi
    $query_trx = "SELECT t.*, u.nama_lengkap AS nama_kasir 
                  FROM transaksi t 
                  LEFT JOIN users u ON t.id_kasir = u.id 
                  {$where_sql} 
                  ORDER BY t.id DESC";
    
    $stmt_trx = mysqli_prepare($conn, $query_trx);
    if (!empty($params)) {
        mysqli_stmt_bind_param($stmt_trx, $types, ...$params);
    }
    mysqli_stmt_execute($stmt_trx);
    $result_trx = mysqli_stmt_get_result($stmt_trx);

    // Query Ringkasan Pemilik dengan Filter yang Sama
    $query_sum = "SELECT COUNT(*) AS total_trx, COALESCE(SUM(t.total_belanja), 0) AS total_omset 
                  FROM transaksi t 
                  {$where_sql}";
    $stmt_sum = mysqli_prepare($conn, $query_sum);
    if (!empty($params)) {
        mysqli_stmt_bind_param($stmt_sum, $types, ...$params);
    }
    mysqli_stmt_execute($stmt_sum);
    $res_sum = mysqli_stmt_get_result($stmt_sum);
    $ringkasan = mysqli_fetch_assoc($res_sum);
    mysqli_stmt_close($stmt_sum);

    // Mengambil daftar kasir untuk dropdown filter
    $q_list_kasir = mysqli_query($conn, "SELECT id, nama_lengkap FROM users WHERE role = 'kasir' ORDER BY nama_lengkap ASC");
}

$total_transaksi = (int)($ringkasan['total_trx'] ?? 0);
$total_omset     = (float)($ringkasan['total_omset'] ?? 0);
$rata_rata       = ($total_transaksi > 0) ? ($total_omset / $total_transaksi) : 0;

// Nama toko & data pengguna untuk kop dokumen cetak
$nama_toko = "Toko Kelontong";
$user_nama = $_SESSION['nama_lengkap'] ?? 'Petugas';

// Format teks periode filter untuk cetak
if ($user_role === 'kasir') {
    $teks_periode = date('d F Y') . ' (Hari Ini)';
    $nama_kasir_terpilih = $user_nama;
} else {
    if (!empty($tgl_mulai) && !empty($tgl_selesai)) {
        $teks_periode = date('d/m/Y', strtotime($tgl_mulai)) . " s/d " . date('d/m/Y', strtotime($tgl_selesai));
    } elseif (!empty($tgl_mulai)) {
        $teks_periode = "Mulai " . date('d/m/Y', strtotime($tgl_mulai));
    } elseif (!empty($tgl_selesai)) {
        $teks_periode = "Sampai " . date('d/m/Y', strtotime($tgl_selesai));
    } else {
        $teks_periode = "Semua Periode";
    }

    // Nama kasir yang difilter
    $nama_kasir_terpilih = "Semua Kasir";
    if ($filter_kasir > 0) {
        $stmt_k = mysqli_prepare($conn, "SELECT nama_lengkap FROM users WHERE id = ? LIMIT 1");
        mysqli_stmt_bind_param($stmt_k, "i", $filter_kasir);
        mysqli_stmt_execute($stmt_k);
        $res_k = mysqli_stmt_get_result($stmt_k);
        if ($row_k = mysqli_fetch_assoc($res_k)) {
            $nama_kasir_terpilih = $row_k['nama_lengkap'];
        }
        mysqli_stmt_close($stmt_k);
    }
}
?>

<style>
/* ==========================================================================
   STYLE KHUSUS CETAK (@media print) HALAMAN LAPORAN PENJUALAN
   ==========================================================================
   Alasan & Fungsi Per Bagian:
   1. @page: Mengatur ukuran kertas standar A4 portrait dengan margin 1.5cm agar pas di cetakan fisik/PDF.
   2. .no-print & elemen web: Menyembunyikan navbar, tombol cetak/aksi, form filter, kartu web,
      dan footer agar tidak mengotori hasil cetak dokumen fisik.
   3. .print-only: Elemen khusus dokumen formal (Kop Laporan, Ringkasan Baris, Lembar Tanda Tangan)
      hanya dimunculkan saat print (di layar biasa disembunyikan).
   4. Reset layout: Menghilangkan border shadow card, background abu-abu, dan padding berlebih
      agar dokumen bersih dan hemat tinta.
   5. table.table-print: Mengatur border tabel tipis solid, header tebal yang berulang di setiap halaman
      (display: table-header-group), serta mencegah baris terpotong (page-break-inside: avoid).
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

    /* 2. Sembunyikan Elemen Antarmuka Website yang Tidak Perlu di Kertas */
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

    /* 4. Reset Layout & Warna Latar Belakang */
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

    /* Hilangkan gaya kartu web agar menyatu sebagai lembaran kertas */
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

    .table-responsive {
        overflow: visible !important;
    }

    /* 5. Styling Tabel Laporan */
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

    /* Pastikan header tabel berulang jika dokumen melebihi 1 halaman */
    thead {
        display: table-header-group;
    }

    /* Mencegah baris transaksi terbelah di tengah pemotongan halaman */
    tr {
        page-break-inside: avoid;
        break-inside: avoid;
    }

    /* 6. Ringkasan Baris Ringkas */
    .print-summary-box {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-bottom: 12px !important;
    }

    .print-summary-box td {
        border: 1px solid #333333 !important;
        padding: 6px 10px !important;
        font-size: 9.5pt !important;
    }

    /* 7. Format Lembar Tanda Tangan */
    .print-signature-area {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-top: 25px !important;
        width: 100% !important;
    }

    /* Netralkan warna teks agar hitam tajam saat diprint */
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
<!-- KOP & HEADER LAPORAN (HANYA MUNCUL SAAT CETAK) -->
<!-- ========================================== -->
<div class="print-only mb-3">
    <!-- Garis Kop Instansi / Toko -->
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
                        LAPORAN PENJUALAN
                    </h3>
                    <div style="font-size: 9pt; font-weight: 600;">
                        Periode: <?= htmlspecialchars($teks_periode) ?>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Metadata Informasi Dokumen -->
    <table style="width: 100%; font-size: 9pt; margin-bottom: 10px;">
        <tr>
            <td style="width: 14%; font-weight: bold;">Periode</td>
            <td style="width: 36%;">: <?= htmlspecialchars($teks_periode) ?></td>
            <td style="width: 18%; font-weight: bold;">Dicetak Oleh</td>
            <td style="width: 32%;">: <?= htmlspecialchars($user_nama) ?> (<?= ucfirst($user_role) ?>)</td>
        </tr>
        <tr>
            <td style="font-weight: bold;">Filter Kasir</td>
            <td>: <?= htmlspecialchars($nama_kasir_terpilih) ?></td>
            <td style="font-weight: bold;">Waktu Cetak</td>
            <td>: <?= date('d/m/Y H:i') ?> WIB</td>
        </tr>
    </table>

    <!-- Ringkasan Statistik Laporan dalam Baris Ringkas -->
    <table class="print-summary-box">
        <tr>
            <td style="width: 33.3%; text-align: center;">
                <span style="font-size: 8pt; text-transform: uppercase; color: #444; display: block;">Total Transaksi</span>
                <strong><?= number_format($total_transaksi, 0, ',', '.') ?> Struk</strong>
            </td>
            <td style="width: 33.3%; text-align: center;">
                <span style="font-size: 8pt; text-transform: uppercase; color: #444; display: block;">Total Penerimaan (Omset)</span>
                <strong>Rp <?= number_format($total_omset, 0, ',', '.') ?></strong>
            </td>
            <td style="width: 33.3%; text-align: center;">
                <span style="font-size: 8pt; text-transform: uppercase; color: #444; display: block;">Rata-Rata per Transaksi</span>
                <strong>Rp <?= number_format($rata_rata, 0, ',', '.') ?></strong>
            </td>
        </tr>
    </table>
</div>

<!-- ========================================== -->
<!-- HEADER HALAMAN WEB (DISEMBUNYIKAN SAAT CETAK) -->
<!-- ========================================== -->
<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 no-print">
    <div>
        <h4 class="fw-bold mb-1">
            <i class="bi bi-file-earmark-bar-graph me-2 text-primary"></i>
            <?= ($user_role === 'pemilik') ? 'Laporan Rekapitulasi Penjualan' : 'Laporan Penjualan Kasir Hari Ini' ?>
        </h4>
        <p class="text-muted small mb-0">
            <?= ($user_role === 'pemilik') 
                ? 'Pantau riwayat penjualan, omzet toko, dan rincian transaksi per periode' 
                : 'Rekapitulasi penjualan yang Anda layani pada shift tanggal ' . date('d F Y') ?>
        </p>
    </div>
    <div>
        <!-- Tombol Cetak dengan class no-print agar tidak ikut tercetak -->
        <button type="button" class="btn btn-primary d-inline-flex align-items-center gap-2 no-print" onclick="window.print();">
            <i class="bi bi-printer"></i> Cetak Laporan
        </button>
    </div>
</div>

<!-- ========================================== -->
<!-- 3. KARTU RINGKASAN STATISTIK LAPORAN (WEB)  -->
<!-- ========================================== -->
<div class="row g-3 mb-4 no-print">
    <div class="col-md-4">
        <div class="card card-custom p-3 border-start border-4 border-primary">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold text-uppercase">Total Transaksi</span>
                    <h3 class="fw-bold mb-0 mt-1"><?= number_format($total_transaksi, 0, ',', '.') ?></h3>
                    <small class="text-muted">Struk belanja berhasil</small>
                </div>
                <div class="bg-primary-subtle text-primary p-3 rounded-circle fs-3">
                    <i class="bi bi-receipt"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card card-custom p-3 border-start border-4 border-success">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold text-uppercase">Total Penerimaan (Omset)</span>
                    <h3 class="fw-bold mb-0 mt-1 text-success">Rp <?= number_format($total_omset, 0, ',', '.') ?></h3>
                    <small class="text-muted">Total nilai penjualan</small>
                </div>
                <div class="bg-success-subtle text-success p-3 rounded-circle fs-3">
                    <i class="bi bi-cash-stack"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card card-custom p-3 border-start border-4 border-info">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold text-uppercase">Rata-Rata per Transaksi</span>
                    <h3 class="fw-bold mb-0 mt-1">Rp <?= number_format($rata_rata, 0, ',', '.') ?></h3>
                    <small class="text-muted">Nilai rata-rata keranjang belanja</small>
                </div>
                <div class="bg-info-subtle text-info p-3 rounded-circle fs-3">
                    <i class="bi bi-graph-up-arrow"></i>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 4. FORM FILTER (KHUSUS PEMILIK - WEB)      -->
<!-- ========================================== -->
<?php if ($user_role === 'pemilik'): ?>
    <div class="card card-custom mb-4 no-print">
        <div class="card-header bg-white py-3 border-bottom">
            <h6 class="mb-0 fw-semibold text-secondary"><i class="bi bi-funnel me-2"></i>Filter Rentang Waktu & Kasir</h6>
        </div>
        <div class="card-body">
            <form action="" method="GET" class="row g-3 align-items-end">
                <div class="col-md-3">
                    <label for="tgl_mulai" class="form-label small fw-semibold text-muted">Tanggal Mulai</label>
                    <input type="date" class="form-control" id="tgl_mulai" name="tgl_mulai" value="<?= htmlspecialchars($tgl_mulai) ?>">
                </div>
                <div class="col-md-3">
                    <label for="tgl_selesai" class="form-label small fw-semibold text-muted">Tanggal Selesai</label>
                    <input type="date" class="form-control" id="tgl_selesai" name="tgl_selesai" value="<?= htmlspecialchars($tgl_selesai) ?>">
                </div>
                <div class="col-md-3">
                    <label for="kasir" class="form-label small fw-semibold text-muted">Petugas Kasir</label>
                    <select class="form-select" id="kasir" name="kasir">
                        <option value="0">-- Semua Kasir --</option>
                        <?php if ($q_list_kasir): ?>
                            <?php while ($k = mysqli_fetch_assoc($q_list_kasir)): ?>
                                <option value="<?= $k['id'] ?>" <?= ($filter_kasir === (int)$k['id']) ? 'selected' : '' ?>>
                                    <?= htmlspecialchars($k['nama_lengkap']) ?>
                                </option>
                            <?php endwhile; ?>
                        <?php endif; ?>
                    </select>
                </div>
                <div class="col-md-3 d-flex gap-2">
                    <button type="submit" class="btn btn-primary flex-fill">
                        <i class="bi bi-search me-1"></i> Terapkan
                    </button>
                    <?php if (!empty($tgl_mulai) || !empty($tgl_selesai) || $filter_kasir > 0): ?>
                        <a href="index.php" class="btn btn-outline-danger" title="Reset Filter">
                            <i class="bi bi-arrow-counterclockwise"></i> Reset
                        </a>
                    <?php endif; ?>
                </div>
            </form>
        </div>
    </div>
<?php endif; ?>

<!-- ========================================== -->
<!-- 5. TABEL DAFTAR TRANSAKSI                  -->
<!-- ========================================== -->
<div class="card card-custom">
    <!-- Header Card Web (Disembunyikan Saat Print) -->
    <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center no-print">
        <h6 class="mb-0 fw-semibold text-secondary"><i class="bi bi-list-check me-2"></i>Daftar Riwayat Transaksi</h6>
        <span class="badge bg-light text-dark border">
            Menampilkan <?= $total_transaksi ?> transaksi
        </span>
    </div>
    <div class="table-responsive">
        <table class="table table-hover table-custom table-print align-middle mb-0">
            <thead>
                <tr>
                    <th class="text-center" style="width: 45px;">No</th>
                    <th>Kode Transaksi</th>
                    <th>Waktu Transaksi</th>
                    <?php if ($user_role === 'pemilik'): ?>
                        <th>Nama Kasir</th>
                    <?php endif; ?>
                    <th class="text-end">Total Belanja</th>
                    <th class="text-end">Uang Bayar</th>
                    <th class="text-end">Kembalian</th>
                    <th class="text-center no-print" style="width: 130px;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $no = 1;
                $has_data = false;
                if ($result_trx):
                    while ($trx = mysqli_fetch_assoc($result_trx)): 
                        $has_data = true;
                ?>
                    <tr>
                        <td class="text-center text-muted"><?= $no++ ?></td>
                        <td>
                            <a href="detail.php?id=<?= $trx['id'] ?>" class="font-monospace fw-bold text-decoration-none text-primary">
                                <?= htmlspecialchars($trx['kode_transaksi']) ?>
                            </a>
                        </td>
                        <td>
                            <div class="fw-semibold small"><?= date('d/m/Y', strtotime($trx['created_at'])) ?></div>
                            <small class="text-muted"><?= date('H:i', strtotime($trx['created_at'])) ?> WIB</small>
                        </td>
                        <?php if ($user_role === 'pemilik'): ?>
                            <td>
                                <?= htmlspecialchars($trx['nama_kasir'] ?? 'Kasir') ?>
                            </td>
                        <?php endif; ?>
                        <td class="text-end fw-bold font-monospace">
                            Rp <?= number_format($trx['total_belanja'], 0, ',', '.') ?>
                        </td>
                        <td class="text-end font-monospace">
                            Rp <?= number_format($trx['uang_bayar'], 0, ',', '.') ?>
                        </td>
                        <td class="text-end font-monospace">
                            Rp <?= number_format($trx['kembalian'], 0, ',', '.') ?>
                        </td>
                        <!-- Kolom Tombol Aksi Web (Disembunyikan Saat Print) -->
                        <td class="text-center no-print">
                            <div class="btn-group btn-group-sm">
                                <a href="detail.php?id=<?= $trx['id'] ?>" class="btn btn-outline-primary" title="Lihat Rincian Item">
                                    <i class="bi bi-eye"></i> Detail
                                </a>
                                <a href="<?= BASE_URL ?>transaksi/struk.php?id=<?= $trx['id'] ?>" class="btn btn-outline-secondary" target="_blank" title="Cetak Struk">
                                    <i class="bi bi-printer"></i>
                                </a>
                            </div>
                        </td>
                    </tr>
                <?php 
                    endwhile;
                endif;
                if (!$has_data): 
                ?>
                    <tr>
                        <td colspan="<?= ($user_role === 'pemilik') ? 8 : 7 ?>" class="text-center py-5 text-muted">
                            <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                            Tidak ada data transaksi yang sesuai dengan kriteria.
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ========================================== -->
<!-- LEMBAR TANDA TANGAN (HANYA MUNCUL SAAT PRINT) -->
<!-- ========================================== -->
<div class="print-only print-signature-area">
    <table style="width: 100%; margin-top: 25px;">
        <tr>
            <td style="width: 50%; text-align: center; vertical-align: top;">
                <div style="font-size: 9.5pt;">Petugas Kasir,</div>
                <div style="height: 60px;"></div>
                <div style="font-weight: bold; text-decoration: underline; font-size: 10pt;">
                    <?= ($user_role === 'kasir') ? htmlspecialchars($user_nama) : '( ........................................ )' ?>
                </div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
                <div style="font-size: 9.5pt;">Mengetahui,<br><strong>Pemilik Toko</strong></div>
                <div style="height: 45px;"></div>
                <div style="font-weight: bold; text-decoration: underline; font-size: 10pt;">
                    <?= ($user_role === 'pemilik') ? htmlspecialchars($user_nama) : '( ........................................ )' ?>
                </div>
            </td>
        </tr>
    </table>
    <div style="text-align: right; font-size: 8pt; color: #555; margin-top: 20px;">
        Dicetak otomatis melalui Aplikasi POS Toko Kelontong pada <?= date('d/m/Y H:i:s') ?> WIB
    </div>
</div>

<?php
if (isset($stmt_trx) && $stmt_trx) {
    mysqli_stmt_close($stmt_trx);
}
require_once __DIR__ . '/../template/footer.php';
?>
