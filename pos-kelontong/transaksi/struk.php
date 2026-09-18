<?php
/**
 * File: transaksi/struk.php
 * Deskripsi: Halaman tampilan dan cetak struk belanja POS Toko Kelontong
 * Hak Akses: Pengguna terautentikasi (Pemilik & Kasir)
 * Aturan: Menggunakan prepared statement, CSS @media print optimal untuk thermal printer
 */

// ==========================================
// 1. MEMUAT DEPENDENSI & VALIDASI SESI
// ==========================================
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../auth/cek_session.php';

// Pastikan pengguna sudah login
cek_login();

// Mengambil ID transaksi dari parameter URL
$id_transaksi = (int)($_GET['id'] ?? 0);

if ($id_transaksi <= 0) {
    header("Location: kasir.php");
    exit;
}

// ==========================================
// 2. MENGAMBIL DATA TRANSAKSI MASTER
// ==========================================
$query_trx = "SELECT t.*, u.nama_lengkap AS nama_kasir, 
                     pel.nama AS nama_pelanggan, pel.no_hp AS no_hp_pelanggan,
                     pt.total_piutang, pt.sisa_piutang, pt.status AS status_piutang
              FROM transaksi t 
              LEFT JOIN users u ON t.id_kasir = u.id 
              LEFT JOIN pelanggan pel ON t.id_pelanggan = pel.id 
              LEFT JOIN piutang pt ON pt.id_transaksi = t.id 
              WHERE t.id = ? 
              LIMIT 1";
$stmt_trx = mysqli_prepare($conn, $query_trx);
mysqli_stmt_bind_param($stmt_trx, "i", $id_transaksi);
mysqli_stmt_execute($stmt_trx);
$res_trx = mysqli_stmt_get_result($stmt_trx);
$trx = mysqli_fetch_assoc($res_trx);
mysqli_stmt_close($stmt_trx);

if (!$trx) {
    header("Location: kasir.php?pesan=" . urlencode("Transaksi tidak ditemukan!"));
    exit;
}

// ==========================================
// 3. MENGAMBIL RINCIAN ITEM BELANJA
// ==========================================
$query_detail = "SELECT td.*, b.satuan 
                 FROM transaksi_detail td 
                 LEFT JOIN barang b ON td.id_barang = b.id 
                 WHERE td.id_transaksi = ? 
                 ORDER BY td.id ASC";
$stmt_detail = mysqli_prepare($conn, $query_detail);
mysqli_stmt_bind_param($stmt_detail, "i", $id_transaksi);
mysqli_stmt_execute($stmt_detail);
$res_detail = mysqli_stmt_get_result($stmt_detail);
$items = [];
while ($row = mysqli_fetch_assoc($res_detail)) {
    $items[] = $row;
}
mysqli_stmt_close($stmt_detail);
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Struk Belanja #<?= htmlspecialchars($trx['kode_transaksi']) ?> - POS Toko Kelontong</title>
    <!-- Bootstrap 5.3 CSS & Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #f1f5f9;
            font-family: 'Courier New', Courier, monospace;
            color: #1e293b;
            padding: 30px 15px;
        }
        /* Desain Kertas Struk Termal */
        .struk-card {
            background: #ffffff;
            width: 380px;
            margin: 0 auto;
            padding: 24px 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            font-size: 13px;
            line-height: 1.4;
        }
        .struk-divider {
            border-top: 1px dashed #64748b;
            margin: 10px 0;
        }
        .struk-double-divider {
            border-top: 2px dashed #334155;
            margin: 10px 0;
        }
        .btn-action-container {
            max-width: 380px;
            margin: 20px auto 0;
        }

        /* ========================================== */
        /* PENGATURAN CETAK (PRINT CSS)               */
        /* ========================================== */
        @media print {
            body {
                background: none;
                padding: 0;
                margin: 0;
            }
            .struk-card {
                width: 100%;
                max-width: 80mm; /* Standar printer kasir 80mm / 58mm */
                padding: 0;
                box-shadow: none;
                border-radius: 0;
                font-size: 11px;
                color: #000;
            }
            .btn-action-container, .alert-sukses-container {
                display: none !important;
            }
        }
    </style>
</head>
<body>

