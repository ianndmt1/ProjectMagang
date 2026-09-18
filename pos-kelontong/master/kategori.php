<?php
/**
 * File: master/kategori.php
 * Deskripsi: Halaman antarmuka manajemen kategori barang (Master Kategori)
 * Hak Akses: Khusus role 'pemilik'
 * Aturan:
 *   - CRUD Kategori (List, Tambah, Edit, Hapus)
 *   - Cegah hapus kategori jika masih digunakan oleh barang (relasi id_kategori)
 *   - Prepared statement untuk semua query database
 *   - Validasi CSRF pada form POST
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

// Proteksi hak akses khusus Pemilik
cek_role('pemilik');

// ==========================================
// 2. PEMROSESAN AKSI CRUD KATEGORI
// ==========================================
$aksi = $_REQUEST['aksi'] ?? '';

// --- A. PROSES TAMBAH KATEGORI ---
if ($aksi === 'tambah' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validasi_csrf()) {
        header("Location: kategori.php?status=error&pesan=" . urlencode("Token CSRF tidak valid atau sesi telah kedaluwarsa!"));
        exit;
    }

    $nama_kategori = trim($_POST['nama_kategori'] ?? '');

    if (empty($nama_kategori)) {
        header("Location: kategori.php?status=error&pesan=" . urlencode("Nama kategori wajib diisi!"));
        exit;
    }

    // Cek apakah nama kategori sudah ada (case-insensitive)
    $stmt_cek = mysqli_prepare($conn, "SELECT id FROM kategori WHERE LOWER(nama_kategori) = LOWER(?) LIMIT 1");
    mysqli_stmt_bind_param($stmt_cek, "s", $nama_kategori);
    mysqli_stmt_execute($stmt_cek);
    mysqli_stmt_store_result($stmt_cek);

    if (mysqli_stmt_num_rows($stmt_cek) > 0) {
        mysqli_stmt_close($stmt_cek);
        header("Location: kategori.php?status=error&pesan=" . urlencode("Kategori '{$nama_kategori}' sudah ada!"));
        exit;
    }
    mysqli_stmt_close($stmt_cek);

    // Simpan kategori baru ke database
    $stmt_insert = mysqli_prepare($conn, "INSERT INTO kategori (nama_kategori) VALUES (?)");
    mysqli_stmt_bind_param($stmt_insert, "s", $nama_kategori);

    if (mysqli_stmt_execute($stmt_insert)) {
        mysqli_stmt_close($stmt_insert);
        header("Location: kategori.php?status=sukses&pesan=" . urlencode("Kategori '{$nama_kategori}' berhasil ditambahkan."));
    } else {
        mysqli_stmt_close($stmt_insert);
        header("Location: kategori.php?status=error&pesan=" . urlencode("Gagal menambahkan kategori baru!"));
    }
    exit;
}

// --- B. PROSES EDIT KATEGORI ---
elseif ($aksi === 'edit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validasi_csrf()) {
        header("Location: kategori.php?status=error&pesan=" . urlencode("Token CSRF tidak valid atau sesi telah kedaluwarsa!"));
        exit;
    }

    $id            = (int)($_POST['id'] ?? 0);
    $nama_kategori = trim($_POST['nama_kategori'] ?? '');

    if ($id <= 0 || empty($nama_kategori)) {
        header("Location: kategori.php?status=error&pesan=" . urlencode("ID atau nama kategori tidak valid!"));
        exit;
    }

    // Cek apakah nama kategori sudah digunakan oleh kategori lain
    $stmt_cek = mysqli_prepare($conn, "SELECT id FROM kategori WHERE LOWER(nama_kategori) = LOWER(?) AND id != ? LIMIT 1");
    mysqli_stmt_bind_param($stmt_cek, "si", $nama_kategori, $id);
    mysqli_stmt_execute($stmt_cek);
    mysqli_stmt_store_result($stmt_cek);

    if (mysqli_stmt_num_rows($stmt_cek) > 0) {
        mysqli_stmt_close($stmt_cek);
        header("Location: kategori.php?status=error&pesan=" . urlencode("Nama kategori '{$nama_kategori}' sudah digunakan!"));
        exit;
    }
    mysqli_stmt_close($stmt_cek);

    // Update data kategori
    $stmt_update = mysqli_prepare($conn, "UPDATE kategori SET nama_kategori = ? WHERE id = ?");
    mysqli_stmt_bind_param($stmt_update, "si", $nama_kategori, $id);

    if (mysqli_stmt_execute($stmt_update)) {
        mysqli_stmt_close($stmt_update);
        header("Location: kategori.php?status=sukses&pesan=" . urlencode("Kategori berhasil diperbarui menjadi '{$nama_kategori}'."));
    } else {
        mysqli_stmt_close($stmt_update);
        header("Location: kategori.php?status=error&pesan=" . urlencode("Gagal memperbarui kategori!"));
    }
    exit;
}

// --- C. PROSES HAPUS KATEGORI (CEGAH JIKA MASIH DIPAKAI BARANG) ---
elseif ($aksi === 'hapus') {
    $id = (int)($_GET['id'] ?? 0);

    if ($id <= 0) {
        header("Location: kategori.php?status=error&pesan=" . urlencode("ID kategori tidak valid!"));
        exit;
    }

    // Periksa apakah kategori masih berelasi dengan tabel barang
    $stmt_cek = mysqli_prepare($conn, "SELECT COUNT(*) AS total_barang FROM barang WHERE id_kategori = ?");
    mysqli_stmt_bind_param($stmt_cek, "i", $id);
    mysqli_stmt_execute($stmt_cek);
    $res_cek = mysqli_stmt_get_result($stmt_cek);
    $data_cek = mysqli_fetch_assoc($res_cek);
    mysqli_stmt_close($stmt_cek);

    if ($data_cek && (int)$data_cek['total_barang'] > 0) {
        // Blokir penghapusan karena masih dipakai oleh barang
        $jml = (int)$data_cek['total_barang'];
        header("Location: kategori.php?status=error&pesan=" . urlencode("Kategori tidak dapat dihapus karena masih digunakan oleh {$jml} barang! Ubah atau kosongkan kategori barang terkait terlebih dahulu."));
        exit;
    }

    // Jika aman (tidak ada relasi di barang), lakukan penghapusan
    $stmt_hapus = mysqli_prepare($conn, "DELETE FROM kategori WHERE id = ?");
    mysqli_stmt_bind_param($stmt_hapus, "i", $id);

    if (mysqli_stmt_execute($stmt_hapus)) {
        mysqli_stmt_close($stmt_hapus);
        header("Location: kategori.php?status=sukses&pesan=" . urlencode("Kategori berhasil dihapus."));
    } else {
        mysqli_stmt_close($stmt_hapus);
        header("Location: kategori.php?status=error&pesan=" . urlencode("Gagal menghapus kategori!"));
    }
    exit;
}

// ==========================================
// 3. MEMUAT HEADER TAMPILAN
// ==========================================
$page_title  = 'Master Kategori';
$active_menu = 'master_kategori';
require_once __DIR__ . '/../template/header.php';

// ==========================================
// 4. MENANGKAP NOTIFIKASI & PARAMETER FILTER
// ==========================================
$status = $_GET['status'] ?? '';
$pesan  = $_GET['pesan'] ?? '';
$cari   = trim($_GET['cari'] ?? '');

// ==========================================
// 5. QUERY DAFTAR KATEGORI & JUMLAH BARANG
// ==========================================
if (!empty($cari)) {
    $keyword = "%{$cari}%";
    $query = "SELECT k.id, k.nama_kategori, 
              (SELECT COUNT(*) FROM barang b WHERE b.id_kategori = k.id) AS total_barang
              FROM kategori k 
              WHERE k.nama_kategori LIKE ? 
              ORDER BY k.nama_kategori ASC";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "s", $keyword);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
} else {
    $query = "SELECT k.id, k.nama_kategori, 
              (SELECT COUNT(*) FROM barang b WHERE b.id_kategori = k.id) AS total_barang
              FROM kategori k 
              ORDER BY k.nama_kategori ASC";
    $result = mysqli_query($conn, $query);
}

// Menghitung statistik ringkasan kategori
$q_stats = mysqli_query($conn, "SELECT 
    COUNT(*) as total_kategori,
    SUM(CASE WHEN (SELECT COUNT(*) FROM barang b WHERE b.id_kategori = k.id) > 0 THEN 1 ELSE 0 END) as kategori_terpakai
    FROM kategori k");
$stats = mysqli_fetch_assoc($q_stats);

$q_barang_tanpa_kategori = mysqli_query($conn, "SELECT COUNT(*) as total FROM barang WHERE id_kategori IS NULL OR id_kategori = 0");
$barang_tanpa_kat = mysqli_fetch_assoc($q_barang_tanpa_kategori)['total'] ?? 0;
?>

<!-- Header Halaman & Tombol Aksi Tambah -->
<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
    <div>
        <h4 class="fw-bold mb-1"><i class="bi bi-tags me-2 text-primary"></i>Master Data Kategori</h4>
        <p class="text-muted small mb-0">Kelola kelompok/kategori barang untuk klasifikasi produk dan mempermudah kasir dalam transaksi</p>
    </div>
    <div class="d-flex gap-2">
        <button type="button" class="btn btn-primary d-inline-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#modalTambahKategori">
            <i class="bi bi-plus-circle-fill"></i> Tambah Kategori
        </button>
    </div>
</div>

<!-- ========================================== -->
<!-- 6. KARTU STATISTIK RINGKASAN KATEGORI      -->
<!-- ========================================== -->
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-xl-4">
        <div class="card card-custom p-3 border-start border-4 border-primary">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Total Kategori</span>
                    <h4 class="fw-bold mb-0 mt-1"><?= number_format($stats['total_kategori'] ?? 0, 0, ',', '.') ?></h4>
                </div>
                <div class="bg-primary-subtle text-primary p-3 rounded-3 fs-4">
                    <i class="bi bi-tags-fill"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-xl-4">
        <div class="card card-custom p-3 border-start border-4 border-success">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Kategori Aktif (Ada Barang)</span>
                    <h4 class="fw-bold mb-0 mt-1"><?= number_format($stats['kategori_terpakai'] ?? 0, 0, ',', '.') ?></h4>
                </div>
                <div class="bg-success-subtle text-success p-3 rounded-3 fs-4">
                    <i class="bi bi-check-circle-fill"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-xl-4">
        <div class="card card-custom p-3 border-start border-4 border-warning">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Barang Belum Berkategori</span>
                    <h4 class="fw-bold mb-0 mt-1 text-warning"><?= number_format($barang_tanpa_kat, 0, ',', '.') ?></h4>
                </div>
                <div class="bg-warning-subtle text-warning p-3 rounded-3 fs-4">
                    <i class="bi bi-question-diamond-fill"></i>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 7. ALERT NOTIFIKASI FEEDBACK               -->
<!-- ========================================== -->
<?php if (!empty($pesan)): ?>
    <div class="alert alert-<?= ($status === 'sukses') ? 'success' : 'danger' ?> alert-dismissible fade show d-flex align-items-center mb-4 shadow-sm" role="alert">
        <i class="bi bi-<?= ($status === 'sukses') ? 'check-circle-fill' : 'exclamation-triangle-fill' ?> me-2 fs-5"></i>
        <div><?= htmlspecialchars($pesan) ?></div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
<?php endif; ?>

<!-- ========================================== -->
<!-- 8. TABEL DAFTAR KATEGORI                   -->
<!-- ========================================== -->
<div class="card card-custom">
    <div class="card-header bg-white py-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <h6 class="mb-0 fw-semibold text-secondary"><i class="bi bi-list-ul me-2"></i>Daftar Kategori Produk</h6>
        <!-- Form Filter & Pencarian -->
        <form action="" method="GET" class="d-flex gap-2" style="max-width: 320px;">
            <div class="input-group input-group-sm">
                <input type="text" name="cari" class="form-control" placeholder="Cari nama kategori..." value="<?= htmlspecialchars($cari) ?>">
                <button class="btn btn-outline-secondary" type="submit"><i class="bi bi-search"></i></button>
                <?php if (!empty($cari)): ?>
                    <a href="kategori.php" class="btn btn-outline-danger" title="Reset filter"><i class="bi bi-x-lg"></i></a>
                <?php endif; ?>
            </div>
        </form>
    </div>
    <div class="table-responsive">
        <table class="table table-hover table-custom align-middle mb-0">
            <thead>
                <tr>
                    <th class="text-center" style="width: 60px;">No</th>
                    <th>Nama Kategori</th>
                    <th class="text-center" style="width: 180px;">Jumlah Barang</th>
                    <th class="text-center" style="width: 140px;">Status</th>
                    <th class="text-center" style="width: 140px;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $no = 1;
                $has_data = false;
                if ($result):
                    while ($kat = mysqli_fetch_assoc($result)): 
                        $has_data = true;
                        $jml_barang = (int)$kat['total_barang'];
                        $terpakai   = ($jml_barang > 0);
                ?>
                    <tr>
                        <td class="text-center text-muted"><?= $no++ ?></td>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-primary-subtle text-primary p-2 rounded-circle">
                                    <i class="bi bi-tag-fill"></i>
                                </span>
                                <span class="fw-semibold text-dark fs-6"><?= htmlspecialchars($kat['nama_kategori']) ?></span>
                            </div>
                        </td>
                        <td class="text-center">
                            <?php if ($terpakai): ?>
                                <a href="barang.php?kategori=<?= $kat['id'] ?>" class="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 text-decoration-none rounded-pill" title="Lihat barang dalam kategori ini">
                                    <i class="bi bi-box-seam me-1"></i> <?= $jml_barang ?> Barang
                                </a>
                            <?php else: ?>
                                <span class="badge bg-light text-muted border px-3 py-2 rounded-pill">
                                    0 Barang
                                </span>
                            <?php endif; ?>
                        </td>
                        <td class="text-center">
                            <?php if ($terpakai): ?>
                                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill">
                                    <i class="bi bi-check2 me-1"></i> Digunakan
                                </span>
                            <?php else: ?>
                                <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 rounded-pill">
                                    Belum Dipakai
                                </span>
                            <?php endif; ?>
                        </td>
                        <td class="text-center">
                            <div class="btn-group btn-group-sm">
                                <!-- Tombol Edit -->
                                <button type="button" class="btn btn-outline-primary btn-edit-kategori" 
                                        data-id="<?= $kat['id'] ?>"
                                        data-nama="<?= htmlspecialchars($kat['nama_kategori']) ?>"
                                        title="Edit Kategori">
                                    <i class="bi bi-pencil-square"></i>
                                </button>

                                <!-- Tombol Hapus (Dilindungi jika masih ada relasi dengan barang) -->
                                <?php if ($terpakai): ?>
                                    <button type="button" class="btn btn-outline-secondary" disabled 
                                            title="Kategori tidak dapat dihapus karena masih digunakan oleh <?= $jml_barang ?> barang">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                <?php else: ?>
                                    <a href="kategori.php?aksi=hapus&id=<?= $kat['id'] ?>" 
                                       class="btn btn-outline-danger" 
                                       data-konfirmasi-hapus="kategori.php?aksi=hapus&id=<?= $kat['id'] ?>"
                                       data-label="kategori <?= htmlspecialchars($kat['nama_kategori']) ?>"
                                       title="Hapus Kategori">
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
                        <td colspan="5" class="text-center py-5 text-muted">
                            <i class="bi bi-tags fs-1 d-block mb-2 text-secondary"></i>
                            Tidak ada data kategori ditemukan.
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ========================================== -->
<!-- 9. MODAL TAMBAH KATEGORI                   -->
<!-- ========================================== -->
<div class="modal fade" id="modalTambahKategori" tabindex="-1" aria-labelledby="modalTambahKategoriLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content border-0 shadow">
            <form action="kategori.php?aksi=tambah" method="POST" autocomplete="off">
                <?= csrf_field() ?>
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="modalTambahKategoriLabel"><i class="bi bi-plus-circle-fill me-2"></i>Tambah Kategori Baru</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="tambah_nama_kategori" class="form-label fw-semibold small">Nama Kategori <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="tambah_nama_kategori" name="nama_kategori" placeholder="Contoh: Sembako, Minuman, Rokok, Sabun" required maxlength="50">
                        <small class="text-muted">Maksimal 50 karakter</small>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-primary"><i class="bi bi-save me-1"></i> Simpan Kategori</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 10. MODAL EDIT KATEGORI                    -->
<!-- ========================================== -->
<div class="modal fade" id="modalEditKategori" tabindex="-1" aria-labelledby="modalEditKategoriLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content border-0 shadow">
            <form action="kategori.php?aksi=edit" method="POST" autocomplete="off">
                <?= csrf_field() ?>
                <input type="hidden" id="edit_id" name="id">
                <div class="modal-header bg-warning-subtle text-dark">
                    <h5 class="modal-title fw-bold" id="modalEditKategoriLabel"><i class="bi bi-pencil-square me-2"></i>Edit Data Kategori</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="edit_nama_kategori" class="form-label fw-semibold small">Nama Kategori <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="edit_nama_kategori" name="nama_kategori" required maxlength="50">
                        <small class="text-muted">Maksimal 50 karakter</small>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg me-1"></i> Simpan Perubahan</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 11. JAVASCRIPT MODAL EDIT KATEGORI         -->
<!-- ========================================== -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    const editButtons = document.querySelectorAll('.btn-edit-kategori');
    const modalEditKategoriEl = document.getElementById('modalEditKategori');
    if (modalEditKategoriEl) {
        const modalEdit = new bootstrap.Modal(modalEditKategoriEl);

        editButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                document.getElementById('edit_id').value            = this.dataset.id;
                document.getElementById('edit_nama_kategori').value = this.dataset.nama;
                modalEdit.show();
            });
        });
    }
});
</script>

<?php
// Tutup statement pencarian jika ada
if (isset($stmt) && $stmt) {
    mysqli_stmt_close($stmt);
}
require_once __DIR__ . '/../template/footer.php';
?>
