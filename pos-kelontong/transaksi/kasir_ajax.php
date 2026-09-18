<?php
/**
 * File: transaksi/kasir_ajax.php
 * Deskripsi: Endpoint AJAX untuk pencarian barang dan pengecekan stok secara real-time
 * Hak Akses: Pengguna terautentikasi (Pemilik & Kasir)
 * Aturan: Mengembalikan format JSON, prepared statement, komentar di setiap blok logika
 */

// ==========================================
// 1. HEADER JSON & DEPENDENSI
// ==========================================
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../auth/cek_session.php';

// Validasi autentikasi
if (!isset($_SESSION['login']) || $_SESSION['login'] !== true) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'pesan' => 'Sesi login telah berakhir!']);
    exit;
}

// ==========================================
// 2. MENANGKAP PARAMETER AKSI
// ==========================================
$aksi = $_GET['aksi'] ?? 'cari';

// ==========================================
// 3. PENCARIAN BARANG & FILTER KATEGORI (AJAX SEARCH)
// ==========================================
if ($aksi === 'cari') {
    $keyword     = trim($_GET['keyword'] ?? '');
    $id_kategori = isset($_GET['id_kategori']) && $_GET['id_kategori'] !== '' ? (int)$_GET['id_kategori'] : 0;

    $where_clauses = [];
    $params = [];
    $param_types = '';

    // Filter keyword jika ada (kode barang atau nama barang)
    if (!empty($keyword)) {
        $where_clauses[] = "(b.kode_barang LIKE ? OR b.nama_barang LIKE ?)";
        $param_like = "%{$keyword}%";
        $params[] = $param_like;
        $params[] = $param_like;
        $param_types .= 'ss';
    }

    // Filter berdasarkan id_kategori jika dipilih (> 0)
    if ($id_kategori > 0) {
        $where_clauses[] = "b.id_kategori = ?";
        $params[] = $id_kategori;
        $param_types .= 'i';
    }

    // Jika tanpa kata kunci dan tanpa kategori, utamakan barang siap jual (stok > 0)
    if (empty($keyword) && $id_kategori <= 0) {
        $where_clauses[] = "b.stok > 0";
    }

    $where_sql = !empty($where_clauses) ? "WHERE " . implode(" AND ", $where_clauses) : "";

    // Query data barang beserta nama kategori (LEFT JOIN)
    if (!empty($keyword)) {
        $query = "SELECT b.id, b.kode_barang, b.id_kategori, b.nama_barang, b.harga_jual, b.stok, b.satuan, k.nama_kategori 
                  FROM barang b 
                  LEFT JOIN kategori k ON b.id_kategori = k.id 
                  {$where_sql} 
                  ORDER BY (CASE WHEN b.kode_barang = ? THEN 1 WHEN b.nama_barang LIKE ? THEN 2 ELSE 3 END), b.nama_barang ASC 
                  LIMIT 25";
        
        $exact_code = $keyword;
        $start_name = "{$keyword}%";
        $params[] = $exact_code;
        $params[] = $start_name;
        $param_types .= 'ss';
    } else {
        $query = "SELECT b.id, b.kode_barang, b.id_kategori, b.nama_barang, b.harga_jual, b.stok, b.satuan, k.nama_kategori 
                  FROM barang b 
                  LEFT JOIN kategori k ON b.id_kategori = k.id 
                  {$where_sql} 
                  ORDER BY b.nama_barang ASC 
                  LIMIT 25";
    }

    if (!empty($params)) {
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, $param_types, ...$params);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
    } else {
        $result = mysqli_query($conn, $query);
    }

    $barang_list = [];
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $barang_list[] = [
                'id'            => (int)$row['id'],
                'kode_barang'   => $row['kode_barang'],
                'id_kategori'   => (int)($row['id_kategori'] ?? 0),
                'nama_kategori' => $row['nama_kategori'] ?? '',
                'nama_barang'   => $row['nama_barang'],
                'harga_jual'    => (float)$row['harga_jual'],
                'stok'          => (int)$row['stok'],
                'satuan'        => $row['satuan'] ?? 'pcs'
            ];
        }
    }

    if (isset($stmt) && $stmt) {
        mysqli_stmt_close($stmt);
    }

    echo json_encode([
        'status' => 'success',
        'data'   => $barang_list
    ]);
    exit;
}

// ==========================================
// 4. CEK STOK SPESIFIK BARANG
// ==========================================
elseif ($aksi === 'cek_stok') {
    $id_barang = (int)($_GET['id'] ?? 0);

    if ($id_barang <= 0) {
        echo json_encode(['status' => 'error', 'pesan' => 'ID barang tidak valid!']);
        exit;
    }

    $stmt = mysqli_prepare($conn, "SELECT stok, nama_barang FROM barang WHERE id = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, "i", $id_barang);
    mysqli_stmt_execute($stmt);
    $res = mysqli_stmt_get_result($stmt);
    $barang = mysqli_fetch_assoc($res);
    mysqli_stmt_close($stmt);

    if ($barang) {
        echo json_encode([
            'status'      => 'success',
            'stok'        => (int)$barang['stok'],
            'nama_barang' => $barang['nama_barang']
        ]);
    } else {
        echo json_encode(['status' => 'error', 'pesan' => 'Barang tidak ditemukan!']);
    }
    exit;
}

// Respon jika aksi tidak dikenali
echo json_encode(['status' => 'error', 'pesan' => 'Aksi tidak valid!']);
exit;
?>
