<?php
/**
 * File: dashboard/index.php
 * Deskripsi: Halaman Dashboard Utama sistem POS Toko Kelontong
 * Hak Akses: 
 *   - Pemilik: Melihat 3 kartu utama (total barang, total kasir, pendapatan hari ini) & ringkasan aktivitas toko
 *   - Kasir: Melihat versi ringkas (pendapatan shift kasir hari ini, jumlah transaksi, & barang aktif)
 * Aturan: Semua query menggunakan prepared statement, komentar di setiap blok logika
 */

// ==========================================
// 1. BUFFERING, MEMUAT TEMPLATE & INISIALISASI HALAMAN
// ==========================================
ob_start();
$page_title  = 'Dashboard';
$active_menu = 'dashboard';
require_once __DIR__ . '/../template/header.php';

// Pastikan pengguna sudah login (telah diperiksa di header, ekstra verifikasi)
cek_login();

$user_id   = (int)($_SESSION['id'] ?? 0);
$user_role = $_SESSION['role'] ?? 'kasir';
$user_nama = $_SESSION['nama_lengkap'] ?? 'Pengguna';

// ==========================================
// 2. MENANGKAP PESAN NOTIFIKASI
// ==========================================
$pesan = $_GET['pesan'] ?? '';

// ==========================================
// 3. PENGAMBILAN DATA STATISTIK SESUAI ROLE
// ==========================================

