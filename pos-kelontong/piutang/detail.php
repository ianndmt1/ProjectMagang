<?php
/**
 * File: piutang/detail.php
 * Deskripsi: Halaman rincian piutang, riwayat cicilan pembayaran, dan daftar belanja kasbon
 * Hak Akses: Pemilik & Kasir (Kasir dibatasi pada transaksi yang diinputnya)
 * Aturan: Prepared statements, validasi role, rincian pembayaran dari tabel pembayaran_piutang
 */

// ==========================================
// 1. MEMUAT TEMPLATE & INISIALISASI
// ==========================================
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../auth/cek_session.php';

// Hak akses untuk Pemilik & Kasir
cek_role(['pemilik', 'kasir']);

$user_id   = (int)$_SESSION['id'];
$user_role = $_SESSION['role'] ?? 'kasir';

$id_piutang = (int)($_GET['id'] ?? 0);
if ($id_piutang <= 0) {
    header("Location: index.php");
    exit;
}

// ==========================================
// 2. QUERY DETAIL DATA PIUTANG & PELANGGAN
// ==========================================
$query_master = "SELECT pt.*, pel.nama AS nama_pelanggan, pel.no_hp AS no_hp_pelanggan, pel.alamat AS alamat_pelanggan,
                        t.kode_transaksi, t.total_belanja, t.created_at AS tanggal_transaksi, t.id_kasir,
                        u.nama_lengkap AS nama_kasir
                 FROM piutang pt
                 JOIN pelanggan pel ON pt.id_pelanggan = pel.id
                 JOIN transaksi t ON pt.id_transaksi = t.id
                 LEFT JOIN users u ON t.id_kasir = u.id
                 WHERE pt.id = ? LIMIT 1";

$stmt_master = mysqli_prepare($conn, $query_master);
mysqli_stmt_bind_param($stmt_master, "i", $id_piutang);
mysqli_stmt_execute($stmt_master);
$res_master = mysqli_stmt_get_result($stmt_master);
$piutang = mysqli_fetch_assoc($res_master);
mysqli_stmt_close($stmt_master);

if (!$piutang) {
    header("Location: index.php?pesan=" . urlencode("Data piutang tidak ditemukan!"));
    exit;
}

// Pembatasan kasir: kasir hanya dapat melihat riwayat piutang dari transaksi miliknya
if ($user_role === 'kasir' && (int)$piutang['id_kasir'] !== $user_id) {
    header("Location: index.php?pesan=" . urlencode("Akses ditolak: Anda hanya dapat melihat detail transaksi kasbon yang Anda layani!"));
    exit;
}

// ==========================================
// 3. QUERY RIWAYAT CICILAN (PEMBAYARAN_PIUTANG)
// ==========================================
$query_cicilan = "SELECT * FROM pembayaran_piutang WHERE id_piutang = ? ORDER BY id ASC";
$stmt_cicilan  = mysqli_prepare($conn, $query_cicilan);
mysqli_stmt_bind_param($stmt_cicilan, "i", $id_piutang);
mysqli_stmt_execute($stmt_cicilan);
$res_cicilan = mysqli_stmt_get_result($stmt_cicilan);
$cicilan_list = [];
$total_terbayar = 0;
while ($row_c = mysqli_fetch_assoc($res_cicilan)) {
    $cicilan_list[] = $row_c;
    $total_terbayar += (float)$row_c['jumlah_bayar'];
}
mysqli_stmt_close($stmt_cicilan);

// ==========================================
// 4. QUERY RINCIAN BARANG YANG DIKASBONKAN
// ==========================================
$query_items = "SELECT td.*, b.satuan 
                FROM transaksi_detail td 
                LEFT JOIN barang b ON td.id_barang = b.id 
                WHERE td.id_transaksi = ? 
                ORDER BY td.id ASC";
$stmt_items = mysqli_prepare($conn, $query_items);
mysqli_stmt_bind_param($stmt_items, "i", $piutang['id_transaksi']);
mysqli_stmt_execute($stmt_items);
$res_items = mysqli_stmt_get_result($stmt_items);
$items_list = [];
while ($row_i = mysqli_fetch_assoc($res_items)) {
    $items_list[] = $row_i;
}
mysqli_stmt_close($stmt_items);

// Perhitungan persentase pelunasan
$total_piutang = (float)$piutang['total_piutang'];
$sisa_piutang  = (float)$piutang['sisa_piutang'];
$persen_bayar  = ($total_piutang > 0) ? min(100, round(($total_terbayar / $total_piutang) * 100)) : 0;
$is_lunas      = ($piutang['status'] === 'lunas' || $sisa_piutang <= 0);

