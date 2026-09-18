<?php
/**
 * File: config/database.php
 * Deskripsi: Konfigurasi koneksi database terpusat menggunakan MySQLi
 * Aturan: Semua query menggunakan prepared statement dan penanganan error yang tepat.
 */

// ==========================================
// 1. PENGATURAN KONEKSI DATABASE & KONSTANTA
// ==========================================
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'pos_kelontong';
$db_port = 3306;

// Menentukan Base URL aplikasi untuk kemudahan navigasi dan redirect
if (!defined('BASE_URL')) {
    define('BASE_URL', '/pos-kelontong/');
}

// ==========================================
// 2. INISIALISASI KONEKSI DENGAN MYSQLI
// ==========================================
$conn = mysqli_connect($db_host, $db_user, $db_pass, $db_name, $db_port);

// ==========================================
// 3. VALIDASI DAN PENANGANAN ERROR KONEKSI
// ==========================================
if (!$conn) {
    // Jika koneksi gagal, hentikan eksekusi dan tampilkan pesan error
    die("Koneksi ke database gagal: " . mysqli_connect_error());
}

// ==========================================
// 4. PENGATURAN CHARSET UTF-8
// ==========================================
// Mengatur karakter encoding ke utf8mb4 agar mendukung berbagai format karakter
mysqli_set_charset($conn, "utf8mb4");
