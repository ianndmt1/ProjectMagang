<?php
/**
 * File: master/barang.php
 * Deskripsi: Halaman antarmuka manajemen produk/barang (Master Barang)
 * Hak Akses: Khusus role 'pemilik'
 */

// ==========================================
// 1. BUFFERING, MEMUAT TEMPLATE & CEK HAK AKSES
// ==========================================
ob_start();
$page_title  = 'Master Barang';
$active_menu = 'master_barang';
require_once __DIR__ . '/../template/header.php';

// Proteksi hak akses khusus Pemilik
cek_role('pemilik');

// ==========================================
// 2. MENANGKAP NOTIFIKASI, FILTER & PENCARIAN
// ==========================================
$status          = $_GET['status'] ?? '';
$pesan           = $_GET['pesan'] ?? '';
$cari            = trim($_GET['cari'] ?? '');
$filter_kategori = isset($_GET['kategori']) && $_GET['kategori'] !== '' ? (int)$_GET['kategori'] : '';

// Mengambil seluruh daftar kategori untuk dropdown tambah/edit & opsi filter
$q_kategori = mysqli_query($conn, "SELECT id, nama_kategori FROM kategori ORDER BY nama_kategori ASC");
$kategori_options = [];
while ($kat = mysqli_fetch_assoc($q_kategori)) {
    $kategori_options[] = $kat;
}

// ==========================================
// 3. MENGAMBIL DATA BARANG DENGAN PREPARED STATEMENT & LEFT JOIN KATEGORI
// ==========================================
$where_clauses = [];
$params = [];
$param_types = '';

// Filter pencarian nama atau kode barang
if (!empty($cari)) {
    $where_clauses[] = "(b.kode_barang LIKE ? OR b.nama_barang LIKE ?)";
    $keyword = "%{$cari}%";
    $params[] = $keyword;
    $params[] = $keyword;
    $param_types .= 'ss';
}

// Filter berdasarkan kategori jika dipilih
if ($filter_kategori !== '') {
    if ($filter_kategori === 0) {
        $where_clauses[] = "(b.id_kategori IS NULL OR b.id_kategori = 0)";
    } else {
        $where_clauses[] = "b.id_kategori = ?";
        $params[] = $filter_kategori;
        $param_types .= 'i';
    }
}

$where_sql = !empty($where_clauses) ? "WHERE " . implode(" AND ", $where_clauses) : "";

$query = "SELECT b.*, k.nama_kategori,
          (SELECT COUNT(*) FROM transaksi_detail td WHERE td.id_barang = b.id) AS total_transaksi
          FROM barang b 
          LEFT JOIN kategori k ON b.id_kategori = k.id 
          {$where_sql}
          ORDER BY b.id DESC";

if (!empty($params)) {
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, $param_types, ...$params);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
} else {
    $result = mysqli_query($conn, $query);
}