// Notifikasi
$pesan  = $_GET['pesan'] ?? '';
$status = $_GET['status'] ?? '';

// ==========================================
// 5. MEMUAT TEMPLATE
// ==========================================
$page_title  = 'Detail Kasbon #' . $piutang['kode_transaksi'];
$active_menu = 'piutang';
require_once __DIR__ . '/../template/header.php';
?>

<!-- Header & Navigasi Tombol -->
<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
    <div>
        <div class="d-flex align-items-center gap-2 mb-1">
            <a href="index.php" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left"></i></a>
            <h4 class="fw-bold mb-0">Detail Transaksi Kasbon #<?= htmlspecialchars($piutang['kode_transaksi']) ?></h4>
            <?php if ($is_lunas): ?>
                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill">
                    <i class="bi bi-check-circle-fill me-1"></i> Lunas
                </span>
            <?php else: ?>
                <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded-pill">
                    <i class="bi bi-clock-fill me-1"></i> Belum Lunas
                </span>
            <?php endif; ?>
        </div>
        <p class="text-muted small mb-0 ms-md-4 ps-md-2">Rincian pelunasan, riwayat pembayaran cicilan, dan daftar barang yang diambil</p>
    </div>
    <div class="d-flex gap-2">
        <a href="<?= BASE_URL ?>transaksi/struk.php?id=<?= $piutang['id_transaksi'] ?>" target="_blank" class="btn btn-outline-secondary d-inline-flex align-items-center gap-1">
            <i class="bi bi-printer"></i> Cetak Struk
        </a>
        <?php if (!$is_lunas): ?>
            <a href="bayar.php?id=<?= $piutang['id'] ?>" class="btn btn-warning text-dark fw-bold d-inline-flex align-items-center gap-1">
                <i class="bi bi-cash-coin"></i> Bayar / Cicil Lagi
            </a>
        <?php endif; ?>
    </div>
</div>

<!-- Alert Notifikasi -->
<?php if (!empty($pesan)): ?>
    <div class="alert alert-<?= ($status === 'sukses') ? 'success' : 'info' ?> alert-dismissible fade show d-flex align-items-center mb-4 shadow-sm" role="alert">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div><?= htmlspecialchars($pesan) ?></div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
<?php endif; ?>