<div class="container">
    <!-- Alert Notifikasi Berhasil -->
    <?php if (isset($_GET['status']) && $_GET['status'] === 'sukses'): ?>
        <div class="alert alert-success alert-dismissible fade show text-center mb-3 alert-sukses-container" style="max-width: 380px; margin: 0 auto 16px;" role="alert">
            <i class="bi bi-check-circle-fill me-1"></i> Transaksi berhasil disimpan!
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    <?php endif; ?>

    <!-- ========================================== -->
    <!-- LEMBAR STRUK BELANJA                       -->
    <!-- ========================================== -->
    <div class="struk-card">
        <!-- Header Struk -->
        <div class="text-center">
            <h5 class="fw-bold mb-0">TOKO KELONTONG</h5>
            <div style="font-size: 11px;" class="text-muted">Jl. Pasar Tradisional No. 12</div>
            <div style="font-size: 11px;" class="text-muted">Telp/WA: 0812-3456-7890</div>
        </div>

        <div class="struk-divider"></div>

        <!-- Informasi Transaksi -->
        <table class="w-100" style="font-size: 11px;">
            <tr>
                <td style="width: 75px;">No. Struk</td>
                <td>: <strong><?= htmlspecialchars($trx['kode_transaksi']) ?></strong></td>
            </tr>
            <tr>
                <td>Tanggal</td>
                <td>: <?= date('d/m/Y H:i', strtotime($trx['created_at'])) ?></td>
            </tr>
            <tr>
                <td>Kasir</td>
                <td>: <?= htmlspecialchars($trx['nama_kasir'] ?? 'Petugas Kasir') ?></td>
            </tr>
            <tr>
                <td>Metode</td>
                <td>: <span class="badge <?= ($trx['metode_pembayaran'] === 'piutang') ? 'bg-warning text-dark' : 'bg-success text-white' ?>" style="font-size: 9px;"><?= strtoupper($trx['metode_pembayaran']) ?></span></td>
            </tr>
            <?php if (!empty($trx['nama_pelanggan'])): ?>
                <tr>
                    <td>Pelanggan</td>
                    <td>: <strong><?= htmlspecialchars($trx['nama_pelanggan']) ?></strong></td>
                </tr>
            <?php endif; ?>
        </table>

        <div class="struk-divider"></div>

        <!-- Daftar Rincian Barang -->
        <table class="w-100" style="font-size: 12px;">
            <?php foreach ($items as $item): ?>
                <tr>
                    <td colspan="2" class="fw-bold"><?= htmlspecialchars($item['nama_barang']) ?></td>
                </tr>
                <tr>
                    <td class="text-muted">
                        <?= $item['jumlah'] ?> <?= htmlspecialchars($item['satuan'] ?? 'pcs') ?> &times; <?= number_format($item['harga_satuan'], 0, ',', '.') ?>
                    </td>
                    <td class="text-end fw-semibold">
                        <?= number_format($item['subtotal'], 0, ',', '.') ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </table>

        <div class="struk-double-divider"></div>

        <!-- Perhitungan Total, Bayar, Kembalian / Piutang -->
        <table class="w-100" style="font-size: 13px;">
            <tr>
                <td class="fw-bold">TOTAL BELANJA</td>
                <td class="text-end fw-bold">Rp <?= number_format($trx['total_belanja'], 0, ',', '.') ?></td>
            </tr>
            <?php if ($trx['metode_pembayaran'] === 'piutang'): ?>
                <tr>
                    <td>UANG MUKA (DP)</td>
                    <td class="text-end">Rp <?= number_format($trx['uang_bayar'], 0, ',', '.') ?></td>
                </tr>
                <tr class="fw-bold text-danger">
                    <td>SISA KASBON</td>
                    <td class="text-end">Rp <?= number_format($trx['sisa_piutang'] ?? $trx['total_belanja'], 0, ',', '.') ?></td>
                </tr>
                <tr style="font-size: 11px;">
                    <td>STATUS</td>
                    <td class="text-end fw-bold"><?= strtoupper($trx['status_piutang'] ?? 'BELUM LUNAS') ?></td>
                </tr>
            <?php else: ?>
                <tr>
                    <td>TUNAI</td>
                    <td class="text-end">Rp <?= number_format($trx['uang_bayar'], 0, ',', '.') ?></td>
                </tr>
                <tr class="fw-bold text-success">
                    <td>KEMBALIAN</td>
                    <td class="text-end">Rp <?= number_format($trx['kembalian'], 0, ',', '.') ?></td>
                </tr>
            <?php endif; ?>
        </table>

        <div class="struk-divider"></div>

        <!-- Footer Struk -->
        <div class="text-center text-muted" style="font-size: 11px;">
            <div>Terima Kasih atas Kunjungan Anda!</div>
            <div>Barang yang dibeli tidak dapat ditukar/dikembalikan</div>
        </div>
    </div>

    <!-- ========================================== -->
    <!-- TOMBOL AKSI CETAK & NAVIGASI              -->
    <!-- ========================================== -->
    <div class="btn-action-container d-grid gap-2">
        <button type="button" class="btn btn-primary btn-lg shadow-sm" onclick="window.print();">
            <i class="bi bi-printer-fill me-1"></i> Cetak Struk (Print)
        </button>
        <a href="kasir.php" class="btn btn-success">
            <i class="bi bi-cart-plus me-1"></i> Transaksi Baru
        </a>
        <a href="<?= BASE_URL ?>dashboard/index.php" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i> Kembali ke Dashboard
        </a>
    </div>
</div>

<!-- Bootstrap 5.3 JS Bundle -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
