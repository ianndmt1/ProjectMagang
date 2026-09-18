<?php
/**
 * File: auth/logout.php
 * Deskripsi: Menghancurkan session pengguna dan mengalihkan ke halaman login
 * Aturan: Menghapus semua variabel sesi dan cookie sesi secara aman
 */

// ==========================================
// 1. BUFFERING & MEMULAI SESI SEBELUM DIHANCURKAN
// ==========================================
ob_start();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Menentukan Base URL jika belum ada
if (!defined('BASE_URL')) {
    define('BASE_URL', '/pos-kelontong/');
}

// ==========================================
// 2. MENGOSONGKAN SELURUH VARIABEL SESI
// ==========================================
$_SESSION = [];

// ==========================================
// 3. MENGHAPUS COOKIE SESI (JIKA TERSEDIA)
// ==========================================
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// ==========================================
// 4. MENGHANCURKAN DATA SESI DARI SERVER
// ==========================================
session_destroy();

// ==========================================
// 5. MENGALIHKAN PENGGUNA KE HALAMAN LOGIN
// ==========================================
header("Location: " . BASE_URL . "auth/login.php?pesan=logout");
exit;
