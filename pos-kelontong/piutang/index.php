<?php
/**
 * File: piutang/index.php
 * Deskripsi: Halaman daftar transaksi kasbon / piutang pelanggan
 * Hak Akses: 
 *   - Pemilik: Melihat seluruh piutang toko
 *   - Kasir: Hanya melihat piutang dari transaksi yang diinput oleh dirinya sendiri
 * Aturan: Prepared statements, validasi role, ringkasan metrik statistik piutang
 */

// ==========================================
// 1. BUFFERING, MEMUAT TEMPLATE & INISIALISASI
// ==========================================
ob_start();
$page_title  = 'Daftar Piutang / Kasbon';
$active_menu = 'piutang';
require_once __DIR__ . '/../template/header.php';

// Hak akses untuk Pemilik & Kasir
cek_role(['pemilik', 'kasir']);

$user_id   = (int)$_SESSION['id'];
$user_role = $_SESSION['role'] ?? 'kasir';

// ==========================================
// 2. MENANGKAP PARAMETER FILTER & PENCARIAN
// ==========================================
$status_filter = $_GET['status'] ?? 'belum_lunas'; // default tampilkan yang belum lunas
$cari          = trim($_GET['cari'] ?? '');
$pesan         = $_GET['pesan'] ?? '';
$notif_status  = $_GET['notif_status'] ?? '';

// ==========================================
// 3. QUERY DATA STATISTIK PIUTANG
// ==========================================
// Kondisi kasir jika role kasir
$kasir_condition_stat = ($user_role === 'kasir') ? "AND t.id_kasir = {$user_id}" : "";

