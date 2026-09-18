<?php
/**
 * File: master/pengguna.php
 * Deskripsi: Halaman antarmuka manajemen pengguna (Master Pengguna)
 * Hak Akses: Khusus role 'pemilik'
 */

// ==========================================
// 1. BUFFERING, MEMUAT TEMPLATE & CEK HAK AKSES
// ==========================================
ob_start();
$page_title  = 'Master Pengguna';
$active_menu = 'master_pengguna';
require_once __DIR__ . '/../template/header.php';

// Proteksi hak akses khusus Pemilik
cek_role('pemilik');

// ==========================================
// 2. MENANGKAP NOTIFIKASI & PENCARIAN
// ==========================================
$status = $_GET['status'] ?? '';
$pesan  = $_GET['pesan'] ?? '';
$cari   = trim($_GET['cari'] ?? '');

// ==========================================
// 3. MENGAMBIL DATA PENGGUNA DENGAN PREPARED STATEMENT
// ==========================================
// 3. DAFTAR PERTANYAAN KEAMANAN STANDAR
// ==========================================
$daftar_pertanyaan_keamanan = [
    "Apa nama hewan peliharaan pertama Anda?",
    "Di kota mana Anda dilahirkan?",
    "Apa nama sekolah dasar (SD) pertama Anda?",
    "Apa makanan atau minuman favorit Anda?",
    "Siapa nama sahabat masa kecil Anda?",
    "Apa nama jalan tempat tinggal masa kecil Anda?"
];

// ==========================================
// 4. MENGAMBIL DATA PENGGUNA DENGAN PREPARED STATEMENT
// ==========================================
if (!empty($cari)) {
    $keyword = "%{$cari}%";
    $query = "SELECT id, username, nama_lengkap, role, pertanyaan_keamanan, jawaban_keamanan, created_at FROM users WHERE username LIKE ? OR nama_lengkap LIKE ? ORDER BY id DESC";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "ss", $keyword, $keyword);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
} else {
    $query = "SELECT id, username, nama_lengkap, role, pertanyaan_keamanan, jawaban_keamanan, created_at FROM users ORDER BY id DESC";
    $result = mysqli_query($conn, $query);
}
?>

<!-- Header Halaman & Tombol Aksi -->
<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
    <div>
        <h4 class="fw-bold mb-1"><i class="bi bi-people me-2 text-primary"></i>Master Data Pengguna</h4>
        <p class="text-muted small mb-0">Kelola akun dan hak akses pengguna sistem POS Toko Kelontong</p>
    </div>
    <div class="d-flex gap-2">
        <button type="button" class="btn btn-primary d-inline-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#modalTambah">
            <i class="bi bi-person-plus-fill"></i> Tambah Pengguna
        </button>
    </div>
</div>

<!-- ========================================== -->
<!-- 4. ALERT NOTIFIKASI                       -->
<!-- ========================================== -->
<?php if (!empty($pesan)): ?>
    <div class="alert alert-<?= ($status === 'sukses') ? 'success' : 'danger' ?> alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
        <i class="bi bi-<?= ($status === 'sukses') ? 'check-circle-fill' : 'exclamation-triangle-fill' ?> me-2 fs-5"></i>
        <div><?= htmlspecialchars($pesan) ?></div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
<?php endif; ?>