// Menghitung ringkasan statistik barang
$q_ringkasan = mysqli_query($conn, "SELECT 
    COUNT(*) as total_item, 
    SUM(stok) as total_stok,
    SUM(stok * harga_beli) as total_aset,
    SUM(CASE WHEN stok <= 5 THEN 1 ELSE 0 END) as stok_kritis 
    FROM barang");
$ringkasan = mysqli_fetch_assoc($q_ringkasan);
?>

<!-- Header Halaman & Tombol Aksi -->
<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
    <div>
        <h4 class="fw-bold mb-1"><i class="bi bi-box-seam me-2 text-primary"></i>Master Data Barang</h4>
        <p class="text-muted small mb-0">Kelola daftar inventaris barang dagangan, harga jual, dan persediaan stok</p>
    </div>
    <div class="d-flex gap-2">
        <button type="button" class="btn btn-primary d-inline-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#modalTambahBarang">
            <i class="bi bi-plus-circle-fill"></i> Tambah Barang
        </button>
    </div>
</div>

<!-- ========================================== -->
<!-- 4. KARTU STATISTIK RINGKASAN BARANG        -->
<!-- ========================================== -->
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-xl-3">
        <div class="card card-custom p-3 border-start border-4 border-primary">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Total Jenis Barang</span>
                    <h4 class="fw-bold mb-0 mt-1"><?= number_format($ringkasan['total_item'] ?? 0, 0, ',', '.') ?></h4>
                </div>
                <div class="bg-primary-subtle text-primary p-3 rounded-3 fs-4">
                    <i class="bi bi-boxes"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-xl-3">
        <div class="card card-custom p-3 border-start border-4 border-success">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Total Unit Stok</span>
                    <h4 class="fw-bold mb-0 mt-1"><?= number_format($ringkasan['total_stok'] ?? 0, 0, ',', '.') ?></h4>
                </div>
                <div class="bg-success-subtle text-success p-3 rounded-3 fs-4">
                    <i class="bi bi-check2-circle"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-xl-3">
        <div class="card card-custom p-3 border-start border-4 border-info">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Total Nilai Aset</span>
                    <h5 class="fw-bold mb-0 mt-1 text-truncate">Rp <?= number_format($ringkasan['total_aset'] ?? 0, 0, ',', '.') ?></h5>
                </div>
                <div class="bg-info-subtle text-info p-3 rounded-3 fs-4">
                    <i class="bi bi-cash-stack"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-xl-3">
        <div class="card card-custom p-3 border-start border-4 border-warning">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Stok Menipis (&le; 5)</span>
                    <h4 class="fw-bold mb-0 mt-1 text-warning"><?= number_format($ringkasan['stok_kritis'] ?? 0, 0, ',', '.') ?></h4>
                </div>
                <div class="bg-warning-subtle text-warning p-3 rounded-3 fs-4">
                    <i class="bi bi-exclamation-triangle"></i>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 5. ALERT NOTIFIKASI                       -->
<!-- ========================================== -->
<?php if (!empty($pesan)): ?>
    <div class="alert alert-<?= ($status === 'sukses') ? 'success' : 'danger' ?> alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
        <i class="bi bi-<?= ($status === 'sukses') ? 'check-circle-fill' : 'exclamation-triangle-fill' ?> me-2 fs-5"></i>
        <div><?= htmlspecialchars($pesan) ?></div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
<?php endif; ?>

<!-- ========================================== -->
<!-- 6. KARTU TABEL DATA BARANG                 -->
<!-- ========================================== -->
<div class="card card-custom">
    <div class="card-header bg-white py-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <h6 class="mb-0 fw-semibold text-secondary"><i class="bi bi-list-stars me-2"></i>Daftar Barang & Inventaris</h6>
        <!-- Form Filter & Pencarian -->
        <form action="" method="GET" class="d-flex flex-wrap gap-2" style="max-width: 500px;">
            <!-- Dropdown Filter Kategori -->
            <select name="kategori" class="form-select form-select-sm" style="width: auto;" onchange="this.form.submit()">
                <option value="">Semua Kategori</option>
                <?php foreach ($kategori_options as $kat): ?>
                    <option value="<?= $kat['id'] ?>" <?= ($filter_kategori !== '' && $filter_kategori === (int)$kat['id']) ? 'selected' : '' ?>>
                        <?= htmlspecialchars($kat['nama_kategori']) ?>
                    </option>
                <?php endforeach; ?>
                <option value="0" <?= ($filter_kategori === 0) ? 'selected' : '' ?>>Tanpa Kategori</option>
            </select>

            <div class="input-group input-group-sm flex-fill">
                <input type="text" name="cari" class="form-control" placeholder="Cari kode / nama barang..." value="<?= htmlspecialchars($cari) ?>">
                <button class="btn btn-outline-secondary" type="submit"><i class="bi bi-search"></i></button>
                <?php if (!empty($cari) || $filter_kategori !== ''): ?>
                    <a href="barang.php" class="btn btn-outline-danger" title="Reset filter"><i class="bi bi-x-lg"></i></a>
                <?php endif; ?>
            </div>
        </form>
    </div>
    <div class="table-responsive">
        <table class="table table-hover table-custom align-middle mb-0">
            <thead>
                <tr>
                    <th class="text-center" style="width: 50px;">No</th>
                    <th>Kode Barang</th>
                    <th>Nama Barang</th>
                    <th>Kategori</th>
                    <th class="text-end">Harga Beli</th>
                    <th class="text-end">Harga Jual</th>
                    <th class="text-center">Stok</th>
                    <th>Satuan</th>
                    <th class="text-center" style="width: 140px;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $no = 1;
                $has_data = false;
                if ($result):
                    while ($b = mysqli_fetch_assoc($result)): 
                        $has_data = true;
                        $terpakai = ((int)$b['total_transaksi'] > 0);
                ?>
                    <tr>
                        <td class="text-center text-muted"><?= $no++ ?></td>
                        <td>
                            <span class="badge bg-light text-dark border font-monospace px-2 py-1">
                                <?= htmlspecialchars($b['kode_barang']) ?>
                            </span>
                        </td>
                        <td>
                            <span class="fw-semibold text-dark"><?= htmlspecialchars($b['nama_barang']) ?></span>
                            <?php if ($terpakai): ?>
                                <span class="badge bg-info-subtle text-info border border-info-subtle ms-1 small" title="Sudah memiliki riwayat transaksi">
                                    <i class="bi bi-receipt"></i> Ada Riwayat
                                </span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php if (!empty($b['nama_kategori'])): ?>
                                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                                    <i class="bi bi-tag me-1"></i><?= htmlspecialchars($b['nama_kategori']) ?>
                                </span>
                            <?php else: ?>
                                <span class="text-muted small fst-italic">- Tanpa Kategori -</span>
                            <?php endif; ?>
                        </td>
                        <td class="text-end text-muted font-monospace">
                            Rp <?= number_format($b['harga_beli'], 0, ',', '.') ?>
                        </td>
                        <td class="text-end fw-semibold text-primary font-monospace">
                            Rp <?= number_format($b['harga_jual'], 0, ',', '.') ?>
                        </td>
                        <td class="text-center">
                            <?php if ((int)$b['stok'] <= 0): ?>
                                <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded-pill">Habis (0)</span>
                            <?php elseif ((int)$b['stok'] <= 5): ?>
                                <span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded-pill">Sisa <?= $b['stok'] ?></span>
                            <?php else: ?>
                                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill"><?= $b['stok'] ?></span>
                            <?php endif; ?>
                        </td>
                        <td class="text-muted"><?= htmlspecialchars($b['satuan'] ?? 'pcs') ?></td>
                        <td class="text-center">
                            <div class="btn-group btn-group-sm">
                                <!-- Tombol Edit -->
                                <button type="button" class="btn btn-outline-primary btn-edit-barang" 
                                        data-id="<?= $b['id'] ?>"
                                        data-kode="<?= htmlspecialchars($b['kode_barang']) ?>"
                                        data-nama="<?= htmlspecialchars($b['nama_barang']) ?>"
                                        data-kategori="<?= htmlspecialchars($b['id_kategori'] ?? '') ?>"
                                        data-beli="<?= (float)$b['harga_beli'] ?>"
                                        data-jual="<?= (float)$b['harga_jual'] ?>"
                                        data-stok="<?= (int)$b['stok'] ?>"
                                        data-satuan="<?= htmlspecialchars($b['satuan'] ?? 'pcs') ?>"
                                        title="Edit Barang">
                                    <i class="bi bi-pencil-square"></i>
                                </button>
                                <!-- Tombol Hapus (Dilindungi jika sudah ada transaksi) -->
                                <?php if ($terpakai): ?>
                                    <button type="button" class="btn btn-outline-secondary" disabled 
                                            title="Barang tidak dapat dihapus karena sudah ada riwayat transaksi">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                <?php else: ?>
                                    <a href="barang_proses.php?aksi=hapus&id=<?= $b['id'] ?>" 
                                       class="btn btn-outline-danger" 
                                       data-konfirmasi-hapus="barang_proses.php?aksi=hapus&id=<?= $b['id'] ?>"
                                       data-label="barang <?= htmlspecialchars($b['nama_barang']) ?>"
                                       title="Hapus Barang">
                                        <i class="bi bi-trash"></i>
                                    </a>
                                <?php endif; ?>
                            </div>
                        </td>
                    </tr>
                <?php 
                    endwhile;
                endif;
                if (!$has_data): 
                ?>
                    <tr>
                        <td colspan="9" class="text-center py-4 text-muted">
                            <i class="bi bi-box-seam fs-2 d-block mb-1 text-secondary"></i>
                            Tidak ada data barang ditemukan.
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ========================================== -->
<!-- 7. MODAL TAMBAH BARANG                     -->
<!-- ========================================== -->
<div class="modal fade" id="modalTambahBarang" tabindex="-1" aria-labelledby="modalTambahBarangLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content border-0 shadow">
            <form action="barang_proses.php?aksi=tambah" method="POST" autocomplete="off">
                <?= csrf_field() ?>
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="modalTambahBarangLabel"><i class="bi bi-plus-circle-fill me-2"></i>Tambah Barang Baru</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="tambah_kode" class="form-label fw-semibold small">Kode Barang / Barcode <span class="text-danger">*</span></label>
                            <input type="text" class="form-control text-uppercase font-monospace" id="tambah_kode" name="kode_barang" placeholder="Contoh: BRG001 atau barcode" required>
                            <div class="invalid-feedback" id="feedback_tambah_kode">Kode barang sudah digunakan, gunakan kode lain!</div>
                            <div class="valid-feedback" id="valid_tambah_kode">Kode barang tersedia.</div>
                            <small class="text-muted hint-tambah-kode">Harus unik untuk setiap produk</small>
                        </div>
                        <div class="col-md-6">
                            <label for="tambah_nama" class="form-label fw-semibold small">Nama Barang <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="tambah_nama" name="nama_barang" placeholder="Contoh: Minyak Goreng 1L" required>
                        </div>
                        <div class="col-md-6">
                            <label for="tambah_id_kategori" class="form-label fw-semibold small">Kategori Barang</label>
                            <select class="form-select" id="tambah_id_kategori" name="id_kategori">
                                <option value="">-- Tanpa Kategori --</option>
                                <?php foreach ($kategori_options as $kat): ?>
                                    <option value="<?= $kat['id'] ?>"><?= htmlspecialchars($kat['nama_kategori']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label for="tambah_satuan" class="form-label fw-semibold small">Satuan Barang</label>
                            <input type="text" class="form-control" id="tambah_satuan" name="satuan" placeholder="Contoh: pcs, kg, botol, pack" value="pcs">
                        </div>
                        <div class="col-md-6">
                            <label for="tambah_harga_beli" class="form-label fw-semibold small">Harga Beli (Modal)</label>
                            <div class="input-group">
                                <span class="input-group-text">Rp</span>
                                <input type="text" inputmode="numeric" class="form-control format-ribuan" id="tambah_harga_beli" name="harga_beli" placeholder="0" value="0">
                            </div>
                            <div class="form-text small text-muted">Masukkan angka, pemisah ribuan otomatis</div>
                        </div>
                        <div class="col-md-6">
                            <label for="tambah_harga_jual" class="form-label fw-semibold small">Harga Jual <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text">Rp</span>
                                <input type="text" inputmode="numeric" class="form-control format-ribuan" id="tambah_harga_jual" name="harga_jual" placeholder="Contoh: 15.000" required>
                            </div>
                            <div class="form-text small text-muted">Masukkan angka, pemisah ribuan otomatis</div>
                        </div>
                        <div class="col-md-12">
                            <label for="tambah_stok" class="form-label fw-semibold small">Jumlah Stok Awal <span class="text-danger">*</span></label>
                            <input type="number" min="0" class="form-control" id="tambah_stok" name="stok" placeholder="Contoh: 50" value="0" required>
                        </div>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-primary" id="btnSimpanBarang"><i class="bi bi-save me-1"></i> Simpan Barang</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 8. MODAL EDIT BARANG                       -->
<!-- ========================================== -->
<div class="modal fade" id="modalEditBarang" tabindex="-1" aria-labelledby="modalEditBarangLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content border-0 shadow">
            <form action="barang_proses.php?aksi=edit" method="POST" autocomplete="off">
                <?= csrf_field() ?>
                <input type="hidden" id="edit_id" name="id">
                <div class="modal-header bg-warning-subtle text-dark">
                    <h5 class="modal-title fw-bold" id="modalEditBarangLabel"><i class="bi bi-pencil-square me-2"></i>Edit Data Barang</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="edit_kode" class="form-label fw-semibold small">Kode Barang <span class="text-danger">*</span></label>
                            <input type="text" class="form-control text-uppercase font-monospace" id="edit_kode" name="kode_barang" required>
                            <div class="invalid-feedback" id="feedback_edit_kode">Kode barang sudah dipakai oleh barang lain!</div>
                            <div class="valid-feedback" id="valid_edit_kode">Kode barang tersedia.</div>
                        </div>
                        <div class="col-md-6">
                            <label for="edit_nama" class="form-label fw-semibold small">Nama Barang <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="edit_nama" name="nama_barang" required>
                        </div>
                        <div class="col-md-6">
                            <label for="edit_id_kategori" class="form-label fw-semibold small">Kategori Barang</label>
                            <select class="form-select" id="edit_id_kategori" name="id_kategori">
                                <option value="">-- Tanpa Kategori --</option>
                                <?php foreach ($kategori_options as $kat): ?>
                                    <option value="<?= $kat['id'] ?>"><?= htmlspecialchars($kat['nama_kategori']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label for="edit_satuan" class="form-label fw-semibold small">Satuan Barang</label>
                            <input type="text" class="form-control" id="edit_satuan" name="satuan">
                        </div>
                        <div class="col-md-6">
                            <label for="edit_harga_beli" class="form-label fw-semibold small">Harga Beli (Modal)</label>
                            <div class="input-group">
                                <span class="input-group-text">Rp</span>
                                <input type="text" inputmode="numeric" class="form-control format-ribuan" id="edit_harga_beli" name="harga_beli" required>
                            </div>
                            <div class="form-text small text-muted">Masukkan angka, pemisah ribuan otomatis</div>
                        </div>
                        <div class="col-md-6">
                            <label for="edit_harga_jual" class="form-label fw-semibold small">Harga Jual <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <span class="input-group-text">Rp</span>
                                <input type="text" inputmode="numeric" class="form-control format-ribuan" id="edit_harga_jual" name="harga_jual" required>
                            </div>
                            <div class="form-text small text-muted">Masukkan angka, pemisah ribuan otomatis</div>
                        </div>
                        <div class="col-md-12">
                            <label for="edit_stok" class="form-label fw-semibold small">Jumlah Stok <span class="text-danger">*</span></label>
                            <input type="number" min="0" class="form-control" id="edit_stok" name="stok" required>
                        </div>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-primary" id="btnSimpanEditBarang"><i class="bi bi-check-lg me-1"></i> Simpan Perubahan</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 9. JAVASCRIPT UNTUK INTERAKSI MODAL & VALIDASI -->
<!-- ========================================== -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // ----------------------------------------------------
    // Validasi Real-time Kode Barang Duplikat
    // ----------------------------------------------------
    function pasangValidasiKode(inputEl, submitBtn, getIdCallback) {
        if (!inputEl || !submitBtn) return;
        let timer = null;

        function cekDuplikat() {
            const kode = inputEl.value.trim().toUpperCase();
            inputEl.value = kode;
            const currentId = getIdCallback ? getIdCallback() : 0;

            if (!kode) {
                inputEl.classList.remove('is-invalid', 'is-valid');
                submitBtn.removeAttribute('disabled');
                return;
            }

            fetch(`cek_kode_ajax.php?kode_barang=${encodeURIComponent(kode)}&id=${encodeURIComponent(currentId)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.exists) {
                        inputEl.classList.add('is-invalid');
                        inputEl.classList.remove('is-valid');
                        submitBtn.setAttribute('disabled', 'disabled');
                    } else {
                        inputEl.classList.remove('is-invalid');
                        inputEl.classList.add('is-valid');
                        submitBtn.removeAttribute('disabled');
                    }
                })
                .catch(err => {
                    console.error('Gagal memeriksa kode barang:', err);
                });
        }

        inputEl.addEventListener('input', function() {
            clearTimeout(timer);
            timer = setTimeout(cekDuplikat, 500);
        });

        inputEl.addEventListener('blur', function() {
            clearTimeout(timer);
            cekDuplikat();
        });
    }

    // Pasang pada Modal Tambah
    const inputTambahKode = document.getElementById('tambah_kode');
    const btnSimpanTambah = document.getElementById('btnSimpanBarang');
    pasangValidasiKode(inputTambahKode, btnSimpanTambah, () => 0);

    // Pasang pada Modal Edit
    const inputEditKode = document.getElementById('edit_kode');
    const btnSimpanEdit = document.getElementById('btnSimpanEditBarang');
    pasangValidasiKode(inputEditKode, btnSimpanEdit, () => document.getElementById('edit_id').value);

    // Reset status validasi saat modal tambah ditutup
    const modalTambahBarangEl = document.getElementById('modalTambahBarang');
    if (modalTambahBarangEl) {
        modalTambahBarangEl.addEventListener('hidden.bs.modal', function () {
            if (inputTambahKode) inputTambahKode.classList.remove('is-invalid', 'is-valid');
            if (btnSimpanTambah) btnSimpanTambah.removeAttribute('disabled');
        });
    }

    // ----------------------------------------------------
    // Interaksi Tombol Edit Barang
    // ----------------------------------------------------
    const editButtons = document.querySelectorAll('.btn-edit-barang');
    const modalEditBarang = new bootstrap.Modal(document.getElementById('modalEditBarang'));

    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('edit_id').value          = this.dataset.id;
            document.getElementById('edit_kode').value        = this.dataset.kode;
            document.getElementById('edit_nama').value        = this.dataset.nama;
            document.getElementById('edit_id_kategori').value = this.dataset.kategori || '';
            document.getElementById('edit_stok').value        = this.dataset.stok;
            document.getElementById('edit_satuan').value      = this.dataset.satuan;

            // Set nilai harga dan picu formatRibuan
            const inputBeli = document.getElementById('edit_harga_beli');
            const inputJual = document.getElementById('edit_harga_jual');
            if (inputBeli) {
                inputBeli.value = this.dataset.beli || 0;
                inputBeli.dispatchEvent(new Event('input'));
            }
            if (inputJual) {
                inputJual.value = this.dataset.jual || 0;
                inputJual.dispatchEvent(new Event('input'));
            }

            // Bersihkan indikator validasi saat membuka edit
            if (inputEditKode) {
                inputEditKode.classList.remove('is-invalid', 'is-valid');
            }
            if (btnSimpanEdit) {
                btnSimpanEdit.removeAttribute('disabled');
            }

            modalEditBarang.show();
        });
    });
});
</script>

<?php
// Tutup statement pencarian jika ada
if (isset($stmt) && $stmt) {
    mysqli_stmt_close($stmt);
}
require_once __DIR__ . '/../template/footer.php';
?>
