<?php
/**
 * File: auth/cek_session.php
 * Deskripsi: Middleware untuk proteksi sesi autentikasi dan otorisasi hak akses (role)
 * Aturan: Redirect ke login jika belum terautentikasi, blokir akses jika role tidak sesuai
 */

// ==========================================
// 1. BUFFERING & INISIALISASI SESI
// ==========================================
if (!ob_get_level()) {
    ob_start();
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Menentukan Base URL jika belum didefinisikan sebelumnya
if (!defined('BASE_URL')) {
    define('BASE_URL', '/pos-kelontong/');
}

// ==========================================
// 2. FUNGSI CEK STATUS LOGIN (AUTENTIKASI)
// ==========================================
/**
 * Memeriksa apakah pengguna sudah berhasil login.
 * Jika belum, pengguna akan dialihkan ke halaman login dengan pesan peringatan.
 */
function cek_login() {
    if (!isset($_SESSION['login']) || $_SESSION['login'] !== true) {
        header("Location: " . BASE_URL . "auth/login.php?pesan=belum_login");
        exit;
    }
}

// ==========================================
// 3. FUNGSI CEK HAK AKSES PERAN (OTORISASI)
// ==========================================
/**
 * Memeriksa apakah peran (role) pengguna saat ini diizinkan mengakses halaman.
 * 
 * @param array|string $allowed_roles Daftar peran yang diizinkan, contoh: ['pemilik'] atau 'pemilik'
 */
function cek_role($allowed_roles) {
    // Pastikan pengguna sudah login terlebih dahulu
    cek_login();

    // Normalisasi parameter peran menjadi array
    if (!is_array($allowed_roles)) {
        $allowed_roles = [$allowed_roles];
    }

    // Periksa apakah role pengguna saat ini terdapat dalam daftar role yang diizinkan
    $user_role = $_SESSION['role'] ?? '';
    if (!in_array($user_role, $allowed_roles)) {
        // Jika tidak memiliki izin akses, alihkan ke dashboard dengan pemberitahuan akses ditolak
        header("Location: " . BASE_URL . "dashboard/index.php?pesan=akses_ditolak");
        exit;
    }
}

// ==========================================
// 4. FUNGSI PENGALIHAN UNTUK PENGGUNA SUDAH LOGIN
// ==========================================
/**
 * Digunakan di halaman login untuk mencegah pengguna yang sudah login mengakses kembali form login.
 */
function redirect_jika_login() {
    if (isset($_SESSION['login']) && $_SESSION['login'] === true) {
        header("Location: " . BASE_URL . "dashboard/index.php");
        exit;
    }
}

// ==========================================
// 5. KEAMANAN FORM (CSRF TOKEN)
// ==========================================
/**
 * Menghasilkan token CSRF unik dan menyimpannya di session.
 */
function get_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Menghasilkan elemen input hidden CSRF token untuk form.
 */
function csrf_field() {
    $token = get_csrf_token();
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars($token) . '">';
}

/**
 * Memvalidasi apakah CSRF token dari request POST valid.
 */
function validasi_csrf() {
    $token_post = $_POST['csrf_token'] ?? '';
    $token_sess = $_SESSION['csrf_token'] ?? '';
    if (empty($token_post) || empty($token_sess) || !hash_equals($token_sess, $token_post)) {
        return false;
    }
    return true;
}
