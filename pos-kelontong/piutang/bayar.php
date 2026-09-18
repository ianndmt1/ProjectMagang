<?php
/**
 * File: piutang/bayar.php
 * Deskripsi: Form dan pemrosesan pembayaran cicilan / pelunasan kasbon pelanggan
 * Hak Akses: Pemilik & Kasir (Kasir dibatasi pada transaksi yang diinputnya)
 * Aturan:
 *   - Menggunakan Database Transaction (ACID: begin, commit, rollback)
 *   - Prepared statements untuk semua query
 *   - Insert ke tabel pembayaran_piutang
 *   - Update sisa_piutang pada tabel piutang
 *   - Otomatis ubah status menjadi 'lunas' jika sisa_piutang = 0
 *   - Validasi jumlah bayar tidak boleh melebihi sisa piutang
 */

// ==========================================
// 1. BUFFERING, DEPENDENSI & CEK AKSES
// ==========================================
ob_start();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../auth/cek_session.php';

// Hak akses untuk Pemilik & Kasir
cek_role(['pemilik', 'kasir']);

$user_id   = (int)$_SESSION['id'];
$user_role = $_SESSION['role'] ?? 'kasir';

// Tangkap ID piutang
$id_piutang = (int)($_REQUEST['id'] ?? 0);
if ($id_piutang <= 0) {
    header("Location: index.php");
    exit;
}

// ==========================================
// 2. QUERY DETAIL DATA PIUTANG
// ==========================================
$query_cek = "SELECT pt.*, pel.nama AS nama_pelanggan, pel.no_hp AS no_hp_pelanggan, pel.alamat,
                     t.kode_transaksi, t.created_at AS tanggal_transaksi, t.id_kasir,
                     u.nama_lengkap AS nama_kasir,
                     (SELECT COALESCE(SUM(pp.jumlah_bayar), 0) FROM pembayaran_piutang pp WHERE pp.id_piutang = pt.id) AS total_sudah_bayar
              FROM piutang pt
              JOIN pelanggan pel ON pt.id_pelanggan = pel.id
              JOIN transaksi t ON pt.id_transaksi = t.id
              LEFT JOIN users u ON t.id_kasir = u.id
              WHERE pt.id = ? LIMIT 1";

$stmt_cek = mysqli_prepare($conn, $query_cek);
mysqli_stmt_bind_param($stmt_cek, "i", $id_piutang);
mysqli_stmt_execute($stmt_cek);
$res_piutang = mysqli_stmt_get_result($stmt_cek);
$piutang = mysqli_fetch_assoc($res_piutang);
mysqli_stmt_close($stmt_cek);

if (!$piutang) {
    header("Location: index.php?pesan=" . urlencode("Data piutang tidak ditemukan!"));
    exit;
}

// Validasi otorisasi jika role kasir: kasir hanya memproses transaksi yang ia layani
if ($user_role === 'kasir' && (int)$piutang['id_kasir'] !== $user_id) {
    header("Location: index.php?pesan=" . urlencode("Akses ditolak: Anda hanya dapat memproses pembayaran untuk transaksi yang Anda buat!"));
    exit;
}

// Jika piutang sudah berstatus lunas
if ($piutang['status'] === 'lunas' || (float)$piutang['sisa_piutang'] <= 0) {
    header("Location: detail.php?id={$id_piutang}&pesan=" . urlencode("Transaksi kasbon ini sudah lunas!"));
    exit;
}

$pesan_error = '';