<!-- ========================================== -->
<!-- 5. KARTU TABEL DATA PENGGUNA               -->
<!-- ========================================== -->
<div class="card card-custom">
    <div class="card-header bg-white py-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <h6 class="mb-0 fw-semibold text-secondary"><i class="bi bi-list-ul me-2"></i>Daftar Pengguna</h6>
        <!-- Form Filter & Pencarian -->
        <form action="" method="GET" class="d-flex gap-2" style="max-width: 320px;">
            <div class="input-group input-group-sm">
                <input type="text" name="cari" class="form-control" placeholder="Cari nama / username..." value="<?= htmlspecialchars($cari) ?>">
                <button class="btn btn-outline-secondary" type="submit"><i class="bi bi-search"></i></button>
                <?php if (!empty($cari)): ?>
                    <a href="pengguna.php" class="btn btn-outline-danger" title="Reset filter"><i class="bi bi-x-lg"></i></a>
                <?php endif; ?>
            </div>
        </form>
    </div>
    <div class="table-responsive">
        <table class="table table-hover table-custom align-middle mb-0">
            <thead>
                <tr>
                    <th class="text-center" style="width: 50px;">No</th>
                    <th>Username</th>
                    <th>Nama Lengkap</th>
                    <th>Peran (Role)</th>
                    <th>Pertanyaan Keamanan</th>
                    <th>Waktu Dibuat</th>
                    <th class="text-center" style="width: 130px;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $no = 1;
                $has_data = false;
                if ($result):
                    while ($user = mysqli_fetch_assoc($result)): 
                        $has_data = true;
                        $is_self = ((int)$user['id'] === (int)$_SESSION['id']);
                        $has_security = (!empty($user['pertanyaan_keamanan']) && !empty($user['jawaban_keamanan']));
                ?>
                    <tr>
                        <td class="text-center text-muted"><?= $no++ ?></td>
                        <td>
                            <span class="fw-semibold"><?= htmlspecialchars($user['username']) ?></span>
                            <?php if ($is_self): ?>
                                <span class="badge bg-secondary-subtle text-secondary ms-1">Anda</span>
                            <?php endif; ?>
                        </td>
                        <td><?= htmlspecialchars($user['nama_lengkap']) ?></td>
                        <td>
                            <?php if ($user['role'] === 'pemilik'): ?>
                                <span class="badge badge-role-pemilik px-2 py-1 rounded-pill">
                                    <i class="bi bi-shield-check me-1"></i> Pemilik
                                </span>
                            <?php else: ?>
                                <span class="badge badge-role-kasir px-2 py-1 rounded-pill">
                                    <i class="bi bi-cash-coin me-1"></i> Kasir
                                </span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php if ($has_security): ?>
                                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                                    <i class="bi bi-shield-check me-1"></i> Terpasang
                                </span>
                                <div class="small text-muted text-truncate mt-1" style="max-width: 200px;" title="<?= htmlspecialchars($user['pertanyaan_keamanan']) ?>">
                                    <?= htmlspecialchars($user['pertanyaan_keamanan']) ?>
                                </div>
                            <?php else: ?>
                                <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
                                    <i class="bi bi-shield-exclamation me-1"></i> Belum Diset
                                </span>
                            <?php endif; ?>
                        </td>
                        <td class="text-muted small">
                            <?= date('d M Y, H:i', strtotime($user['created_at'])) ?>
                        </td>
                        <td class="text-center">
                            <div class="btn-group btn-group-sm">
                                <!-- Tombol Edit -->
                                <button type="button" class="btn btn-outline-primary btn-edit" 
                                        data-id="<?= $user['id'] ?>"
                                        data-username="<?= htmlspecialchars($user['username']) ?>"
                                        data-nama="<?= htmlspecialchars($user['nama_lengkap']) ?>"
                                        data-role="<?= $user['role'] ?>"
                                        data-pertanyaan="<?= htmlspecialchars($user['pertanyaan_keamanan'] ?? '') ?>"
                                        title="Edit Pengguna">
                                    <i class="bi bi-pencil-square"></i>
                                </button>
                                <!-- Tombol Hapus (Dicegah jika akun sendiri) -->
                                <?php if ($is_self): ?>
                                    <button type="button" class="btn btn-outline-secondary disabled" title="Tidak dapat menghapus akun sendiri">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                <?php else: ?>
                                    <a href="pengguna_proses.php?aksi=hapus&id=<?= $user['id'] ?>" 
                                       class="btn btn-outline-danger" 
                                       data-konfirmasi-hapus="pengguna_proses.php?aksi=hapus&id=<?= $user['id'] ?>"
                                       data-label="pengguna <?= htmlspecialchars($user['username']) ?>"
                                       title="Hapus Pengguna">
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
                        <td colspan="7" class="text-center py-4 text-muted">
                            <i class="bi bi-inbox fs-2 d-block mb-1 text-secondary"></i>
                            Tidak ada data pengguna ditemukan.
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ========================================== -->
<!-- 6. MODAL TAMBAH PENGGUNA                   -->
<!-- ========================================== -->
<div class="modal fade" id="modalTambah" tabindex="-1" aria-labelledby="modalTambahLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content border-0 shadow">
            <form action="pengguna_proses.php?aksi=tambah" method="POST">
                <?= csrf_field() ?>
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="modalTambahLabel"><i class="bi bi-person-plus-fill me-2"></i>Tambah Pengguna Baru</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="tambah_username" class="form-label fw-semibold small">Username <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="tambah_username" name="username" placeholder="Contoh: kasir2" required>
                    </div>
                    <div class="mb-3">
                        <label for="tambah_nama" class="form-label fw-semibold small">Nama Lengkap <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="tambah_nama" name="nama_lengkap" placeholder="Contoh: Siti Rahma" required>
                    </div>
                    <div class="mb-3">
                        <label for="tambah_password" class="form-label fw-semibold small">Password <span class="text-danger">*</span></label>
                        <input type="password" class="form-control" id="tambah_password" name="password" placeholder="Minimal 6 karakter" required>
                    </div>
                    <div class="mb-3">
                        <label for="tambah_role" class="form-label fw-semibold small">Peran (Role) <span class="text-danger">*</span></label>
                        <select class="form-select" id="tambah_role" name="role" required>
                            <option value="kasir" selected>Kasir (Transaksi & Laporan Harian)</option>
                            <option value="pemilik">Pemilik (Akses Penuh)</option>
                        </select>
                    </div>

                    <hr class="my-3 text-muted">
                    <div class="fw-semibold small text-primary mb-2">
                        <i class="bi bi-shield-lock me-1"></i> Pertanyaan Keamanan (Pemulihan Password)
                    </div>
                    <div class="mb-3">
                        <label for="tambah_pertanyaan" class="form-label fw-semibold small">Pertanyaan Keamanan</label>
                        <select class="form-select" id="tambah_pertanyaan" name="pertanyaan_keamanan">
                            <option value="">-- Pilih Pertanyaan Keamanan (Opsional) --</option>
                            <?php foreach ($daftar_pertanyaan_keamanan as $tanya): ?>
                                <option value="<?= htmlspecialchars($tanya) ?>"><?= htmlspecialchars($tanya) ?></option>
                            <?php endforeach; ?>
                            <option value="custom">-- Tulis Pertanyaan Sendiri (Kustom) --</option>
                        </select>
                    </div>
                    <div class="mb-3 d-none" id="cont_tambah_custom">
                        <label for="tambah_pertanyaan_custom" class="form-label fw-semibold small">Tulis Pertanyaan Kustom</label>
                        <input type="text" class="form-control" id="tambah_pertanyaan_custom" name="pertanyaan_keamanan_custom" placeholder="Contoh: Siapa nama guru favorit Anda?">
                    </div>
                    <div class="mb-2">
                        <label for="tambah_jawaban" class="form-label fw-semibold small">Jawaban Keamanan</label>
                        <input type="text" class="form-control" id="tambah_jawaban" name="jawaban_keamanan" placeholder="Jawaban disimpan dalam bentuk hash (case-insensitive)">
                        <div class="form-text small text-muted">Dibutuhkan jika pengguna lupa password saat masuk ke sistem.</div>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-primary"><i class="bi bi-save me-1"></i> Simpan Pengguna</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 7. MODAL EDIT PENGGUNA                     -->