if ($user_role === 'pemilik') {
    // --- METRIK 1: TOTAL BARANG (COUNT barang) ---
    $query_barang = "SELECT COUNT(*) AS total_barang FROM barang";
    $res_barang   = mysqli_query($conn, $query_barang);
    $data_barang  = mysqli_fetch_assoc($res_barang);
    $total_barang = (int)($data_barang['total_barang'] ?? 0);

    // --- METRIK 2: TOTAL KASIR (COUNT users role = 'kasir') dengan Prepared Statement ---
    $role_kasir = 'kasir';
    $stmt_kasir = mysqli_prepare($conn, "SELECT COUNT(*) AS total_kasir FROM users WHERE role = ?");
    mysqli_stmt_bind_param($stmt_kasir, "s", $role_kasir);
    mysqli_stmt_execute($stmt_kasir);
    $res_kasir   = mysqli_stmt_get_result($stmt_kasir);
    $data_kasir  = mysqli_fetch_assoc($res_kasir);
    $total_kasir = (int)($data_kasir['total_kasir'] ?? 0);
    mysqli_stmt_close($stmt_kasir);

    // --- METRIK 3: PENDAPATAN HARI INI (SUM total_belanja WHERE DATE(created_at) = CURDATE()) ---
    $query_pendapatan = "SELECT 
        COALESCE(SUM(total_belanja), 0) AS pendapatan_hari_ini,
        COUNT(*) AS total_transaksi_hari_ini 
        FROM transaksi 
        WHERE DATE(created_at) = CURDATE()";
    $res_pendapatan = mysqli_query($conn, $query_pendapatan);
    $data_pendapatan = mysqli_fetch_assoc($res_pendapatan);
    $pendapatan_hari_ini    = (float)($data_pendapatan['pendapatan_hari_ini'] ?? 0);
    $transaksi_hari_ini_jml = (int)($data_pendapatan['total_transaksi_hari_ini'] ?? 0);

    // --- METRIK 4: TOTAL PIUTANG BELUM LUNAS TOKO (PEMILIK) ---
    $query_piutang = "SELECT 
        COALESCE(SUM(sisa_piutang), 0) AS total_piutang_belum_lunas,
        COUNT(*) AS total_kasbon_aktif 
        FROM piutang 
        WHERE status = 'belum_lunas'";
    $res_piutang = mysqli_query($conn, $query_piutang);
    $data_piutang = mysqli_fetch_assoc($res_piutang);
    $total_piutang_belum_lunas = (float)($data_piutang['total_piutang_belum_lunas'] ?? 0);
    $total_kasbon_aktif        = (int)($data_piutang['total_kasbon_aktif'] ?? 0);

    // --- DATA TAMBAHAN PEMILIK: 5 Transaksi Terbaru Hari Ini ---
    $query_transaksi_terbaru = "SELECT t.id, t.kode_transaksi, t.total_belanja, t.metode_pembayaran, t.created_at, u.nama_lengkap AS nama_kasir
        FROM transaksi t
        LEFT JOIN users u ON t.id_kasir = u.id
        ORDER BY t.id DESC 
        LIMIT 5";
    $res_transaksi_terbaru = mysqli_query($conn, $query_transaksi_terbaru);

    // --- DATA TAMBAHAN PEMILIK: Daftar Barang dengan Stok Kritis (<= 5) ---
    $query_stok_kritis = "SELECT kode_barang, nama_barang, stok, satuan FROM barang WHERE stok <= 5 ORDER BY stok ASC LIMIT 5";
    $res_stok_kritis = mysqli_query($conn, $query_stok_kritis);

} else {
    // --- VERSI RINGKAS UNTUK KASIR ---

    // 1. Pendapatan & Jumlah Transaksi Kasir Ini Hari Ini (Prepared Statement)
    $stmt_kasir_stat = mysqli_prepare($conn, "SELECT 
        COALESCE(SUM(total_belanja), 0) AS pendapatan_kasir,
        COUNT(*) AS jumlah_transaksi_kasir
        FROM transaksi 
        WHERE id_kasir = ? AND DATE(created_at) = CURDATE()");
    mysqli_stmt_bind_param($stmt_kasir_stat, "i", $user_id);
    mysqli_stmt_execute($stmt_kasir_stat);
    $res_kasir_stat = mysqli_stmt_get_result($stmt_kasir_stat);
    $data_kasir_stat = mysqli_fetch_assoc($res_kasir_stat);
    $pendapatan_kasir = (float)($data_kasir_stat['pendapatan_kasir'] ?? 0);
    $transaksi_kasir  = (int)($data_kasir_stat['jumlah_transaksi_kasir'] ?? 0);
    mysqli_stmt_close($stmt_kasir_stat);

    // 2. Total Barang Tersedia Siap Jual
    $query_barang_aktif = "SELECT COUNT(*) AS total_aktif FROM barang WHERE stok > 0";
    $res_barang_aktif   = mysqli_query($conn, $query_barang_aktif);
    $data_barang_aktif  = mysqli_fetch_assoc($res_barang_aktif);
    $barang_siap_jual   = (int)($data_barang_aktif['total_aktif'] ?? 0);

    // 3. Total Piutang Kasbon Belum Lunas Shift Kasir Ini
    $stmt_kasir_piutang = mysqli_prepare($conn, "SELECT 
        COALESCE(SUM(pt.sisa_piutang), 0) AS kasir_piutang_belum_lunas,
        COUNT(*) AS kasir_kasbon_aktif
        FROM piutang pt
        JOIN transaksi t ON pt.id_transaksi = t.id
        WHERE t.id_kasir = ? AND pt.status = 'belum_lunas'");
    mysqli_stmt_bind_param($stmt_kasir_piutang, "i", $user_id);
    mysqli_stmt_execute($stmt_kasir_piutang);
    $res_kasir_piutang = mysqli_stmt_get_result($stmt_kasir_piutang);
    $data_kasir_piutang = mysqli_fetch_assoc($res_kasir_piutang);
    $kasir_piutang_belum_lunas = (float)($data_kasir_piutang['kasir_piutang_belum_lunas'] ?? 0);
    $kasir_kasbon_aktif        = (int)($data_kasir_piutang['kasir_kasbon_aktif'] ?? 0);
    mysqli_stmt_close($stmt_kasir_piutang);

    // 4. Daftar Transaksi Terakhir yang Dilayani Kasir Ini (Prepared Statement)
    $stmt_riwayat = mysqli_prepare($conn, "SELECT id, kode_transaksi, total_belanja, uang_bayar, kembalian, metode_pembayaran, created_at 
        FROM transaksi 
        WHERE id_kasir = ? 
        ORDER BY id DESC 
        LIMIT 5");
    mysqli_stmt_bind_param($stmt_riwayat, "i", $user_id);
    mysqli_stmt_execute($stmt_riwayat);
    $res_transaksi_terbaru = mysqli_stmt_get_result($stmt_riwayat);
}
?>

<!-- ========================================== -->
<!-- 4. ALERT NOTIFIKASI (JIKA ADA AKSES DITOLAK)-->
<!-- ========================================== -->
<?php if ($pesan === 'akses_ditolak'): ?>
    <div class="alert alert-warning alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
        <i class="bi bi-shield-exclamation me-2 fs-5"></i>
        <div><strong>Akses Ditolak:</strong> Halaman yang Anda tuju khusus diperuntukkan bagi peran Pemilik Toko.</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
<?php endif; ?>

<!-- ========================================== -->
<!-- 5. UCAPAN SELAMAT DATANG                   -->
<!-- ========================================== -->
<div class="card card-custom bg-white p-4 mb-4 border-0 shadow-sm">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
            <h4 class="fw-bold mb-1 text-primary">
                Selamat Datang, <?= htmlspecialchars($user_nama) ?>!
            </h4>
            <p class="text-muted small mb-0">
                Anda login sebagai <span class="badge <?= ($user_role === 'pemilik') ? 'badge-role-pemilik' : 'badge-role-kasir' ?>"><?= ucfirst($user_role) ?></span> &bull; Hari ini: <?= date('d F Y') ?>
            </p>
        </div>
        <div>
            <a href="<?= BASE_URL ?>transaksi/kasir.php" class="btn btn-success d-inline-flex align-items-center gap-2 shadow-sm">
                <i class="bi bi-cart-plus-fill"></i> Buka Kasir / Transaksi Baru
            </a>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 6. KARTU STATISTIK UTAMA (SESUAI PRD)     -->
<!-- ========================================== -->

<?php if ($user_role === 'pemilik'): ?>
    <!-- TAMPILAN DASHBOARD PEMILIK (LENGKAP) -->
    <div class="row g-3 mb-4">
        <!-- Kartu 1: Total Barang -->
        <div class="col-sm-6 col-xl-3">
            <div class="card card-custom p-4 border-start border-4 border-primary h-100">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <div class="text-muted small fw-semibold text-uppercase">Total Barang</div>
                        <h3 class="fw-bold mb-0 mt-2"><?= number_format($total_barang, 0, ',', '.') ?></h3>
                        <small class="text-muted">Item di inventaris</small>
                    </div>
                    <div class="bg-primary-subtle text-primary p-3 rounded-circle fs-3">
                        <i class="bi bi-box-seam"></i>
                    </div>
                </div>
                <div class="mt-3 pt-2 border-top">
                    <a href="<?= BASE_URL ?>master/barang.php" class="small text-decoration-none fw-semibold">
                        Kelola Barang <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>

        <!-- Kartu 2: Total Kasir -->
        <div class="col-sm-6 col-xl-3">
            <div class="card card-custom p-4 border-start border-4 border-info h-100">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <div class="text-muted small fw-semibold text-uppercase">Total Kasir</div>
                        <h3 class="fw-bold mb-0 mt-2"><?= number_format($total_kasir, 0, ',', '.') ?></h3>
                        <small class="text-muted">Petugas kasir aktif</small>
                    </div>
                    <div class="bg-info-subtle text-info p-3 rounded-circle fs-3">
                        <i class="bi bi-people"></i>
                    </div>
                </div>
                <div class="mt-3 pt-2 border-top">
                    <a href="<?= BASE_URL ?>master/pengguna.php" class="small text-decoration-none fw-semibold">
                        Kelola Pengguna <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>

        <!-- Kartu 3: Pendapatan Hari Ini -->
        <div class="col-sm-6 col-xl-3">
            <div class="card card-custom p-4 border-start border-4 border-success h-100">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <div class="text-muted small fw-semibold text-uppercase">Pendapatan Hari Ini</div>
                        <h3 class="fw-bold mb-0 mt-2 text-success">Rp <?= number_format($pendapatan_hari_ini, 0, ',', '.') ?></h3>
                        <small class="text-muted"><?= $transaksi_hari_ini_jml ?> transaksi</small>
                    </div>
                    <div class="bg-success-subtle text-success p-3 rounded-circle fs-3">
                        <i class="bi bi-cash-coin"></i>
                    </div>
                </div>
                <div class="mt-3 pt-2 border-top">
                    <a href="<?= BASE_URL ?>laporan/index.php" class="small text-decoration-none fw-semibold text-success">
                        Laporan <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>

        <!-- Kartu 4: Total Piutang / Kasbon Belum Lunas -->
        <div class="col-sm-6 col-xl-3">
            <div class="card card-custom p-4 border-start border-4 border-danger h-100">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <div class="text-muted small fw-semibold text-uppercase">Piutang Belum Lunas</div>
                        <h3 class="fw-bold mb-0 mt-2 text-danger">Rp <?= number_format($total_piutang_belum_lunas, 0, ',', '.') ?></h3>
                        <small class="text-muted"><?= $total_kasbon_aktif ?> tagihan aktif</small>
                    </div>
                    <div class="bg-danger-subtle text-danger p-3 rounded-circle fs-3">
                        <i class="bi bi-journal-x"></i>
                    </div>
                </div>
                <div class="mt-3 pt-2 border-top">
                    <a href="<?= BASE_URL ?>piutang/index.php" class="small text-decoration-none fw-semibold text-danger">
                        Kelola Kasbon <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- DETAIL AKTIVITAS & PERINGATAN (PEMILIK) -->
    <div class="row g-4 mb-4">
        <!-- 5 Transaksi Terbaru Hari Ini -->
        <div class="col-lg-8">
            <div class="card card-custom h-100">
                <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 fw-semibold text-secondary"><i class="bi bi-receipt me-2"></i>Transaksi Terbaru</h6>
                    <a href="<?= BASE_URL ?>laporan/index.php" class="small text-decoration-none">Semua Riwayat &raquo;</a>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Kode Transaksi</th>
                                <th>Kasir</th>
                                <th class="text-end">Total</th>
                                <th class="text-center">Waktu</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php 
                            $has_trx = false;
                            if ($res_transaksi_terbaru):
                                while ($trx = mysqli_fetch_assoc($res_transaksi_terbaru)): 
                                    $has_trx = true;
                            ?>
                                <tr>
                                    <td>
                                        <span class="font-monospace fw-semibold text-primary"><?= htmlspecialchars($trx['kode_transaksi']) ?></span>
                                    </td>
                                    <td><?= htmlspecialchars($trx['nama_kasir'] ?? '-') ?></td>
                                    <td class="text-end fw-semibold">Rp <?= number_format($trx['total_belanja'], 0, ',', '.') ?></td>
                                    <td class="text-center text-muted small"><?= date('H:i', strtotime($trx['created_at'])) ?></td>
                                </tr>
                            <?php 
                                endwhile;
                            endif;
                            if (!$has_trx): 
                            ?>
                                <tr>
                                    <td colspan="4" class="text-center py-4 text-muted small">
                                        <i class="bi bi-inbox fs-3 d-block mb-1 text-secondary"></i>
                                        Belum ada transaksi hari ini.
                                    </td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Peringatan Stok Menipis -->
        <div class="col-lg-4">
            <div class="card card-custom h-100">
                <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 fw-semibold text-warning"><i class="bi bi-exclamation-triangle-fill me-2"></i>Stok Menipis (&le; 5)</h6>
                    <a href="<?= BASE_URL ?>master/barang.php" class="small text-decoration-none">Kelola Stok &raquo;</a>
                </div>
                <div class="p-3">
                    <?php 
                    $has_kritis = false;
                    if ($res_stok_kritis):
                        while ($stk = mysqli_fetch_assoc($res_stok_kritis)): 
                            $has_kritis = true;
                    ?>
                        <div class="d-flex justify-content-between align-items-center p-2 mb-2 bg-light rounded-2 border">
                            <div>
                                <div class="fw-semibold small text-dark"><?= htmlspecialchars($stk['nama_barang']) ?></div>
                                <div class="text-muted font-monospace" style="font-size: 0.75rem;"><?= htmlspecialchars($stk['kode_barang']) ?></div>
                            </div>
                            <span class="badge <?= ((int)$stk['stok'] === 0) ? 'bg-danger' : 'bg-warning text-dark' ?> rounded-pill">
                                Sisa <?= $stk['stok'] ?> <?= htmlspecialchars($stk['satuan'] ?? 'pcs') ?>
                            </span>
                        </div>
                    <?php 
                        endwhile;
                    endif;
                    if (!$has_kritis): 
                    ?>
                        <div class="text-center py-4 text-success small">
                            <i class="bi bi-check-circle fs-3 d-block mb-1"></i>
                            Semua stok barang dalam kondisi aman.
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

<?php else: ?>
    <!-- TAMPILAN DASHBOARD KASIR (VERSI RINGKAS) -->
    <div class="row g-3 mb-4">
        <!-- Kartu 1: Penjualan Shift Kasir Hari Ini -->
        <div class="col-sm-6 col-xl-3">
            <div class="card card-custom p-4 border-start border-4 border-success h-100">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <div class="text-muted small fw-semibold text-uppercase">Penjualan Saya Hari Ini</div>
                        <h3 class="fw-bold mb-0 mt-2 text-success">Rp <?= number_format($pendapatan_kasir, 0, ',', '.') ?></h3>
                        <small class="text-muted">Total penerimaan kasir Anda</small>
                    </div>
                    <div class="bg-success-subtle text-success p-3 rounded-circle fs-3">
                        <i class="bi bi-cash-stack"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Kartu 2: Jumlah Transaksi Dilayani -->
        <div class="col-sm-6 col-xl-3">
            <div class="card card-custom p-4 border-start border-4 border-primary h-100">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <div class="text-muted small fw-semibold text-uppercase">Transaksi Dilayani</div>
                        <h3 class="fw-bold mb-0 mt-2"><?= number_format($transaksi_kasir, 0, ',', '.') ?></h3>
                        <small class="text-muted">Struk belanja tersimpan hari ini</small>
                    </div>
                    <div class="bg-primary-subtle text-primary p-3 rounded-circle fs-3">
                        <i class="bi bi-receipt-cutoff"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Kartu 3: Barang Siap Jual -->
        <div class="col-sm-6 col-xl-3">
            <div class="card card-custom p-4 border-start border-4 border-info h-100">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <div class="text-muted small fw-semibold text-uppercase">Barang Siap Jual</div>
                        <h3 class="fw-bold mb-0 mt-2"><?= number_format($barang_siap_jual, 0, ',', '.') ?></h3>
                        <small class="text-muted">Produk yang memiliki stok > 0</small>
                    </div>
                    <div class="bg-info-subtle text-info p-3 rounded-circle fs-3">
                        <i class="bi bi-box-seam-fill"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Kartu 4: Kasbon Belum Lunas Shift Ini/Kasir Ini -->
        <div class="col-sm-6 col-xl-3">
            <div class="card card-custom p-4 border-start border-4 border-warning h-100">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <div class="text-muted small fw-semibold text-uppercase">Kasbon Belum Lunas</div>
                        <h3 class="fw-bold mb-0 mt-2 text-warning">Rp <?= number_format($kasir_piutang_belum_lunas, 0, ',', '.') ?></h3>
                        <small class="text-muted">Kasbon transaksi kasir Anda</small>
                    </div>
                    <div class="bg-warning-subtle text-warning p-3 rounded-circle fs-3">
                        <i class="bi bi-journal-x"></i>
                    </div>
                </div>
                <div class="mt-3 pt-2 border-top">
                    <a href="<?= BASE_URL ?>piutang/index.php" class="small text-decoration-none fw-semibold text-warning">
                        Daftar Piutang <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- Riwayat Transaksi Terakhir Kasir -->
    <div class="card card-custom mb-4">
        <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 class="mb-0 fw-semibold text-secondary"><i class="bi bi-clock-history me-2"></i>5 Transaksi Terakhir yang Anda Layani</h6>
            <a href="<?= BASE_URL ?>laporan/index.php" class="small text-decoration-none">Laporan Kasir Lengkap &raquo;</a>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th>Kode Transaksi</th>
                        <th class="text-end">Total Belanja</th>
                        <th class="text-end">Uang Bayar</th>
                        <th class="text-end">Kembalian</th>
                        <th class="text-center">Waktu</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $has_kasir_trx = false;
                    if ($res_transaksi_terbaru):
                        while ($ktrx = mysqli_fetch_assoc($res_transaksi_terbaru)): 
                            $has_kasir_trx = true;
                    ?>
                        <tr>
                            <td>
                                <span class="font-monospace fw-semibold text-primary"><?= htmlspecialchars($ktrx['kode_transaksi']) ?></span>
                            </td>
                            <td class="text-end fw-semibold">Rp <?= number_format($ktrx['total_belanja'], 0, ',', '.') ?></td>
                            <td class="text-end text-muted font-monospace">Rp <?= number_format($ktrx['uang_bayar'], 0, ',', '.') ?></td>
                            <td class="text-end text-success font-monospace">Rp <?= number_format($ktrx['kembalian'], 0, ',', '.') ?></td>
                            <td class="text-center text-muted small"><?= date('d/m/Y H:i', strtotime($ktrx['created_at'])) ?></td>
                        </tr>
                    <?php 
                        endwhile;
                    endif;
                    if (!$has_kasir_trx): 
                    ?>
                        <tr>
                            <td colspan="5" class="text-center py-4 text-muted small">
                                <i class="bi bi-cart-x fs-3 d-block mb-1 text-secondary"></i>
                                Anda belum memiliki riwayat transaksi penjualan.
                            </td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
<?php endif; ?>

<?php
require_once __DIR__ . '/../template/footer.php';
?>