// ==========================================
// 3. PEMROSESAN PEMBAYARAN CICILAN / PELUNASAN (POST)
// ==========================================
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['proses_bayar'])) {
    if (!validasi_csrf()) {
        $pesan_error = 'Token keamanan CSRF tidak valid atau sesi telah kedaluwarsa!';
    } else {
        $jumlah_bayar = (float)str_replace(['.', ','], ['', '.'], $_POST['jumlah_bayar'] ?? 0);
        $keterangan   = trim($_POST['keterangan'] ?? 'Cicilan Kasbon');

        if ($jumlah_bayar <= 0) {
            $pesan_error = 'Jumlah pembayaran harus lebih dari Rp 0!';
        } else {
            // Memulai Transaksi Database (ACID)
            mysqli_begin_transaction($conn);

            try {
                // Kunci baris data piutang terkini (FOR UPDATE) untuk menghindari race condition
                $stmt_lock = mysqli_prepare($conn, "SELECT total_piutang, sisa_piutang, status FROM piutang WHERE id = ? FOR UPDATE");
                mysqli_stmt_bind_param($stmt_lock, "i", $id_piutang);
                mysqli_stmt_execute($stmt_lock);
                $res_lock = mysqli_stmt_get_result($stmt_lock);
                $piutang_terkini = mysqli_fetch_assoc($res_lock);
                mysqli_stmt_close($stmt_lock);

                if (!$piutang_terkini) {
                    throw new Exception("Data piutang tidak ditemukan dalam sistem!");
                }

                $sisa_sebelumnya = (float)$piutang_terkini['sisa_piutang'];

                // Validasi: Jumlah bayar tidak boleh melebihi sisa kasbon
                if ($jumlah_bayar > $sisa_sebelumnya) {
                    throw new Exception("Jumlah bayar (Rp " . number_format($jumlah_bayar, 0, ',', '.') . ") tidak boleh melebihi sisa kasbon (Rp " . number_format($sisa_sebelumnya, 0, ',', '.') . ")!");
                }

                // 1. Insert ke tabel pembayaran_piutang
                $stmt_insert_bayar = mysqli_prepare($conn, "INSERT INTO pembayaran_piutang (id_piutang, jumlah_bayar, tanggal_bayar, keterangan) VALUES (?, ?, NOW(), ?)");
                mysqli_stmt_bind_param($stmt_insert_bayar, "ids", $id_piutang, $jumlah_bayar, $keterangan);
                if (!mysqli_stmt_execute($stmt_insert_bayar)) {
                    throw new Exception("Gagal menyimpan data riwayat pembayaran!");
                }
                mysqli_stmt_close($stmt_insert_bayar);

                // 2. Hitung sisa piutang baru & tentukan status lunas
                $sisa_baru   = max(0, $sisa_sebelumnya - $jumlah_bayar);
                $status_baru = ($sisa_baru <= 0) ? 'lunas' : 'belum_lunas';

                // 3. Update data sisa_piutang dan status di tabel piutang
                $stmt_update_piutang = mysqli_prepare($conn, "UPDATE piutang SET sisa_piutang = ?, status = ? WHERE id = ?");
                mysqli_stmt_bind_param($stmt_update_piutang, "dsi", $sisa_baru, $status_baru, $id_piutang);
                if (!mysqli_stmt_execute($stmt_update_piutang)) {
                    throw new Exception("Gagal memperbarui saldo sisa piutang!");
                }
                mysqli_stmt_close($stmt_update_piutang);

                // Jika seluruh eksekusi berhasil, COMMIT transaksi DB
                mysqli_commit($conn);

                $pesan_sukses = ($status_baru === 'lunas') 
                    ? "Pembayaran sebesar Rp " . number_format($jumlah_bayar, 0, ',', '.') . " berhasil dicatat. Status kasbon kini LUNAS!"
                    : "Cicilan sebesar Rp " . number_format($jumlah_bayar, 0, ',', '.') . " berhasil dicatat. Sisa kasbon: Rp " . number_format($sisa_baru, 0, ',', '.');

                header("Location: detail.php?id={$id_piutang}&status=sukses&pesan=" . urlencode($pesan_sukses));
                exit;

            } catch (Exception $e) {
                // Rollback transaksi jika terjadi kendala
                mysqli_rollback($conn);
                $pesan_error = $e->getMessage();
            }
        }
    }
}

