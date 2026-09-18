<?php
/**
 * File: master/pelanggan.php
 * Deskripsi: Halaman antarmuka manajemen data pelanggan toko (Master Pelanggan)
 * Hak Akses: Pemilik & Kasir (Kasir diizinkan menambah dan mengelola data pelanggan untuk kasbon)
 * Aturan:
 *   - CRUD Pelanggan (List, Tambah, Edit, Hapus)
 *   - Dukungan response JSON jika dipanggil via AJAX dari halaman kasir (tambah cepat)
 *   - Cegah hapus pelanggan jika memiliki relasi piutang aktif atau riwayat transaksi
 *   - Prepared statement untuk semua query database
 *   - Validasi keamanan CSRF pada request POST
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

// Hak akses terbuka untuk Pemilik dan Kasir
cek_role(['pemilik', 'kasir']);

// ==========================================
// 2. PEMROSESAN AKSI CRUD PELANGGAN
// ==========================================
$aksi = $_REQUEST['aksi'] ?? '';

// --- A. PROSES TAMBAH PELANGGAN ---
if ($aksi === 'tambah' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $is_ajax = isset($_POST['is_ajax']) && $_POST['is_ajax'] == '1';

    if (!validasi_csrf()) {
        if ($is_ajax) {
            echo json_encode(['status' => 'error', 'pesan' => 'Token CSRF tidak valid atau sesi telah kedaluwarsa!']);
            exit;
        }
        header("Location: pelanggan.php?status=error&pesan=" . urlencode("Token CSRF tidak valid atau sesi telah kedaluwarsa!"));
        exit;
    }

    $nama   = trim($_POST['nama'] ?? '');
    $no_hp  = trim($_POST['no_hp'] ?? '');
    $alamat = trim($_POST['alamat'] ?? '');

    if (empty($nama)) {
        if ($is_ajax) {
            echo json_encode(['status' => 'error', 'pesan' => 'Nama pelanggan wajib diisi!']);
            exit;
        }
        header("Location: pelanggan.php?status=error&pesan=" . urlencode("Nama pelanggan wajib diisi!"));
        exit;
    }

    // Simpan pelanggan baru dengan Prepared Statement
    $stmt_insert = mysqli_prepare($conn, "INSERT INTO pelanggan (nama, no_hp, alamat, created_at) VALUES (?, ?, ?, NOW())");
    mysqli_stmt_bind_param($stmt_insert, "sss", $nama, $no_hp, $alamat);

    if (mysqli_stmt_execute($stmt_insert)) {
        $id_baru = mysqli_insert_id($conn);
        mysqli_stmt_close($stmt_insert);

        if ($is_ajax) {
            echo json_encode([
                'status'  => 'success',
                'pesan'   => "Pelanggan '{$nama}' berhasil ditambahkan.",
                'data'    => [
                    'id'     => $id_baru,
                    'nama'   => $nama,
                    'no_hp'  => $no_hp,
                    'alamat' => $alamat
                ]
            ]);
            exit;
        }

        header("Location: pelanggan.php?status=sukses&pesan=" . urlencode("Pelanggan '{$nama}' berhasil ditambahkan."));
    } else {
        mysqli_stmt_close($stmt_insert);
        if ($is_ajax) {
            echo json_encode(['status' => 'error', 'pesan' => 'Gagal menyimpan data pelanggan baru!']);
            exit;
        }
        header("Location: pelanggan.php?status=error&pesan=" . urlencode("Gagal menyimpan data pelanggan baru!"));
    }
    exit;
}

// --- B. PROSES EDIT PELANGGAN ---
elseif ($aksi === 'edit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validasi_csrf()) {
        header("Location: pelanggan.php?status=error&pesan=" . urlencode("Token CSRF tidak valid atau sesi telah kedaluwarsa!"));
        exit;
    }

    $id     = (int)($_POST['id'] ?? 0);
    $nama   = trim($_POST['nama'] ?? '');
    $no_hp  = trim($_POST['no_hp'] ?? '');
    $alamat = trim($_POST['alamat'] ?? '');

    if ($id <= 0 || empty($nama)) {
        header("Location: pelanggan.php?status=error&pesan=" . urlencode("ID atau nama pelanggan tidak valid!"));
        exit;
    }

    // Perbarui data pelanggan dengan Prepared Statement
    $stmt_update = mysqli_prepare($conn, "UPDATE pelanggan SET nama = ?, no_hp = ?, alamat = ? WHERE id = ?");
    mysqli_stmt_bind_param($stmt_update, "sssi", $nama, $no_hp, $alamat, $id);

    if (mysqli_stmt_execute($stmt_update)) {
        mysqli_stmt_close($stmt_update);
        header("Location: pelanggan.php?status=sukses&pesan=" . urlencode("Data pelanggan '{$nama}' berhasil diperbarui."));
    } else {
        mysqli_stmt_close($stmt_update);
        header("Location: pelanggan.php?status=error&pesan=" . urlencode("Gagal memperbarui data pelanggan!"));
    }
    exit;
}

// --- C. PROSES HAPUS PELANGGAN ---
elseif ($aksi === 'hapus') {
    $id = (int)($_GET['id'] ?? 0);

    if ($id <= 0) {
        header("Location: pelanggan.php?status=error&pesan=" . urlencode("ID pelanggan tidak valid!"));
        exit;
    }

    // 1. Cek relasi ke tabel piutang
    $stmt_cek = mysqli_prepare($conn, "SELECT COUNT(*) AS total_piutang, 
        COALESCE(SUM(CASE WHEN status = 'belum_lunas' THEN sisa_piutang ELSE 0 END), 0) AS sisa_tunggakan
        FROM piutang WHERE id_pelanggan = ?");
    mysqli_stmt_bind_param($stmt_cek, "i", $id);
    mysqli_stmt_execute($stmt_cek);
    $res_cek = mysqli_stmt_get_result($stmt_cek);
    $data_cek = mysqli_fetch_assoc($res_cek);
    mysqli_stmt_close($stmt_cek);

    if ($data_cek && (int)$data_cek['total_piutang'] > 0) {
        $tunggakan = (float)$data_cek['sisa_tunggakan'];
        if ($tunggakan > 0) {
            header("Location: pelanggan.php?status=error&pesan=" . urlencode("Pelanggan tidak dapat dihapus karena masih memiliki tanggungan kasbon aktif sebesar Rp " . number_format($tunggakan, 0, ',', '.') . "!"));
        } else {
            header("Location: pelanggan.php?status=error&pesan=" . urlencode("Pelanggan tidak dapat dihapus karena memiliki riwayat transaksi piutang terdahulu."));
        }
        exit;
    }

    // 2. Jika aman (tidak ada relasi piutang), lakukan penghapusan
    $stmt_hapus = mysqli_prepare($conn, "DELETE FROM pelanggan WHERE id = ?");
    mysqli_stmt_bind_param($stmt_hapus, "i", $id);

    if (mysqli_stmt_execute($stmt_hapus)) {
        mysqli_stmt_close($stmt_hapus);
        header("Location: pelanggan.php?status=sukses&pesan=" . urlencode("Data pelanggan berhasil dihapus."));
    } else {
        mysqli_stmt_close($stmt_hapus);
        header("Location: pelanggan.php?status=error&pesan=" . urlencode("Gagal menghapus data pelanggan!"));
    }
    exit;
}

// ==========================================
// 3. MEMUAT HEADER TAMPILAN
// ==========================================
$page_title  = 'Master Pelanggan';
$active_menu = 'master_pelanggan';
require_once __DIR__ . '/../template/header.php';

// ==========================================
// 4. MENANGKAP NOTIFIKASI & FILTER
// ==========================================
$status = $_GET['status'] ?? '';
$pesan  = $_GET['pesan'] ?? '';
$cari   = trim($_GET['cari'] ?? '');

// ==========================================
// 5. QUERY DAFTAR PELANGGAN & RINGKASAN PIUTANG
// ==========================================
if (!empty($cari)) {
    $keyword = "%{$cari}%";
    $query = "SELECT p.*, 
              (SELECT COUNT(*) FROM piutang pt WHERE pt.id_pelanggan = p.id) AS total_piutang_count,
              (SELECT COALESCE(SUM(pt.sisa_piutang), 0) FROM piutang pt WHERE pt.id_pelanggan = p.id AND pt.status = 'belum_lunas') AS sisa_kasbon
              FROM pelanggan p 
              WHERE p.nama LIKE ? OR p.no_hp LIKE ? OR p.alamat LIKE ? 
              ORDER BY p.id DESC";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "sss", $keyword, $keyword, $keyword);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
} else {
    $query = "SELECT p.*, 
              (SELECT COUNT(*) FROM piutang pt WHERE pt.id_pelanggan = p.id) AS total_piutang_count,
              (SELECT COALESCE(SUM(pt.sisa_piutang), 0) FROM piutang pt WHERE pt.id_pelanggan = p.id AND pt.status = 'belum_lunas') AS sisa_kasbon
              FROM pelanggan p 
              ORDER BY p.id DESC";
    $result = mysqli_query($conn, $query);
}

// Menghitung statistik ringkasan pelanggan
$q_stats = mysqli_query($conn, "SELECT 
    COUNT(*) as total_pelanggan,
    SUM(CASE WHEN (SELECT COUNT(*) FROM piutang pt WHERE pt.id_pelanggan = p.id AND pt.status = 'belum_lunas') > 0 THEN 1 ELSE 0 END) as pelanggan_punya_kasbon,
    SUM((SELECT COALESCE(SUM(sisa_piutang), 0) FROM piutang pt WHERE pt.id_pelanggan = p.id AND pt.status = 'belum_lunas')) as total_seluruh_kasbon
    FROM pelanggan p");
$stats = mysqli_fetch_assoc($q_stats);
?>

<!-- Header Halaman & Tombol Aksi Tambah -->
<div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
    <div>
        <h4 class="fw-bold mb-1"><i class="bi bi-person-lines-fill me-2 text-primary"></i>Master Data Pelanggan</h4>
        <p class="text-muted small mb-0">Kelola buku kontak pelanggan toko untuk pencatatan transaksi kasbon dan riwayat pembayaran</p>
    </div>
    <div class="d-flex gap-2">
        <button type="button" class="btn btn-primary d-inline-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#modalTambahPelanggan">
            <i class="bi bi-person-plus-fill"></i> Tambah Pelanggan
        </button>
    </div>
</div>

<!-- ========================================== -->
<!-- 6. KARTU STATISTIK RINGKASAN PELANGGAN     -->
<!-- ========================================== -->
<div class="row g-3 mb-4">
    <div class="col-sm-6 col-xl-4">
        <div class="card card-custom p-3 border-start border-4 border-primary">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Total Pelanggan Terdaftar</span>
                    <h4 class="fw-bold mb-0 mt-1"><?= number_format($stats['total_pelanggan'] ?? 0, 0, ',', '.') ?></h4>
                </div>
                <div class="bg-primary-subtle text-primary p-3 rounded-3 fs-4">
                    <i class="bi bi-people-fill"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-xl-4">
        <div class="card card-custom p-3 border-start border-4 border-warning">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Pelanggan dengan Kasbon Aktif</span>
                    <h4 class="fw-bold mb-0 mt-1 text-warning"><?= number_format($stats['pelanggan_punya_kasbon'] ?? 0, 0, ',', '.') ?></h4>
                </div>
                <div class="bg-warning-subtle text-warning p-3 rounded-3 fs-4">
                    <i class="bi bi-journal-x"></i>
                </div>
            </div>
        </div>
    </div>
    <div class="col-sm-6 col-xl-4">
        <div class="card card-custom p-3 border-start border-4 border-danger">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <span class="text-muted small fw-semibold">Total Kasbon Belum Lunas</span>
                    <h4 class="fw-bold mb-0 mt-1 text-danger">Rp <?= number_format($stats['total_seluruh_kasbon'] ?? 0, 0, ',', '.') ?></h4>
                </div>
                <div class="bg-danger-subtle text-danger p-3 rounded-3 fs-4">
                    <i class="bi bi-cash-coin"></i>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 7. ALERT NOTIFIKASI                        -->
<!-- ========================================== -->
<?php if (!empty($pesan)): ?>
    <div class="alert alert-<?= ($status === 'sukses') ? 'success' : 'danger' ?> alert-dismissible fade show d-flex align-items-center mb-4 shadow-sm" role="alert">
        <i class="bi bi-<?= ($status === 'sukses') ? 'check-circle-fill' : 'exclamation-triangle-fill' ?> me-2 fs-5"></i>
        <div><?= htmlspecialchars($pesan) ?></div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
<?php endif; ?>

<!-- ========================================== -->
<!-- 8. TABEL DAFTAR PELANGGAN                  -->
<!-- ========================================== -->
<div class="card card-custom">
    <div class="card-header bg-white py-3 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <h6 class="mb-0 fw-semibold text-secondary"><i class="bi bi-list-check me-2"></i>Daftar Kontak Pelanggan</h6>
        <!-- Form Filter & Pencarian -->
        <form action="" method="GET" class="d-flex gap-2" style="max-width: 320px;">
            <div class="input-group input-group-sm">
                <input type="text" name="cari" class="form-control" placeholder="Cari nama / HP / alamat..." value="<?= htmlspecialchars($cari) ?>">
                <button class="btn btn-outline-secondary" type="submit"><i class="bi bi-search"></i></button>
                <?php if (!empty($cari)): ?>
                    <a href="pelanggan.php" class="btn btn-outline-danger" title="Reset filter"><i class="bi bi-x-lg"></i></a>
                <?php endif; ?>
            </div>
        </form>
    </div>
    <div class="table-responsive">
        <table class="table table-hover table-custom align-middle mb-0">
            <thead>
                <tr>
                    <th class="text-center" style="width: 50px;">No</th>
                    <th>Nama Pelanggan</th>
                    <th>No. Handphone / WA</th>
                    <th>Alamat</th>
                    <th class="text-end" style="width: 180px;">Sisa Kasbon Aktif</th>
                    <th class="text-center" style="width: 140px;">Status</th>
                    <th class="text-center" style="width: 140px;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $no = 1;
                $has_data = false;
                if ($result):
                    while ($p = mysqli_fetch_assoc($result)): 
                        $has_data = true;
                        $sisa = (float)$p['sisa_kasbon'];
                        $total_piutang_count = (int)$p['total_piutang_count'];
                ?>
                    <tr>
                        <td class="text-center text-muted"><?= $no++ ?></td>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <div class="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 34px; height: 34px;">
                                    <?= strtoupper(substr($p['nama'], 0, 1)) ?>
                                </div>
                                <span class="fw-semibold text-dark"><?= htmlspecialchars($p['nama']) ?></span>
                            </div>
                        </td>
                        <td>
                            <?php if (!empty($p['no_hp'])): ?>
                                <a href="https://wa.me/<?= preg_replace('/[^0-9]/', '', $p['no_hp']) ?>" target="_blank" class="text-decoration-none text-dark small" title="Hubungi via WhatsApp">
                                    <i class="bi bi-whatsapp text-success me-1"></i><?= htmlspecialchars($p['no_hp']) ?>
                                </a>
                            <?php else: ?>
                                <span class="text-muted small fst-italic">- Tidak ada -</span>
                            <?php endif; ?>
                        </td>
                        <td class="text-muted small"><?= htmlspecialchars($p['alamat'] ?? '-') ?: '-' ?></td>
                        <td class="text-end font-monospace">
                            <?php if ($sisa > 0): ?>
                                <span class="fw-bold text-danger">Rp <?= number_format($sisa, 0, ',', '.') ?></span>
                            <?php else: ?>
                                <span class="text-muted">Rp 0</span>
                            <?php endif; ?>
                        </td>
                        <td class="text-center">
                            <?php if ($sisa > 0): ?>
                                <span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded-pill">
                                    <i class="bi bi-clock-history me-1"></i> Ada Kasbon
                                </span>
                            <?php elseif ($total_piutang_count > 0): ?>
                                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill">
                                    <i class="bi bi-check2-circle me-1"></i> Lunas
                                </span>
                            <?php else: ?>
                                <span class="badge bg-light text-muted border px-2 py-1 rounded-pill">
                                    Belum Kasbon
                                </span>
                            <?php endif; ?>
                        </td>
                        <td class="text-center">
                            <div class="btn-group btn-group-sm">
                                <!-- Tombol Edit -->
                                <button type="button" class="btn btn-outline-primary btn-edit-pelanggan" 
                                        data-id="<?= $p['id'] ?>"
                                        data-nama="<?= htmlspecialchars($p['nama']) ?>"
                                        data-hp="<?= htmlspecialchars($p['no_hp'] ?? '') ?>"
                                        data-alamat="<?= htmlspecialchars($p['alamat'] ?? '') ?>"
                                        title="Edit Data Pelanggan">
                                    <i class="bi bi-pencil-square"></i>
                                </button>
                                <!-- Tombol Hapus (Dilindungi jika ada riwayat piutang) -->
                                <?php if ($total_piutang_count > 0): ?>
                                    <button type="button" class="btn btn-outline-secondary" disabled 
                                            title="Pelanggan tidak dapat dihapus karena memiliki riwayat piutang">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                <?php else: ?>
                                    <a href="pelanggan.php?aksi=hapus&id=<?= $p['id'] ?>" 
                                       class="btn btn-outline-danger" 
                                       data-konfirmasi-hapus="pelanggan.php?aksi=hapus&id=<?= $p['id'] ?>"
                                       data-label="pelanggan <?= htmlspecialchars(addslashes($p['nama'])) ?>"
                                       title="Hapus Pelanggan">
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
                        <td colspan="7" class="text-center py-5 text-muted">
                            <i class="bi bi-person-x fs-1 d-block mb-2 text-secondary"></i>
                            Tidak ada data pelanggan ditemukan.
                        </td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ========================================== -->
<!-- 9. MODAL TAMBAH PELANGGAN                  -->
<!-- ========================================== -->
<div class="modal fade" id="modalTambahPelanggan" tabindex="-1" aria-labelledby="modalTambahPelangganLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content border-0 shadow">
            <form action="pelanggan.php?aksi=tambah" method="POST" autocomplete="off">
                <?= csrf_field() ?>
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="modalTambahPelangganLabel"><i class="bi bi-person-plus-fill me-2"></i>Tambah Pelanggan Baru</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="tambah_nama" class="form-label fw-semibold small">Nama Pelanggan <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="tambah_nama" name="nama" placeholder="Contoh: Ibu Rina, Pak Joko" required maxlength="100">
                    </div>
                    <div class="mb-3">
                        <label for="tambah_no_hp" class="form-label fw-semibold small">No. Handphone / WhatsApp</label>
                        <input type="text" class="form-control" id="tambah_no_hp" name="no_hp" placeholder="Contoh: 081234567890" maxlength="20">
                        <small class="text-muted">Gunakan awalan 08 atau 62 untuk kemudahan hubungi via WA</small>
                    </div>
                    <div class="mb-3">
                        <label for="tambah_alamat" class="form-label fw-semibold small">Alamat / Keterangan Rumah</label>
                        <textarea class="form-control" id="tambah_alamat" name="alamat" rows="2" placeholder="Contoh: RT 03 / RW 02 No. 15 (sebelah musala)" maxlength="255"></textarea>
                    </div>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-primary"><i class="bi bi-save me-1"></i> Simpan Pelanggan</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ========================================== -->
<!-- 10. MODAL EDIT PELANGGAN                   -->
<!-- ========================================== -->
<div class="modal fade" id="modalEditPelanggan" tabindex="-1" aria-labelledby="modalEditPelangganLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content border-0 shadow">
            <form action="pelanggan.php?aksi=edit" method="POST" autocomplete="off">
                <?= csrf_field() ?>
                <input type="hidden" id="edit_id" name="id">
                <div class="modal-header bg-warning-subtle text-dark">
                    <h5 class="modal-title fw-bold" id="modalEditPelangganLabel"><i class="bi bi-pencil-square me-2"></i>Edit Data Pelanggan</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="edit_nama" class="form-label fw-semibold small">Nama Pelanggan <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="edit_nama" name="nama" required maxlength="100">
                    </div>
                    <div class="mb-3">
                        <label for="edit_no_hp" class="form-label fw-semibold small">No. Handphone / WhatsApp</label>
                        <input type="text" class="form-control" id="edit_no_hp" name="no_hp" maxlength="20">
                    </div>
                    <div class="mb-3">
                        <label for="edit_alamat" class="form-label fw-semibold small">Alamat / Keterangan Rumah</label>
                        <textarea class="form-control" id="edit_alamat" name="alamat" rows="2" maxlength="255"></textarea>
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
<!-- 11. JAVASCRIPT MODAL EDIT PELANGGAN        -->
<!-- ========================================== -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    const editButtons = document.querySelectorAll('.btn-edit-pelanggan');
    const modalEditEl = document.getElementById('modalEditPelanggan');
    if (modalEditEl) {
        const modalEdit = new bootstrap.Modal(modalEditEl);

        editButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                document.getElementById('edit_id').value     = this.dataset.id;
                document.getElementById('edit_nama').value   = this.dataset.nama;
                document.getElementById('edit_no_hp').value  = this.dataset.hp;
                document.getElementById('edit_alamat').value = this.dataset.alamat;
                modalEdit.show();
            });
        });
    }
});
</script>

<?php
if (isset($stmt) && $stmt) {
    mysqli_stmt_close($stmt);
}
require_once __DIR__ . '/../template/footer.php';
?>
