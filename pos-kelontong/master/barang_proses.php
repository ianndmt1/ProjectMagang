<?php
/**
 * File: master/barang_proses.php
 * Deskripsi: Pemrosesan data CRUD Barang (Tambah, Edit, Hapus)
 * Aturan: Khusus role 'pemilik', prepared statement, validasi kode unik, cegah hapus barang yang sudah bertransaksi
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
$aksi = $_REQUEST['aksi'] ?? ($_REQUEST['action'] ?? '');

// Endpoint AJAX: Cek Keunikan Kode Barang (Real-time)
if ($aksi === 'cek_kode') {
    header('Content-Type: application/json; charset=utf-8');
    $kode_barang = strtoupper(trim($_REQUEST['kode_barang'] ?? ''));
    $id_ignore   = (int)($_REQUEST['id'] ?? 0);

    if (empty($kode_barang)) {
        echo json_encode(['status' => 'success', 'exists' => false, 'message' => 'Kode kosong']);
        exit;
    }

    if ($id_ignore > 0) {
        $stmt = mysqli_prepare($conn, "SELECT COUNT(*) AS total FROM barang WHERE kode_barang = ? AND id != ?");
        mysqli_stmt_bind_param($stmt, "si", $kode_barang, $id_ignore);
    } else {
        $stmt = mysqli_prepare($conn, "SELECT COUNT(*) AS total FROM barang WHERE kode_barang = ?");
        mysqli_stmt_bind_param($stmt, "s", $kode_barang);
    }

    mysqli_stmt_execute($stmt);
    $res  = mysqli_stmt_get_result($stmt);
    $data = mysqli_fetch_assoc($res);
    mysqli_stmt_close($stmt);

    echo json_encode([
        'status' => 'success',
        'exists' => ($data && (int)$data['total'] > 0),
        'kode'   => $kode_barang
    ]);
    exit;
}

// Validasi CSRF Token untuk request POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !validasi_csrf()) {
    header("Location: barang.php?status=error&pesan=" . urlencode("Token keamanan CSRF tidak valid atau sesi telah kedaluwarsa!"));
    exit;
}

// ==========================================
// 2. PROSES TAMBAH BARANG
// ==========================================
if ($aksi === 'tambah' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $kode_barang = strtoupper(trim($_POST['kode_barang'] ?? ''));
    $nama_barang = trim($_POST['nama_barang'] ?? '');
    $harga_beli  = (float)str_replace(['.', ','], ['', '.'], $_POST['harga_beli'] ?? 0);
    $harga_jual  = (float)str_replace(['.', ','], ['', '.'], $_POST['harga_jual'] ?? 0);
    $stok        = (int)($_POST['stok'] ?? 0);
    $satuan      = trim($_POST['satuan'] ?? 'pcs');

    // Menangkap id_kategori (bisa bernilai NULL jika tidak dipilih)
    $id_kategori_input = trim($_POST['id_kategori'] ?? '');
    $id_kategori = (!empty($id_kategori_input) && (int)$id_kategori_input > 0) ? (int)$id_kategori_input : null;

    // Validasi data masukan
    if (empty($kode_barang) || empty($nama_barang) || $harga_jual <= 0 || $stok < 0) {
        header("Location: barang.php?status=error&pesan=" . urlencode("Kode, nama barang, harga jual, dan stok wajib diisi dengan benar!"));
        exit;
    }

    // Validasi keunikan kode barang dengan Prepared Statement
    $stmt_cek = mysqli_prepare($conn, "SELECT id FROM barang WHERE kode_barang = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt_cek, "s", $kode_barang);
    mysqli_stmt_execute($stmt_cek);
    mysqli_stmt_store_result($stmt_cek);

    if (mysqli_stmt_num_rows($stmt_cek) > 0) {
        mysqli_stmt_close($stmt_cek);
        header("Location: barang.php?status=error&pesan=" . urlencode("Kode barang '{$kode_barang}' sudah terdaftar! Gunakan kode lain."));
        exit;
    }
    mysqli_stmt_close($stmt_cek);

    // Insert data barang baru dengan Prepared Statement (menyimpan id_kategori)
    $query_insert = "INSERT INTO barang (kode_barang, id_kategori, nama_barang, harga_beli, harga_jual, stok, satuan) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt_insert = mysqli_prepare($conn, $query_insert);
    mysqli_stmt_bind_param($stmt_insert, "sisddis", $kode_barang, $id_kategori, $nama_barang, $harga_beli, $harga_jual, $stok, $satuan);

    if (mysqli_stmt_execute($stmt_insert)) {
        mysqli_stmt_close($stmt_insert);
        header("Location: barang.php?status=sukses&pesan=" . urlencode("Barang baru '{$nama_barang}' berhasil ditambahkan."));
    } else {
        mysqli_stmt_close($stmt_insert);
        header("Location: barang.php?status=error&pesan=" . urlencode("Gagal menambahkan barang!"));
    }
    exit;
}

// ==========================================
// 3. PROSES EDIT BARANG
// ==========================================
elseif ($aksi === 'edit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $id          = (int)($_POST['id'] ?? 0);
    $kode_barang = strtoupper(trim($_POST['kode_barang'] ?? ''));
    $nama_barang = trim($_POST['nama_barang'] ?? '');
    $harga_beli  = (float)str_replace(['.', ','], ['', '.'], $_POST['harga_beli'] ?? 0);
    $harga_jual  = (float)str_replace(['.', ','], ['', '.'], $_POST['harga_jual'] ?? 0);
    $stok        = (int)($_POST['stok'] ?? 0);
    $satuan      = trim($_POST['satuan'] ?? 'pcs');

    // Menangkap id_kategori (bisa bernilai NULL jika dikosongkan/tanpa kategori)
    $id_kategori_input = trim($_POST['id_kategori'] ?? '');
    $id_kategori = (!empty($id_kategori_input) && (int)$id_kategori_input > 0) ? (int)$id_kategori_input : null;

    // Validasi data masukan
    if ($id <= 0 || empty($kode_barang) || empty($nama_barang) || $harga_jual <= 0 || $stok < 0) {
        header("Location: barang.php?status=error&pesan=" . urlencode("Data perbaruan barang tidak valid!"));
        exit;
    }

    // Validasi keunikan kode barang jika diubah (kecuali untuk barang ini sendiri)
    $stmt_cek = mysqli_prepare($conn, "SELECT id FROM barang WHERE kode_barang = ? AND id != ? LIMIT 1");
    mysqli_stmt_bind_param($stmt_cek, "si", $kode_barang, $id);
    mysqli_stmt_execute($stmt_cek);
    mysqli_stmt_store_result($stmt_cek);

    if (mysqli_stmt_num_rows($stmt_cek) > 0) {
        mysqli_stmt_close($stmt_cek);
        header("Location: barang.php?status=error&pesan=" . urlencode("Kode barang '{$kode_barang}' sudah dipakai oleh barang lain!"));
        exit;
    }
    mysqli_stmt_close($stmt_cek);

    // Update data barang dengan Prepared Statement (memperbarui id_kategori)
    $query_update = "UPDATE barang SET kode_barang = ?, id_kategori = ?, nama_barang = ?, harga_beli = ?, harga_jual = ?, stok = ?, satuan = ?, updated_at = NOW() WHERE id = ?";
    $stmt_update = mysqli_prepare($conn, $query_update);
    mysqli_stmt_bind_param($stmt_update, "sisddisi", $kode_barang, $id_kategori, $nama_barang, $harga_beli, $harga_jual, $stok, $satuan, $id);

    if (mysqli_stmt_execute($stmt_update)) {
        mysqli_stmt_close($stmt_update);
        header("Location: barang.php?status=sukses&pesan=" . urlencode("Data barang '{$nama_barang}' berhasil diperbarui."));
    } else {
        mysqli_stmt_close($stmt_update);
        header("Location: barang.php?status=error&pesan=" . urlencode("Gagal memperbarui data barang!"));
    }
    exit;
}

// ==========================================
// 4. PROSES HAPUS BARANG
// ==========================================
elseif ($aksi === 'hapus') {
    $id = (int)($_GET['id'] ?? 0);

    if ($id <= 0) {
        header("Location: barang.php?status=error&pesan=" . urlencode("ID barang tidak valid!"));
        exit;
    }

    // Aturan Wajib: Periksa apakah barang sudah pernah memiliki transaksi di transaksi_detail
    $stmt_cek_transaksi = mysqli_prepare($conn, "SELECT COUNT(*) AS total_transaksi FROM transaksi_detail WHERE id_barang = ?");
    mysqli_stmt_bind_param($stmt_cek_transaksi, "i", $id);
    mysqli_stmt_execute($stmt_cek_transaksi);
    $res_transaksi = mysqli_stmt_get_result($stmt_cek_transaksi);
    $data_transaksi = mysqli_fetch_assoc($res_transaksi);
    mysqli_stmt_close($stmt_cek_transaksi);

    if ($data_transaksi && (int)$data_transaksi['total_transaksi'] > 0) {
        // Cegah penghapusan untuk menjaga integritas data riwayat transaksi
        header("Location: barang.php?status=error&pesan=" . urlencode("Barang tidak dapat dihapus karena sudah memiliki riwayat transaksi penjualan! Anda dapat mengubah stoknya menjadi 0 jika barang sudah tidak dijual."));
        exit;
    }

    // Jika belum pernah digunakan dalam transaksi, lakukan penghapusan
    $stmt_hapus = mysqli_prepare($conn, "DELETE FROM barang WHERE id = ?");
    mysqli_stmt_bind_param($stmt_hapus, "i", $id);

    if (mysqli_stmt_execute($stmt_hapus)) {
        mysqli_stmt_close($stmt_hapus);
        header("Location: barang.php?status=sukses&pesan=" . urlencode("Barang berhasil dihapus."));
    } else {
        mysqli_stmt_close($stmt_hapus);
        header("Location: barang.php?status=error&pesan=" . urlencode("Gagal menghapus barang!"));
    }
    exit;
}

// Jika aksi tidak sesuai
header("Location: barang.php");
exit;