// ==========================================
// 4. MEMUAT TEMPLATE TAMPILAN
// ==========================================
$page_title  = 'Bayar Kasbon #' . $piutang['kode_transaksi'];
$active_menu = 'piutang';
require_once __DIR__ . '/../template/header.php';
?>

<div class="row justify-content-center">
    <div class="col-lg-8 col-xl-7">
        <!-- Tombol Kembali -->
        <div class="mb-3">
            <a href="index.php" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
                <i class="bi bi-arrow-left"></i> Kembali ke Daftar Piutang
            </a>
        </div>

        <!-- Alert Notifikasi Error -->
        <?php if (!empty($pesan_error)): ?>
            <div class="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4 shadow-sm" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div><?= htmlspecialchars($pesan_error) ?></div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>

        <!-- Kartu Utama Pembayaran -->
        <div class="card card-custom shadow-sm border-0">
            <div class="card-header bg-warning bg-gradient text-dark py-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold mb-0"><i class="bi bi-cash-coin me-2"></i>Form Pembayaran Kasbon</h5>
                    <span class="badge bg-dark text-white font-monospace"><?= htmlspecialchars($piutang['kode_transaksi']) ?></span>
                </div>
            </div>
            <div class="card-body p-4">
                <!-- Ringkasan Info Pelanggan & Piutang -->
                <div class="p-3 bg-light rounded-3 mb-4 border">
                    <div class="row g-2">
                        <div class="col-sm-6">
                            <span class="text-muted small d-block">Nama Pelanggan</span>
                            <h6 class="fw-bold mb-0 text-primary"><?= htmlspecialchars($piutang['nama_pelanggan']) ?></h6>
                            <?php if (!empty($piutang['no_hp_pelanggan'])): ?>
                                <small class="text-muted"><i class="bi bi-whatsapp text-success me-1"></i><?= htmlspecialchars($piutang['no_hp_pelanggan']) ?></small>
                            <?php endif; ?>
                        </div>
                        <div class="col-sm-6 text-sm-end">
                            <span class="text-muted small d-block">Tanggal Transaksi</span>
                            <span class="fw-semibold text-dark small"><?= date('d F Y, H:i', strtotime($piutang['tanggal_transaksi'])) ?></span>
                        </div>
                    </div>
                    <hr class="my-2 text-secondary">
                    <div class="row g-2 pt-1">
                        <div class="col-4">
                            <span class="text-muted small d-block">Total Kasbon</span>
                            <span class="fw-bold font-monospace">Rp <?= number_format($piutang['total_piutang'], 0, ',', '.') ?></span>
                        </div>
                        <div class="col-4">
                            <span class="text-muted small d-block">Sudah Terbayar</span>
                            <span class="fw-bold text-success font-monospace">Rp <?= number_format($piutang['total_sudah_bayar'], 0, ',', '.') ?></span>
                        </div>
                        <div class="col-4 text-end">
                            <span class="text-muted small d-block">Sisa Tagihan</span>
                            <h5 class="fw-bold text-danger font-monospace mb-0">Rp <?= number_format($piutang['sisa_piutang'], 0, ',', '.') ?></h5>
                        </div>
                    </div>
                </div>

                <!-- Form Input Pembayaran -->
                <form action="" method="POST" id="formBayarPiutang" autocomplete="off">
                    <?= csrf_field() ?>
                    <input type="hidden" name="proses_bayar" value="1">
                    <input type="hidden" id="maxSisa" value="<?= (float)$piutang['sisa_piutang'] ?>">

                    <!-- Input Nominal Pembayaran -->
                    <div class="mb-3">
                        <label for="inputJumlahBayar" class="form-label fw-bold text-secondary">Jumlah Uang Pembayaran <span class="text-danger">*</span></label>
                        <div class="input-group input-group-lg">
                            <span class="input-group-text bg-white fw-bold">Rp</span>
                            <input type="number" step="any" min="1" max="<?= (float)$piutang['sisa_piutang'] ?>" class="form-control text-end fw-bold font-monospace fs-4" id="inputJumlahBayar" name="jumlah_bayar" placeholder="0" required autofocus>
                        </div>
                        <small class="text-muted">Maksimal pembayaran adalah sisa kasbon: <strong>Rp <?= number_format($piutang['sisa_piutang'], 0, ',', '.') ?></strong></small>
                    </div>

                    <!-- Tombol Cepat Bayar Lunas -->
                    <div class="d-flex flex-wrap gap-2 mb-3">
                        <button type="button" class="btn btn-outline-success btn-sm fw-semibold" id="btnBayarLunas">
                            <i class="bi bi-check-all me-1"></i> Bayar Lunas Semua (Rp <?= number_format($piutang['sisa_piutang'], 0, ',', '.') ?>)
                        </button>
                    </div>

                    <!-- Preview Sisa Kasbon Setelah Pembayaran -->
                    <div class="p-3 bg-white rounded-3 border mb-3 d-flex justify-content-between align-items-center">
                        <span class="fw-semibold text-secondary small">Perkiraan Sisa Setelah Pembayaran:</span>
                        <h5 class="fw-bold mb-0 font-monospace" id="previewSisaSetelahBayar">Rp <?= number_format($piutang['sisa_piutang'], 0, ',', '.') ?></h5>
                    </div>

                    <!-- Input Keterangan / Catatan Pembayaran -->
                    <div class="mb-4">
                        <label for="inputKeterangan" class="form-label fw-semibold text-secondary small">Keterangan / Catatan Pembayaran</label>
                        <input type="text" class="form-control" id="inputKeterangan" name="keterangan" placeholder="Contoh: Titip uang kasbon, Cicilan ke-2, Pelunasan" value="Pembayaran Cicilan Kasbon">
                    </div>

                    <!-- Tombol Aksi Simpan -->
                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-warning btn-lg fw-bold text-dark shadow-sm d-flex align-items-center justify-content-center gap-2" id="btnSubmitBayar">
                            <i class="bi bi-check-circle-fill"></i> Simpan Pembayaran Kasbon
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const inputJumlahBayar = document.getElementById('inputJumlahBayar');
    const btnBayarLunas    = document.getElementById('btnBayarLunas');
    const previewSisa      = document.getElementById('previewSisaSetelahBayar');
    const maxSisa          = parseFloat(document.getElementById('maxSisa').value) || 0;
    const btnSubmit        = document.getElementById('btnSubmitBayar');

    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    }

    function updatePreview() {
        const val = parseFloat(inputJumlahBayar.value) || 0;
        const sisaBaru = Math.max(0, maxSisa - val);
        previewSisa.innerText = formatRupiah(sisaBaru);

        if (sisaBaru <= 0 && val >= maxSisa) {
            previewSisa.className = 'fw-bold mb-0 font-monospace text-success';
            previewSisa.innerText = 'Rp 0 (LUNAS)';
        } else {
            previewSisa.className = 'fw-bold mb-0 font-monospace text-danger';
        }

        if (val > maxSisa) {
            btnSubmit.setAttribute('disabled', 'disabled');
        } else if (val > 0) {
            btnSubmit.removeAttribute('disabled');
        } else {
            btnSubmit.setAttribute('disabled', 'disabled');
        }
    }

    inputJumlahBayar.addEventListener('input', updatePreview);

    // Tombol Bayar Lunas Langsung
    btnBayarLunas.addEventListener('click', function() {
        inputJumlahBayar.value = maxSisa;
        document.getElementById('inputKeterangan').value = 'Pelunasan Kasbon';
        updatePreview();
        inputJumlahBayar.focus();
    });
});
</script>

<?php
require_once __DIR__ . '/../template/footer.php';
?>