<!-- ========================================== -->
<div class="modal fade" id="modalEdit" tabindex="-1" aria-labelledby="modalEditLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content border-0 shadow">
            <form action="pengguna_proses.php?aksi=edit" method="POST">
                <?= csrf_field() ?>
                <input type="hidden" id="edit_id" name="id">
                <div class="modal-header bg-warning-subtle text-dark">
                    <h5 class="modal-title fw-bold" id="modalEditLabel"><i class="bi bi-pencil-square me-2"></i>Edit Pengguna</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="edit_username" class="form-label fw-semibold small">Username <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="edit_username" name="username" required>
                    </div>
                    <div class="mb-3">
                        <label for="edit_nama" class="form-label fw-semibold small">Nama Lengkap <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="edit_nama" name="nama_lengkap" required>
                    </div>
                    <div class="mb-3">
                        <label for="edit_password" class="form-label fw-semibold small">Password Baru <span class="text-muted">(Kosongkan jika tidak diubah)</span></label>
                        <input type="password" class="form-control" id="edit_password" name="password" placeholder="Biarkan kosong jika tidak diubah">
                    </div>
                    <div class="mb-3">
                        <label for="edit_role" class="form-label fw-semibold small">Peran (Role) <span class="text-danger">*</span></label>
                        <select class="form-select" id="edit_role" name="role" required>
                            <option value="kasir">Kasir (Transaksi & Laporan Harian)</option>
                            <option value="pemilik">Pemilik (Akses Penuh)</option>
                        </select>
                    </div>

                    <hr class="my-3 text-muted">
                    <div class="fw-semibold small text-primary mb-2">
                        <i class="bi bi-shield-lock me-1"></i> Pertanyaan Keamanan (Pemulihan Password)
                    </div>
                    <div class="mb-3">
                        <label for="edit_pertanyaan" class="form-label fw-semibold small">Pertanyaan Keamanan</label>
                        <select class="form-select" id="edit_pertanyaan" name="pertanyaan_keamanan">
                            <option value="">-- Tetap Gunakan / Pilih Pertanyaan --</option>
                            <?php foreach ($daftar_pertanyaan_keamanan as $tanya): ?>
                                <option value="<?= htmlspecialchars($tanya) ?>"><?= htmlspecialchars($tanya) ?></option>
                            <?php endforeach; ?>
                            <option value="custom">-- Tulis Pertanyaan Sendiri (Kustom) --</option>
                        </select>
                    </div>
                    <div class="mb-3 d-none" id="cont_edit_custom">
                        <label for="edit_pertanyaan_custom" class="form-label fw-semibold small">Tulis Pertanyaan Kustom</label>
                        <input type="text" class="form-control" id="edit_pertanyaan_custom" name="pertanyaan_keamanan_custom" placeholder="Contoh: Siapa nama guru favorit Anda?">
                    </div>
                    <div class="mb-2">
                        <label for="edit_jawaban" class="form-label fw-semibold small">Jawaban Keamanan Baru <span class="text-muted">(Kosongkan jika tidak diubah)</span></label>
                        <input type="text" class="form-control" id="edit_jawaban" name="jawaban_keamanan" placeholder="Biarkan kosong jika tidak ingin mengubah jawaban">
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
<!-- 8. JAVASCRIPT UNTUK INTERAKSI MODAL EDIT  -->
<!-- ========================================== -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    const editButtons   = document.querySelectorAll('.btn-edit');
    const modalEdit     = new bootstrap.Modal(document.getElementById('modalEdit'));
    const editSelect    = document.getElementById('edit_pertanyaan');
    const contEditCust  = document.getElementById('cont_edit_custom');
    const inputEditCust = document.getElementById('edit_pertanyaan_custom');

    const tambahSelect   = document.getElementById('tambah_pertanyaan');
    const contTambahCust = document.getElementById('cont_tambah_custom');
    const inputTamCust   = document.getElementById('tambah_pertanyaan_custom');

    // Toggle kustom di modal tambah
    if (tambahSelect && contTambahCust) {
        tambahSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                contTambahCust.classList.remove('d-none');
                if (inputTamCust) inputTamCust.focus();
            } else {
                contTambahCust.classList.add('d-none');
            }
        });
    }

    // Toggle kustom di modal edit
    if (editSelect && contEditCust) {
        editSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                contEditCust.classList.remove('d-none');
                if (inputEditCust) inputEditCust.focus();
            } else {
                contEditCust.classList.add('d-none');
            }
        });
    }

    // Event saat tombol edit diklik
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('edit_id').value       = this.dataset.id;
            document.getElementById('edit_username').value = this.dataset.username;
            document.getElementById('edit_nama').value     = this.dataset.nama;
            document.getElementById('edit_role').value     = this.dataset.role;
            document.getElementById('edit_password').value = '';
            document.getElementById('edit_jawaban').value  = '';

            const currentQ = this.dataset.pertanyaan || '';
            let isMatched = false;

            if (editSelect) {
                for (let i = 0; i < editSelect.options.length; i++) {
                    if (editSelect.options[i].value !== '' && editSelect.options[i].value !== 'custom' && editSelect.options[i].value === currentQ) {
                        editSelect.selectedIndex = i;
                        isMatched = true;
                        break;
                    }
                }

                if (!isMatched && currentQ !== '') {
                    editSelect.value = 'custom';
                    if (inputEditCust) inputEditCust.value = currentQ;
                    if (contEditCust) contEditCust.classList.remove('d-none');
                } else {
                    if (!isMatched) editSelect.value = '';
                    if (inputEditCust) inputEditCust.value = '';
                    if (contEditCust) contEditCust.classList.add('d-none');
                }
            }

            modalEdit.show();
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
