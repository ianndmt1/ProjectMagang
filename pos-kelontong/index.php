<?php
/**
 * File: index.php
 * Deskripsi: Gerbang masuk utama aplikasi, mengarahkan pengguna ke halaman yang sesuai
 */

// Memulai session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Cek apakah pengguna sudah login
if (isset($_SESSION['login']) && $_SESSION['login'] === true) {
    header("Location: dashboard/index.php");
} else {
    header("Location: auth/login.php");
}
exit;
?>
