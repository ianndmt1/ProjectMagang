<?php
/**
 * File: master/cek_kode_ajax.php
 * Deskripsi: Endpoint AJAX untuk memeriksa keunikan kode_barang secara real-time
 * Hak Akses: Khusus role 'pemilik'
 * Return: JSON {"exists": true|false, "kode": "..."}
 */

ob_start();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../auth/cek_session.php';

// Validasi role pemilik
if (!isset($_SESSION['login']) || $_SESSION['login'] !== true || ($_SESSION['role'] ?? '') !== 'pemilik') {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Akses ditolak. Khusus pemilik toko.',
        'exists' => false
    ]);
    exit;
}

// Ambil parameter kode_barang dan id (jika mode edit barang)
$kode_barang = strtoupper(trim($_REQUEST['kode_barang'] ?? ''));
$id_ignore   = (int)($_REQUEST['id'] ?? 0);

// Jika kode kosong, anggap tidak duplikat
if (empty($kode_barang)) {
    echo json_encode([
        'status' => 'success',
        'exists' => false,
        'message' => 'Kode kosong'
    ]);
    exit;
}

// Query SELECT COUNT(*) untuk mengecek apakah kode_barang sudah dipakai
if ($id_ignore > 0) {
    // Mode Edit: Abaikan barang yang sedang diedit
    $query = "SELECT COUNT(*) AS total FROM barang WHERE kode_barang = ? AND id != ?";
    $stmt  = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "si", $kode_barang, $id_ignore);
} else {
    // Mode Tambah: Periksa seluruh data barang
    $query = "SELECT COUNT(*) AS total FROM barang WHERE kode_barang = ?";
    $stmt  = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "s", $kode_barang);
}

mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$data   = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

$is_exists = ($data && (int)$data['total'] > 0);

echo json_encode([
    'status' => 'success',
    'exists' => $is_exists,
    'kode'   => $kode_barang
]);
exit;
