<?php
/**
 * File: master/pengguna_proses.php
 * Deskripsi: Pemrosesan data CRUD Pengguna (Tambah, Edit, Hapus)
 * Aturan: Hanya role 'pemilik', semua query menggunakan prepared statement, password di-hash, pencegahan hapus akun sendiri
 */

// ==========================================
// 1. BUFFERING, SESI & VALIDASI HAK AKSES
// ==========================================
ob_start();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../auth/cek_session.php';

// Hak akses khusus Pemilik
cek_role('pemilik');

// Menangkap aksi dari parameter GET atau POST
$aksi = $_REQUEST['aksi'] ?? '';

// Validasi CSRF Token untuk request POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !validasi_csrf()) {
    header("Location: pengguna.php?status=error&pesan=" . urlencode("Token keamanan CSRF tidak valid atau sesi telah kedaluwarsa!"));
    exit;
}

// ==========================================
// 2. PROSES TAMBAH PENGGUNA
// ==========================================
if ($aksi === 'tambah' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $username     = trim($_POST['username'] ?? '');
    $nama_lengkap = trim($_POST['nama_lengkap'] ?? '');
    $password     = trim($_POST['password'] ?? '');
    $role         = trim($_POST['role'] ?? 'kasir');

    // Validasi input wajib
    if (empty($username) || empty($nama_lengkap) || empty($password) || !in_array($role, ['pemilik', 'kasir'])) {
        header("Location: pengguna.php?status=error&pesan=" . urlencode("Semua kolom wajib diisi dengan benar!"));
        exit;
    }

    // Periksa keunikan username dengan Prepared Statement
    $stmt_cek = mysqli_prepare($conn, "SELECT id FROM users WHERE username = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt_cek, "s", $username);
    mysqli_stmt_execute($stmt_cek);
    mysqli_stmt_store_result($stmt_cek);

    if (mysqli_stmt_num_rows($stmt_cek) > 0) {
        mysqli_stmt_close($stmt_cek);
        header("Location: pengguna.php?status=error&pesan=" . urlencode("Username '{$username}' sudah digunakan!"));
        exit;
    }
    mysqli_stmt_close($stmt_cek);

    // Hash password sebelum disimpan ke database
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // Proses pertanyaan dan jawaban keamanan jika diisi
    $pertanyaan_keamanan = trim($_POST['pertanyaan_keamanan'] ?? '');
    if ($pertanyaan_keamanan === 'custom') {
        $pertanyaan_keamanan = trim($_POST['pertanyaan_keamanan_custom'] ?? '');
    }
    $jawaban_keamanan = trim($_POST['jawaban_keamanan'] ?? '');

    $pertanyaan_final = null;
    $jawaban_hash     = null;
    if (!empty($pertanyaan_keamanan) && !empty($jawaban_keamanan)) {
        $pertanyaan_final = $pertanyaan_keamanan;
        // Simpan jawaban dalam bentuk hash (case-insensitive)
        $jawaban_hash     = password_hash(strtolower($jawaban_keamanan), PASSWORD_DEFAULT);
    }

    // Insert pengguna baru dengan Prepared Statement
    $query_insert = "INSERT INTO users (username, password, nama_lengkap, role, pertanyaan_keamanan, jawaban_keamanan) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt_insert = mysqli_prepare($conn, $query_insert);
    mysqli_stmt_bind_param($stmt_insert, "ssssss", $username, $password_hash, $nama_lengkap, $role, $pertanyaan_final, $jawaban_hash);

    if (mysqli_stmt_execute($stmt_insert)) {
        mysqli_stmt_close($stmt_insert);
        header("Location: pengguna.php?status=sukses&pesan=" . urlencode("Pengguna baru berhasil ditambahkan."));
    } else {
        mysqli_stmt_close($stmt_insert);
        header("Location: pengguna.php?status=error&pesan=" . urlencode("Gagal menambahkan pengguna!"));
    }
    exit;
}

// ==========================================
// 3. PROSES EDIT PENGGUNA
// ==========================================
elseif ($aksi === 'edit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id           = (int)($_POST['id'] ?? 0);
    $username     = trim($_POST['username'] ?? '');
    $nama_lengkap = trim($_POST['nama_lengkap'] ?? '');
    $password     = trim($_POST['password'] ?? '');
    $role         = trim($_POST['role'] ?? 'kasir');

    // Validasi data masukan
    if ($id <= 0 || empty($username) || empty($nama_lengkap) || !in_array($role, ['pemilik', 'kasir'])) {
        header("Location: pengguna.php?status=error&pesan=" . urlencode("Data pengguna tidak valid!"));
        exit;
    }

    // Periksa apakah username sudah dipakai pengguna lain
    $stmt_cek = mysqli_prepare($conn, "SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1");
    mysqli_stmt_bind_param($stmt_cek, "si", $username, $id);
    mysqli_stmt_execute($stmt_cek);
    mysqli_stmt_store_result($stmt_cek);

    if (mysqli_stmt_num_rows($stmt_cek) > 0) {
        mysqli_stmt_close($stmt_cek);
        header("Location: pengguna.php?status=error&pesan=" . urlencode("Username '{$username}' sudah dipakai oleh pengguna lain!"));
        exit;
    }
    mysqli_stmt_close($stmt_cek);

    // Pertanyaan & Jawaban Keamanan
    $pertanyaan_keamanan = trim($_POST['pertanyaan_keamanan'] ?? '');
    if ($pertanyaan_keamanan === 'custom') {
        $pertanyaan_keamanan = trim($_POST['pertanyaan_keamanan_custom'] ?? '');
    }
    $jawaban_keamanan = trim($_POST['jawaban_keamanan'] ?? '');

    // Membangun query update secara dinamis
    $fields = ["username = ?", "nama_lengkap = ?", "role = ?"];
    $types  = "sss";
    $params = [$username, $nama_lengkap, $role];

    if (!empty($password)) {
        $fields[] = "password = ?";
        $types   .= "s";
        $params[] = password_hash($password, PASSWORD_DEFAULT);
    }

    if (!empty($pertanyaan_keamanan)) {
        $fields[] = "pertanyaan_keamanan = ?";
        $types   .= "s";
        $params[] = $pertanyaan_keamanan;
    }

    if (!empty($jawaban_keamanan)) {
        $fields[] = "jawaban_keamanan = ?";
        $types   .= "s";
        // Disimpan dalam bentuk hash (case-insensitive)
        $params[] = password_hash(strtolower($jawaban_keamanan), PASSWORD_DEFAULT);
    }

    $fields_sql   = implode(", ", $fields);
    $query_update = "UPDATE users SET {$fields_sql} WHERE id = ?";
    $types       .= "i";
    $params[]     = $id;

    $stmt_update = mysqli_prepare($conn, $query_update);
    mysqli_stmt_bind_param($stmt_update, $types, ...$params);

    if (mysqli_stmt_execute($stmt_update)) {
        // Jika akun yang diedit adalah akun pemilik yang sedang login, perbarui session aktif
        if ($id === (int)$_SESSION['id']) {
            $_SESSION['username'] = $username;
            $_SESSION['nama_lengkap'] = $nama_lengkap;
            $_SESSION['role'] = $role;
        }

        mysqli_stmt_close($stmt_update);
        header("Location: pengguna.php?status=sukses&pesan=" . urlencode("Data pengguna berhasil diperbarui."));
    } else {
        mysqli_stmt_close($stmt_update);
        header("Location: pengguna.php?status=error&pesan=" . urlencode("Gagal memperbarui data pengguna!"));
    }
    exit;
}

// ==========================================
// 4. PROSES HAPUS PENGGUNA
// ==========================================
elseif ($aksi === 'hapus') {
    $id = (int)($_GET['id'] ?? 0);

    if ($id <= 0) {
        header("Location: pengguna.php?status=error&pesan=" . urlencode("ID pengguna tidak valid!"));
        exit;
    }

    // Aturan Wajib: Cegah menghapus akun sendiri yang sedang aktif
    if ($id === (int)$_SESSION['id']) {
        header("Location: pengguna.php?status=error&pesan=" . urlencode("Aksi ditolak: Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif login!"));
        exit;
    }

    // Hapus data pengguna dengan Prepared Statement
    $stmt_hapus = mysqli_prepare($conn, "DELETE FROM users WHERE id = ?");
    mysqli_stmt_bind_param($stmt_hapus, "i", $id);

    if (mysqli_stmt_execute($stmt_hapus)) {
        mysqli_stmt_close($stmt_hapus);
        header("Location: pengguna.php?status=sukses&pesan=" . urlencode("Pengguna berhasil dihapus."));
    } else {
        mysqli_stmt_close($stmt_hapus);
        header("Location: pengguna.php?status=error&pesan=" . urlencode("Gagal menghapus pengguna!"));
    }
    exit;
}

// Jika aksi tidak sesuai
header("Location: pengguna.php");
exit;
