<?php
/**
 * File: template/header.php
 * Deskripsi: Header dan navigasi utama aplikasi POS Toko Kelontong
 * Aturan: Menampilkan menu sesuai peran pengguna (Pemilik / Kasir) dan menjaga konsistensi UI
 */

// ==========================================
// 1. BUFFERING, MEMASTIKAN DEPENDENSI & SESI AKTIF
// ==========================================
if (!ob_get_level()) {
    ob_start();
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../auth/cek_session.php';

// Pastikan pengguna sudah login untuk semua halaman yang memuat header ini
cek_login();

// Mengambil data sesi pengguna
$user_id       = $_SESSION['id'] ?? 0;
$user_nama     = $_SESSION['nama_lengkap'] ?? 'Pengguna';
$user_role     = $_SESSION['role'] ?? 'kasir';
$user_username = $_SESSION['username'] ?? '';

// Default title jika tidak didefinisikan
$page_title = $page_title ?? 'POS Toko Kelontong';
$active_menu = $active_menu ?? '';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($page_title) ?> - POS Kelontong</title>
    <!-- Bootstrap 5.3 CSS & Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <!-- Google Fonts: Plus Jakarta Sans -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Custom Style POS Kelontong -->
    <link rel="stylesheet" href="<?= BASE_URL ?>assets/css/style.css">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .navbar-custom {
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
            box-shadow: 0 4px 12px rgba(30, 58, 138, 0.15);
        }
        .navbar-brand {
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .nav-link {
            font-weight: 500;
            padding: 8px 14px !important;
            border-radius: 6px;
            transition: all 0.2s ease;
        }
        .nav-link:hover {
            background-color: rgba(255, 255, 255, 0.15);
        }
        .nav-link.active {
            background-color: rgba(255, 255, 255, 0.25);
            font-weight: 600;
        }
        .dropdown-item.active, .dropdown-item:active {
            background-color: #2563eb;
        }
        .card-custom {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            background: #ffffff;
        }
        .table-custom th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 600;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #cbd5e1;
        }
        .badge-role-pemilik {
            background-color: #ede9fe;
            color: #6d28d9;
            border: 1px solid #ddd6fe;
        }
        .badge-role-kasir {
            background-color: #e0f2fe;
            color: #0369a1;
            border: 1px solid #bae6fd;
        }
        .hover-profile {
            transition: all 0.2s ease;
        }
        .hover-profile:hover {
            background-color: rgba(255, 255, 255, 0.12);
        }
        main {
            flex: 1;
        }
    </style>
</head>
<body>

<!-- ========================================== -->
<!-- 2. NAVBAR UTAMA NAVIGASI APLIKASI         -->
<!-- ========================================== -->
<nav class="navbar navbar-expand-lg navbar-dark navbar-custom sticky-top">
    <div class="container">
        <!-- Logo & Nama Aplikasi -->
        <a class="navbar-brand d-flex align-items-center gap-2" href="<?= BASE_URL ?>dashboard/index.php">
            <i class="bi bi-shop fs-4"></i>
            <span>POS Kelontong</span>
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarMain">
            <!-- Menu Navigasi Sesuai Role -->
            <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
                <!-- Dashboard (Semua Role) -->
                <li class="nav-item">
                    <a class="nav-link <?= ($active_menu === 'dashboard') ? 'active' : '' ?>" href="<?= BASE_URL ?>dashboard/index.php">
                        <i class="bi bi-speedometer2 me-1"></i> Dashboard
                    </a>
                </li>

                <!-- Menu Master Data (Khusus Pemilik) -->
                <?php if ($user_role === 'pemilik'): ?>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle <?= (in_array($active_menu, ['master_pengguna', 'master_kategori', 'master_barang', 'master_pelanggan'])) ? 'active' : '' ?>" href="#" id="masterDropdown" role="button" data-bs-toggle="dropdown">
                            <i class="bi bi-folder2-open me-1"></i> Master Data
                        </a>
                        <ul class="dropdown-menu shadow-sm border-0" aria-labelledby="masterDropdown">
                            <li>
                                <a class="dropdown-item py-2 <?= ($active_menu === 'master_pengguna') ? 'active' : '' ?>" href="<?= BASE_URL ?>master/pengguna.php">
                                    <i class="bi bi-people me-2"></i> Master Pengguna
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item py-2 <?= ($active_menu === 'master_kategori') ? 'active' : '' ?>" href="<?= BASE_URL ?>master/kategori.php">
                                    <i class="bi bi-tags me-2"></i> Master Kategori
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item py-2 <?= ($active_menu === 'master_barang') ? 'active' : '' ?>" href="<?= BASE_URL ?>master/barang.php">
                                    <i class="bi bi-box-seam me-2"></i> Master Barang
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item py-2 <?= ($active_menu === 'master_pelanggan') ? 'active' : '' ?>" href="<?= BASE_URL ?>master/pelanggan.php">
                                    <i class="bi bi-person-lines-fill me-2"></i> Master Pelanggan
                                </a>
                            </li>
                        </ul>
                    </li>
                <?php else: ?>
                    <!-- Menu Pelanggan (Untuk Kasir) -->
                    <li class="nav-item">
                        <a class="nav-link <?= ($active_menu === 'master_pelanggan') ? 'active' : '' ?>" href="<?= BASE_URL ?>master/pelanggan.php">
                            <i class="bi bi-person-lines-fill me-1"></i> Data Pelanggan
                        </a>
                    </li>
                <?php endif; ?>

                <!-- Transaksi Kasir (Semua Role) -->
                <li class="nav-item">
                    <a class="nav-link <?= ($active_menu === 'transaksi') ? 'active' : '' ?>" href="<?= BASE_URL ?>transaksi/kasir.php">
                        <i class="bi bi-cart3 me-1"></i> Transaksi Kasir
                    </a>
                </li>

                <!-- Menu Piutang / Kasbon (Semua Role: Pemilik & Kasir) -->
                <li class="nav-item">
                    <a class="nav-link <?= (in_array($active_menu, ['piutang', 'piutang_bayar', 'piutang_detail'])) ? 'active' : '' ?>" href="<?= BASE_URL ?>piutang/index.php">
                        <i class="bi bi-journal-bookmark me-1"></i> Piutang / Kasbon
                    </a>
                </li>

                <!-- Laporan (Semua Role: Pemilik semua, Kasir harian) -->
                <li class="nav-item">
                    <a class="nav-link <?= ($active_menu === 'laporan') ? 'active' : '' ?>" href="<?= BASE_URL ?>laporan/index.php">
                        <i class="bi bi-file-earmark-bar-graph me-1"></i> Laporan Penjualan
                    </a>
                </li>
            </ul>

            <!-- Profil Pengguna & Tombol Logout -->
            <div class="d-flex align-items-center gap-2 mt-3 mt-lg-0 text-white">
                <a href="<?= BASE_URL ?>auth/profil.php" class="text-white text-decoration-none d-flex align-items-center gap-2 px-2 py-1 rounded hover-profile" title="Kelola Profil & Pertanyaan Keamanan">
                    <div class="text-end d-none d-sm-block">
                        <div class="fw-semibold lh-1 mb-1 text-white"><?= htmlspecialchars($user_nama) ?></div>
                        <span class="badge rounded-pill <?= ($user_role === 'pemilik') ? 'badge-role-pemilik' : 'badge-role-kasir' ?> px-2 py-1 small">
                            <?= ucfirst($user_role) ?>
                        </span>
                    </div>
                    <div class="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 32px; height: 32px;">
                        <i class="bi bi-shield-lock-fill fs-6"></i>
                    </div>
                </a>
                <!-- Tombol Pemicu Modal Logout -->
                <button type="button" class="btn btn-outline-light btn-sm px-3 rounded-pill ms-1" data-bs-toggle="modal" data-bs-target="#modalLogout">
                    <i class="bi bi-box-arrow-right me-1"></i> Keluar
                </button>
            </div>
        </div>
    </div>
</nav>

<!-- ========================================== -->
<!-- 3. MODAL KONFIRMASI LOGOUT                 -->
<!-- ========================================== -->
<div class="modal fade" id="modalLogout" tabindex="-1" aria-labelledby="modalLogoutLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 420px;">
        <div class="modal-content border-0 shadow">
            <div class="modal-header border-bottom-0 pb-0">
                <h5 class="modal-title fw-bold text-danger d-flex align-items-center gap-2" id="modalLogoutLabel">
                    <i class="bi bi-box-arrow-right fs-4"></i> Konfirmasi Logout
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body py-3">
                <p class="text-secondary mb-2">
                    Apakah Anda yakin ingin keluar dari sistem? Anda harus memasukkan kredensial login kembali untuk mengakses aplikasi.
                </p>
                <div class="p-2 rounded bg-light border small text-muted">
                    <i class="bi bi-person-circle me-1"></i> Pengguna aktif: <strong><?= htmlspecialchars($user_nama) ?></strong> 
                    <span class="badge rounded-pill <?= ($user_role === 'pemilik') ? 'badge-role-pemilik' : 'badge-role-kasir' ?> ms-1">
                        <?= ucfirst($user_role) ?>
                    </span>
                </div>
            </div>
            <div class="modal-footer border-top-0 pt-0">
                <button type="button" class="btn btn-secondary px-3" data-bs-dismiss="modal">
                    <i class="bi bi-x-lg me-1"></i> Batal
                </button>
                <a href="<?= BASE_URL ?>auth/logout.php" class="btn btn-danger px-3">
                    <i class="bi bi-box-arrow-right me-1"></i> Ya, Logout
                </a>
            </div>
        </div>
    </div>
</div>

<!-- Konten Halaman Dimulai -->
<main class="py-4">
    <div class="container">