<!-- ========================================== -->
<!-- 6. KARTU RINGKASAN PROGRESS PIUTANG        -->
<!-- ========================================== -->
<div class="row g-3 mb-4">
    <!-- Informasi Pelanggan -->
    <div class="col-md-4">
        <div class="card card-custom p-3 h-100 border-start border-4 border-primary">
            <h6 class="fw-bold text-secondary mb-2 small text-uppercase"><i class="bi bi-person me-1"></i>Informasi Pelanggan</h6>
            <h5 class="fw-bold text-primary mb-1"><?= htmlspecialchars($piutang['nama_pelanggan']) ?></h5>
            <?php if (!empty($piutang['no_hp_pelanggan'])): ?>
                <div class="small mb-1">
                    <a href="https://wa.me/<?= preg_replace('/[^0-9]/', '', $piutang['no_hp_pelanggan']) ?>" target="_blank" class="text-decoration-none text-success">
                        <i class="bi bi-whatsapp me-1"></i><?= htmlspecialchars($piutang['no_hp_pelanggan']) ?>
                    </a>
                </div>
            <?php endif; ?>
            <div class="text-muted small">
                <i class="bi bi-geo-alt me-1"></i><?= htmlspecialchars($piutang['alamat_pelanggan'] ?? '-') ?: '-' ?>
            </div>
            <div class="mt-auto pt-2 border-top text-muted small">
                Petugas Kasir: <strong><?= htmlspecialchars($piutang['nama_kasir'] ?? 'Kasir') ?></strong>
            </div>
        </div>
    </div>

    <!-- Status Saldo & Progress Pelunasan -->
    <div class="col-md-8">
        <div class="card card-custom p-3 h-100">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold text-secondary mb-0 small text-uppercase"><i class="bi bi-pie-chart me-1"></i>Status Pembayaran Kasbon</h6>
                <span class="small fw-semibold <?= $is_lunas ? 'text-success' : 'text-danger' ?>">
                    <?= $persen_bayar ?>% Terbayar
                </span>
            </div>

            <div class="progress mb-3" style="height: 12px;">
                <div class="progress-bar <?= $is_lunas ? 'bg-success' : 'bg-warning progress-bar-striped progress-bar-animated' ?>" role="progressbar" style="width: <?= $persen_bayar ?>%;" aria-valuenow="<?= $persen_bayar ?>" aria-valuemin="0" aria-valuemax="100"></div>
            </div>

            <div class="row g-2 text-center pt-2 border-top mt-auto">
                <div class="col-4">
                    <span class="text-muted small d-block">Total Kasbon Awal</span>
                    <h5 class="fw-bold font-monospace mb-0">Rp <?= number_format($total_piutang, 0, ',', '.') ?></h5>
                </div>
                <div class="col-4">
                    <span class="text-muted small d-block">Sudah Dibayar</span>
                    <h5 class="fw-bold text-success font-monospace mb-0">Rp <?= number_format($total_terbayar, 0, ',', '.') ?></h5>
                </div>
                <div class="col-4">
                    <span class="text-muted small d-block">Sisa Tagihan</span>
                    <h5 class="fw-bold <?= $is_lunas ? 'text-muted' : 'text-danger' ?> font-monospace mb-0">
                        Rp <?= number_format($sisa_piutang, 0, ',', '.') ?>
                    </h5>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row g-3">
    <!-- ========================================== -->
    <!-- 7. TABEL RIWAYAT CICILAN PEMBAYARAN        -->
    <!-- ========================================== -->
    <div class="col-lg-6">
        <div class="card card-custom h-100">
            <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 class="mb-0 fw-semibold text-secondary"><i class="bi bi-clock-history me-2 text-primary"></i>Riwayat Pembayaran Cicilan</h6>
                <span class="badge bg-light text-dark border"><?= count($cicilan_list) ?> Catatan</span>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-custom align-middle mb-0">
                    <thead>
                        <tr>
                            <th class="text-center" style="width: 45px;">No</th>
                            <th>Tanggal & Waktu</th>
                            <th class="text-end">Jumlah Bayar</th>
                            <th>Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php 
                        $no_c = 1;
                        if (!empty($cicilan_list)):
                            foreach ($cicilan_list as $c):
                        ?>
                            <tr>
                                <td class="text-center text-muted"><?= $no_c++ ?></td>
                                <td class="small font-monospace">
                                    <?= date('d/m/Y H:i', strtotime($c['tanggal_bayar'])) ?>
                                </td>
                                <td class="text-end fw-bold font-monospace text-success">
                                    Rp <?= number_format($c['jumlah_bayar'], 0, ',', '.') ?>
                                </td>
                                <td class="small text-muted">
                                    <?= htmlspecialchars($c['keterangan'] ?? '-') ?>
                                </td>
                            </tr>
                        <?php 
                            endforeach;
                        else:
                        ?>
                            <tr>
                                <td colspan="4" class="text-center py-4 text-muted small">
                                    <i class="bi bi-info-circle me-1"></i> Belum ada pembayaran yang dicatat (Uang Muka 0).
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- ========================================== -->
    <!-- 8. TABEL RINCIAN BARANG TRANSAKSI          -->
    <!-- ========================================== -->
    <div class="col-lg-6">
        <div class="card card-custom h-100">
            <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 class="mb-0 fw-semibold text-secondary"><i class="bi bi-basket me-2 text-success"></i>Barang yang Dikreditkan / Kasbon</h6>
                <span class="badge bg-light text-dark border"><?= count($items_list) ?> Item</span>
            </div>
            <div class="table-responsive">
                <table class="table table-hover table-custom align-middle mb-0">
                    <thead>
                        <tr>
                            <th class="text-center" style="width: 45px;">No</th>
                            <th>Produk</th>
                            <th class="text-center" style="width: 70px;">Qty</th>
                            <th class="text-end">Harga</th>
                            <th class="text-end">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php 
                        $no_i = 1;
                        foreach ($items_list as $it):
                        ?>
                            <tr>
                                <td class="text-center text-muted"><?= $no_i++ ?></td>
                                <td>
                                    <span class="fw-semibold text-dark small"><?= htmlspecialchars($it['nama_barang']) ?></span>
                                </td>
                                <td class="text-center small">
                                    <?= $it['jumlah'] ?> <?= htmlspecialchars($it['satuan'] ?? 'pcs') ?>
                                </td>
                                <td class="text-end font-monospace small text-muted">
                                    Rp <?= number_format($it['harga_satuan'], 0, ',', '.') ?>
                                </td>
                                <td class="text-end font-monospace small fw-bold">
                                    Rp <?= number_format($it['subtotal'], 0, ',', '.') ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                    <tfoot class="table-light">
                        <tr>
                            <th colspan="4" class="text-end small">Total Belanja:</th>
                            <th class="text-end font-monospace fw-bold text-primary">Rp <?= number_format($piutang['total_belanja'], 0, ',', '.') ?></th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</div>

<?php
require_once __DIR__ . '/../template/footer.php';
?>