$q_stats = mysqli_query($conn, "SELECT 
    COUNT(*) as total_transaksi_piutang,
    COALESCE(SUM(pt.total_piutang), 0) as total_nominal_piutang,
    COALESCE(SUM(CASE WHEN pt.status = 'belum_lunas' THEN pt.sisa_piutang ELSE 0 END), 0) as total_sisa_belum_lunas,
    COUNT(CASE WHEN pt.status = 'belum_lunas' THEN 1 ELSE NULL END) as jml_belum_lunas,
    COUNT(CASE WHEN pt.status = 'lunas' THEN 1 ELSE NULL END) as jml_lunas
    FROM piutang pt
    JOIN transaksi t ON pt.id_transaksi = t.id
    WHERE 1=1 {$kasir_condition_stat}");
$stats = mysqli_fetch_assoc($q_stats);

// ==========================================
// 4. MENYIAPKAN QUERY PREPARED STATEMENT
// ==========================================
$where_clauses = [];
$params        = [];
$param_types   = '';

// Filter kepemilikan kasir jika role adalah kasir
if ($user_role === 'kasir') {
    $where_clauses[] = "t.id_kasir = ?";
    $params[]        = $user_id;
    $param_types    .= 'i';
}

// Filter Status (belum_lunas / lunas / semua)
if (!empty($status_filter) && in_array($status_filter, ['belum_lunas', 'lunas'])) {
    $where_clauses[] = "pt.status = ?";
    $params[]        = $status_filter;
    $param_types    .= 's';
}

// Filter Pencarian (nama pelanggan, no_hp, atau kode transaksi)
if (!empty($cari)) {
    $where_clauses[] = "(pel.nama LIKE ? OR pel.no_hp LIKE ? OR t.kode_transaksi LIKE ?)";
    $keyword         = "%{$cari}%";
    $params[]        = $keyword;
    $params[]        = $keyword;
    $params[]        = $keyword;
    $param_types    .= 'sss';
}

$where_sql = !empty($where_clauses) ? "WHERE " . implode(" AND ", $where_clauses) : "";

$query_piutang = "SELECT pt.*, pel.nama AS nama_pelanggan, pel.no_hp AS no_hp_pelanggan, pel.alamat AS alamat_pelanggan,
                         t.kode_transaksi, t.total_belanja, t.created_at AS tanggal_transaksi,
                         u.nama_lengkap AS nama_kasir,
                         (SELECT COALESCE(SUM(pp.jumlah_bayar), 0) FROM pembayaran_piutang pp WHERE pp.id_piutang = pt.id) AS total_terbayar
                  FROM piutang pt
                  JOIN pelanggan pel ON pt.id_pelanggan = pel.id
                  JOIN transaksi t ON pt.id_transaksi = t.id
                  LEFT JOIN users u ON t.id_kasir = u.id
                  {$where_sql}
                  ORDER BY (CASE WHEN pt.status = 'belum_lunas' THEN 1 ELSE 2 END), pt.id DESC";

if (!empty($params)) {
    $stmt = mysqli_prepare($conn, $query_piutang);
    mysqli_stmt_bind_param($stmt, $param_types, ...$params);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
} else {
    $result = mysqli_query($conn, $query_piutang);
}
?>

<!-- Header Halaman & Aksi -->
<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
    <div>
        <h4 class="fw-bold mb-1"><i class="bi bi-journal-bookmark-fill me-2 text-warning"></i>Daftar Piutang / Kasbon Pelanggan</h4>
        <p class="text-muted small mb-0">
            <?= ($user_role === 'pemilik') ? 'Pantau seluruh catatan kasbon pelanggan dan penerimaan cicilan toko' : 'Daftar transaksi kasbon pelanggan yang Anda proses pada kasir' ?>
        </p>
    </div>
    <div class="d-flex gap-2">
        <a href="<?= BASE_URL ?>transaksi/kasir.php" class="btn btn-outline-primary d-inline-flex align-items-center gap-2">
            <i class="bi bi-cart-plus"></i> Kasir Baru
        </a>
        <a href="<?= BASE_URL ?>master/pelanggan.php" class="btn btn-secondary d-inline-flex align-items-center gap-2">
            <i class="bi bi-person-lines-fill"></i> Data Pelanggan
        </a>
    </div>
</div>

<!-- ========================================== -->
<!-- 5. KARTU STATISTIK RINGKASAN PIUTANG       -->
<!-- ========================================== -->
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-xl-4">
        <div class="card card-custom p-3 border-start border-4 border-danger">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Sisa Kasbon Belum Lunas</span>
                    <h4 class="fw-bold mb-0 mt-1 text-danger">Rp <?= number_format($stats['total_sisa_belum_lunas'] ?? 0, 0, ',', '.') ?></h4>
                    <small class="text-muted"><?= number_format($stats['jml_belum_lunas'] ?? 0, 0, ',', '.') ?> transaksi belum lunas</small>
                </div>
                <div class="bg-danger-subtle text-danger p-3 rounded-3 fs-4">
                    <i class="bi bi-exclamation-octagon-fill"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-xl-4">
        <div class="card card-custom p-3 border-start border-4 border-success">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Kasbon yang Sudah Lunas</span>
                    <h4 class="fw-bold mb-0 mt-1 text-success"><?= number_format($stats['jml_lunas'] ?? 0, 0, ',', '.') ?> Transaksi</h4>
                    <small class="text-muted">Status selesai/lunas</small>
                </div>
                <div class="bg-success-subtle text-success p-3 rounded-3 fs-4">
                    <i class="bi bi-check-circle-fill"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-xl-4">
        <div class="card card-custom p-3 border-start border-4 border-primary">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Total Nilai Riwayat Kasbon</span>
                    <h4 class="fw-bold mb-0 mt-1 text-primary">Rp <?= number_format($stats['total_nominal_piutang'] ?? 0, 0, ',', '.') ?></h4>
                    <small class="text-muted"><?= number_format($stats['total_transaksi_piutang'] ?? 0, 0, ',', '.') ?> total transaksi kasbon</small>
                </div>
                <div class="bg-primary-subtle text-primary p-3 rounded-3 fs-4">
                    <i class="bi bi-wallet2"></i>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 6. ALERT NOTIFIKASI                        -->
<!-- ========================================== -->
<?php if (!empty($pesan)): ?>
    <div class="alert alert-<?= ($notif_status === 'sukses' || strpos($pesan, 'berhasil') !== false) ? 'success' : 'danger' ?> alert-dismissible fade show d-flex align-items-center mb-4 shadow-sm" role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div><?= htmlspecialchars($pesan) ?></div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
<?php endif; ?>

<!-- ========================================== -->
<!-- 7. FILTER & TABEL DAFTAR PIUTANG           -->
<!-- ========================================== -->
<div class="card card-custom">
    <div class="card-header bg-white py-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <!-- Filter Tabs Status -->
        <div class="btn-group btn-group-sm" role="group">
            <a href="index.php?status=belum_lunas&cari=<?= urlencode($cari) ?>" class="btn <?= ($status_filter === 'belum_lunas') ? 'btn-danger active' : 'btn-outline-secondary' ?>">
                <i class="bi bi-clock-history me-1"></i> Belum Lunas (<?= $stats['jml_belum_lunas'] ?? 0 ?>)
            </a>
            <a href="index.php?status=lunas&cari=<?= urlencode($cari) ?>" class="btn <?= ($status_filter === 'lunas') ? 'btn-success active' : 'btn-outline-secondary' ?>">
                <i class="bi bi-check2-all me-1"></i> Lunas (<?= $stats['jml_lunas'] ?? 0 ?>)
            </a>
            <a href="index.php?status=semua&cari=<?= urlencode($cari) ?>" class="btn <?= ($status_filter === 'semua' || empty($status_filter)) ? 'btn-primary active' : 'btn-outline-secondary' ?>">
                <i class="bi bi-grid-fill me-1"></i> Semua
            </a>
        </div>

        <!-- Form Filter Pencarian -->
        <form action="" method="GET" class="d-flex gap-2" style="max-width: 340px;">
            <input type="hidden" name="status" value="<?= htmlspecialchars($status_filter) ?>">
            <div class="input-group input-group-sm">
                <input type="text" name="cari" class="form-control" placeholder="Cari pelanggan / no. trx..." value="<?= htmlspecialchars($cari) ?>">
                <button class="btn btn-outline-secondary" type="submit"><i class="bi bi-search"></i></button>
                <?php if (!empty($cari)): ?>
                    <a href="index.php?status=<?= htmlspecialchars($status_filter) ?>" class="btn btn-outline-danger" title="Reset pencarian"><i class="bi bi-x-lg"></i></a>
                <?php endif; ?>
            </div>
        </form>
    </div>
    <div class="table-responsive">
        <table class="table table-hover table-custom align-middle mb-0">
            <thead>
                <tr>
                    <th class="text-center" style="width: 50px;">No</th>
                    <th>Transaksi & Tanggal</th>
                    <th>Pelanggan</th>
                    <?php if ($user_role === 'pemilik'): ?>
                        <th>Kasir</th>
                    <?php endif; ?>
                    <th class="text-end">Total Kasbon</th>
                    <th class="text-end">Sudah Dibayar</th>
                    <th class="text-end">Sisa Kasbon</th>
                    <th class="text-center" style="width: 130px;">Status</th>
                    <th class="text-center" style="width: 160px;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $no = 1;
                $has_data = false;
                if ($result):
                    while ($row = mysqli_fetch_assoc($result)): 
                        $has_data = true;
                        $sisa = (float)$row['sisa_piutang'];
                        $is_lunas = ($row['status'] === 'lunas' || $sisa <= 0);
                ?>
                    <tr>
                        <td class="text-center text-muted"><?= $no++ ?></td>
                        <td>
                            <div class="fw-semibold font-monospace text-dark"><?= htmlspecialchars($row['kode_transaksi']) ?></div>
                            <small class="text-muted"><?= date('d/m/Y H:i', strtotime($row['tanggal_transaksi'])) ?></small>
                        </td>
                        <td>
                            <div class="fw-bold text-dark"><?= htmlspecialchars($row['nama_pelanggan']) ?></div>
                            <?php if (!empty($row['no_hp_pelanggan'])): ?>
                                <a href="https://wa.me/<?= preg_replace('/[^0-9]/', '', $row['no_hp_pelanggan']) ?>" target="_blank" class="text-decoration-none small text-muted">
                                    <i class="bi bi-whatsapp text-success me-1"></i><?= htmlspecialchars($row['no_hp_pelanggan']) ?>
                                </a>
                            <?php endif; ?>
                        </td>
                        <?php if ($user_role === 'pemilik'): ?>
                            <td class="small text-muted">
                                <i class="bi bi-person me-1"></i><?= htmlspecialchars($row['nama_kasir'] ?? 'Kasir') ?>
                            </td>
                        <?php endif; ?>
                        <td class="text-end font-monospace">
                            Rp <?= number_format($row['total_piutang'], 0, ',', '.') ?>
                        </td>
                        <td class="text-end font-monospace text-success">
                            Rp <?= number_format($row['total_terbayar'], 0, ',', '.') ?>
                        </td>
                        <td class="text-end font-monospace">
                            <?php if ($sisa > 0): ?>
                                <strong class="text-danger">Rp <?= number_format($sisa, 0, ',', '.') ?></strong>
                            <?php else: ?>
                                <span class="text-muted">Rp 0</span>
                            <?php endif; ?>
                        </td>
                        <td class="text-center">
                            <?php if ($is_lunas): ?>
                                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill">
                                    <i class="bi bi-check-circle-fill me-1"></i> Lunas
                                </span>
                            <?php else: ?>
                                <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded-pill">
                                    <i class="bi bi-clock-fill me-1"></i> Belum Lunas
                                </span>
                            <?php endif; ?>
                        </td>
                        <td class="text-center">
                            <div class="btn-group btn-group-sm">
                                <!-- Tombol Bayar / Cicil -->
                                <?php if (!$is_lunas): ?>
                                    <a href="bayar.php?id=<?= $row['id'] ?>" class="btn btn-warning text-dark fw-semibold" title="Bayar / Catat Cicilan">
                                        <i class="bi bi-cash-coin me-1"></i> Bayar
                                    </a>
                                <?php else: ?>
                                    <button class="btn btn-outline-secondary" disabled title="Kasbon sudah lunas">
                                        <i class="bi bi-check2"></i>
                                    </button>
                                <?php endif; ?>

                                <!-- Tombol Rincian / Detail -->
                                <a href="detail.php?id=<?= $row['id'] ?>" class="btn btn-outline-primary" title="Lihat Riwayat Pembayaran & Rincian Barang">
                                    <i class="bi bi-eye"></i> Detail
                                </a>
                            </div>
                        </td>
                    </tr>
                <?php 
                    endwhile;
                endif;

                if (!$has_data): 
                ?>
                    <tr>
                        <td colspan="<?= ($user_role === 'pemilik') ? 9 : 8 ?>" class="text-center py-5 text-muted">
                            <i class="bi bi-journal-x fs-1 d-block mb-2 text-secondary"></i>
                            Tidak ada data transaksi piutang / kasbon yang ditemukan.
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php
if (isset($stmt) && $stmt) {
    mysqli_stmt_close($stmt);
}
require_once __DIR__ . '/../template/footer.php';
?>
