<?php
/**
 * File: auth/profil.php
 * Deskripsi: Halaman pengelolaan profil dan pengaturan keamanan akun (Pertanyaan Keamanan & Ganti Password)
 * Hak Akses: Semua pengguna yang sudah login (Pemilik dan Kasir)
 */

// ==========================================
// 1. BUFFERING, MEMUAT TEMPLATE & CEK LOGIN
// ==========================================
ob_start();
$page_title  = 'Profil & Keamanan Akun';
$active_menu = 'profil';
require_once __DIR__ . '/../template/header.php';

// Verifikasi sesi login
cek_login();

$user_id = (int)($_SESSION['id'] ?? 0);

$status_alert = '';
$pesan_alert  = '';

// ==========================================
// 2. DAFTAR PERTANYAAN KEAMANAN STANDAR
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
// 3. PEMROSESAN FORM PERUBAHAN DATA (POST)
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validasi_csrf()) {
        $status_alert = 'danger';
        $pesan_alert  = 'Token keamanan CSRF tidak valid atau sesi telah kedaluwarsa!';
    } else {
        $tipe = $_POST['tipe'] ?? '';

        // --- SUBMIT 1: UPDATE PROFIL & PERTANYAAN KEAMANAN ---
        if ($tipe === 'keamanan') {
            $nama_lengkap        = trim($_POST['nama_lengkap'] ?? '');
            $pertanyaan_keamanan = trim($_POST['pertanyaan_keamanan'] ?? '');
            if ($pertanyaan_keamanan === 'custom') {
                $pertanyaan_keamanan = trim($_POST['pertanyaan_keamanan_custom'] ?? '');
            }
            $jawaban_keamanan    = trim($_POST['jawaban_keamanan'] ?? '');

            if (empty($nama_lengkap)) {
                $status_alert = 'danger';
                $pesan_alert  = 'Nama lengkap tidak boleh kosong!';
            } else {
                // Update nama dan pertanyaan keamanan
                if (!empty($pertanyaan_keamanan) && !empty($jawaban_keamanan)) {
                    $jawaban_hash = password_hash(strtolower($jawaban_keamanan), PASSWORD_DEFAULT);
                    $query = "UPDATE users SET nama_lengkap = ?, pertanyaan_keamanan = ?, jawaban_keamanan = ? WHERE id = ?";
                    $stmt  = mysqli_prepare($conn, $query);
                    mysqli_stmt_bind_param($stmt, "sssi", $nama_lengkap, $pertanyaan_keamanan, $jawaban_hash, $user_id);
                } elseif (!empty($pertanyaan_keamanan)) {
                    // Update hanya nama dan pertanyaan tanpa mengubah hash jawaban lama
                    $query = "UPDATE users SET nama_lengkap = ?, pertanyaan_keamanan = ? WHERE id = ?";
                    $stmt  = mysqli_prepare($conn, $query);
                    mysqli_stmt_bind_param($stmt, "ssi", $nama_lengkap, $pertanyaan_keamanan, $user_id);
                } else {
                    // Update hanya nama lengkap
                    $query = "UPDATE users SET nama_lengkap = ? WHERE id = ?";
                    $stmt  = mysqli_prepare($conn, $query);
                    mysqli_stmt_bind_param($stmt, "si", $nama_lengkap, $user_id);
                }

                if (mysqli_stmt_execute($stmt)) {
                    $_SESSION['nama_lengkap'] = $nama_lengkap;
                    $status_alert = 'success';
                    $pesan_alert  = 'Pengaturan profil dan keamanan berhasil diperbarui!';
                } else {
                    $status_alert = 'danger';
                    $pesan_alert  = 'Terjadi kesalahan saat memperbarui profil.';
                }
                mysqli_stmt_close($stmt);
            }
        }

        // --- SUBMIT 2: GANTI PASSWORD ---
        elseif ($tipe === 'ganti_password') {
            $password_lama = trim($_POST['password_lama'] ?? '');
            $password_baru = trim($_POST['password_baru'] ?? '');
            $konfirmasi    = trim($_POST['konfirmasi_password'] ?? '');

            if (empty($password_lama) || empty($password_baru) || empty($konfirmasi)) {
                $status_alert = 'danger';
                $pesan_alert  = 'Semua kolom pergantian password wajib diisi!';
            } elseif (strlen($password_baru) < 6) {
                $status_alert = 'danger';
                $pesan_alert  = 'Password baru minimal harus terdiri dari 6 karakter!';
            } elseif ($password_baru !== $konfirmasi) {
                $status_alert = 'danger';
                $pesan_alert  = 'Konfirmasi password baru tidak cocok!';
            } else {
                // Periksa password lama dari database
                $query = "SELECT password FROM users WHERE id = ? LIMIT 1";
                $stmt  = mysqli_prepare($conn, $query);
                mysqli_stmt_bind_param($stmt, "i", $user_id);
                mysqli_stmt_execute($stmt);
                $res   = mysqli_stmt_get_result($stmt);
                $user  = mysqli_fetch_assoc($res);
                mysqli_stmt_close($stmt);

                if ($user && password_verify($password_lama, $user['password'])) {
                    // Simpan password baru
                    $hash_baru = password_hash($password_baru, PASSWORD_DEFAULT);
                    $query_upd = "UPDATE users SET password = ? WHERE id = ?";
                    $stmt_upd  = mysqli_prepare($conn, $query_upd);
                    mysqli_stmt_bind_param($stmt_upd, "si", $hash_baru, $user_id);

                    if (mysqli_stmt_execute($stmt_upd)) {
                        $status_alert = 'success';
                        $pesan_alert  = 'Password berhasil diubah! Gunakan password baru untuk login berikutnya.';
                    } else {
                        $status_alert = 'danger';
                        $pesan_alert  = 'Gagal memperbarui password di database.';
                    }
                    mysqli_stmt_close($stmt_upd);
                } else {
                    $status_alert = 'danger';
                    $pesan_alert  = 'Password saat ini (lama) yang Anda masukkan salah!';
                }
            }
        }
    }
}

// ==========================================
// 4. MENGAMBIL DATA TERBARU PENGGUNA
// ==========================================
$query = "SELECT username, nama_lengkap, role, pertanyaan_keamanan, jawaban_keamanan, created_at FROM users WHERE id = ? LIMIT 1";
$stmt  = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "i", $user_id);
mysqli_stmt_execute($stmt);
$current_user = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
mysqli_stmt_close($stmt);

$has_security_set = (!empty($current_user['pertanyaan_keamanan']) && !empty($current_user['jawaban_keamanan']));
?>

<!-- Header Halaman -->
<div class="mb-4">
    <h4 class="fw-bold mb-1"><i class="bi bi-shield-person me-2 text-primary"></i>Profil & Keamanan Akun</h4>
    <p class="text-muted small mb-0">Kelola identitas akun, pertanyaan pemulihan password, dan kredensial login Anda</p>
</div>

<!-- Notifikasi Alert -->
<?php if (!empty($pesan_alert)): ?>
    <div class="alert alert-<?= $status_alert ?> alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
        <i class="bi bi-<?= ($status_alert === 'success') ? 'check-circle-fill' : 'exclamation-triangle-fill' ?> me-2 fs-5"></i>
        <div><?= htmlspecialchars($pesan_alert) ?></div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
<?php endif; ?>

<div class="row g-4">
    <!-- Kolom Kiri: Informasi Akun & Pertanyaan Keamanan -->
    <div class="col-lg-7">
        <div class="card card-custom mb-4">
            <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 class="mb-0 fw-semibold text-secondary">
                    <i class="bi bi-person-gear me-2"></i>Informasi Akun & Pertanyaan Keamanan
                </h6>
                <?php if ($has_security_set): ?>
                    <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                        <i class="bi bi-shield-check me-1"></i> Keamanan Aktif
                    </span>
                <?php else: ?>
                    <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
                        <i class="bi bi-shield-exclamation me-1"></i> Keamanan Belum Diset
                    </span>
                <?php endif; ?>
            </div>
            <div class="card-body p-4">
                <form action="" method="POST" autocomplete="off">
                    <?= csrf_field() ?>
                    <input type="hidden" name="tipe" value="keamanan">

                    <div class="mb-3">
                        <label class="form-label small fw-semibold text-secondary">Username</label>
                        <input type="text" class="form-control bg-light" value="<?= htmlspecialchars($current_user['username']) ?>" readonly disabled>
                        <div class="form-text small text-muted">Username tidak dapat diubah secara mandiri.</div>
                    </div>

                    <div class="mb-3">
                        <label for="nama_lengkap" class="form-label small fw-semibold text-secondary">Nama Lengkap <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="nama_lengkap" name="nama_lengkap" value="<?= htmlspecialchars($current_user['nama_lengkap']) ?>" required>
                    </div>

                    <div class="mb-4">
                        <label class="form-label small fw-semibold text-secondary">Peran Akses (Role)</label>
                        <div>
                            <span class="badge rounded-pill <?= ($current_user['role'] === 'pemilik') ? 'badge-role-pemilik' : 'badge-role-kasir' ?> px-3 py-2">
                                <i class="bi bi-<?= ($current_user['role'] === 'pemilik') ? 'shield-check' : 'cash-coin' ?> me-1"></i>
                                <?= ucfirst($current_user['role']) ?>
                            </span>
                            <span class="text-muted small ms-2">Terdaftar sejak <?= date('d M Y', strtotime($current_user['created_at'])) ?></span>
                        </div>
                    </div>

                    <hr class="my-4 text-muted">

                    <div class="p-3 mb-3 bg-light rounded-3 border">
                        <div class="fw-semibold text-primary mb-1">
                            <i class="bi bi-patch-question-fill me-1"></i> Pertanyaan Keamanan untuk Pemulihan Akun
                        </div>
                        <p class="small text-muted mb-0">
                            Pertanyaan ini akan ditanyakan jika Anda menggunakan fitur <strong>Lupa Password</strong> di halaman login. Jawaban akan di-hash secara aman.
                        </p>
                    </div>

                    <div class="mb-3">
                        <label for="select_pertanyaan" class="form-label small fw-semibold text-secondary">Pilih Pertanyaan Keamanan</label>
                        <select class="form-select" id="select_pertanyaan" name="pertanyaan_keamanan">
                            <option value="">-- Pilih Pertanyaan Keamanan --</option>
                            <?php 
                            $found_matched = false;
                            foreach ($daftar_pertanyaan_keamanan as $tanya): 
                                $selected = ($current_user['pertanyaan_keamanan'] === $tanya) ? 'selected' : '';
                                if ($selected) $found_matched = true;
                            ?>
                                <option value="<?= htmlspecialchars($tanya) ?>" <?= $selected ?>><?= htmlspecialchars($tanya) ?></option>
                            <?php endforeach; ?>
                            <option value="custom" <?= (!$found_matched && !empty($current_user['pertanyaan_keamanan'])) ? 'selected' : '' ?>>
                                -- Tulis Pertanyaan Sendiri (Kustom) --
                            </option>
                        </select>
                    </div>

                    <div class="mb-3 <?= (!$found_matched && !empty($current_user['pertanyaan_keamanan'])) ? '' : 'd-none' ?>" id="container_profil_custom">
                        <label for="input_profil_custom" class="form-label small fw-semibold text-secondary">Tulis Pertanyaan Kustom</label>
                        <input type="text" class="form-control" id="input_profil_custom" name="pertanyaan_keamanan_custom" placeholder="Contoh: Apa cita-cita masa kecil Anda?" value="<?= (!$found_matched && !empty($current_user['pertanyaan_keamanan'])) ? htmlspecialchars($current_user['pertanyaan_keamanan']) : '' ?>">
                    </div>

                    <div class="mb-4">
                        <label for="jawaban_keamanan" class="form-label small fw-semibold text-secondary">
                            Jawaban Keamanan <?= $has_security_set ? '<span class="text-muted fw-normal">(Kosongkan jika tidak ingin mengubah)</span>' : '<span class="text-danger">*</span>' ?>
                        </label>
                        <input type="text" class="form-control" id="jawaban_keamanan" name="jawaban_keamanan" placeholder="<?= $has_security_set ? 'Ketik jawaban baru untuk memperbarui...' : 'Masukkan jawaban yang mudah Anda ingat...' ?>">
                        <div class="form-text small text-muted">Huruf besar dan kecil tidak dibedakan (case-insensitive).</div>
                    </div>

                    <button type="submit" class="btn btn-primary px-4">
                        <i class="bi bi-save me-1"></i> Simpan Profil & Keamanan
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- Kolom Kanan: Ganti Password -->
    <div class="col-lg-5">
        <div class="card card-custom">
            <div class="card-header bg-white py-3 border-bottom">
                <h6 class="mb-0 fw-semibold text-secondary">
                    <i class="bi bi-key me-2"></i>Ganti Password Akun
                </h6>
            </div>
            <div class="card-body p-4">
                <form action="" method="POST" autocomplete="off">
                    <?= csrf_field() ?>
                    <input type="hidden" name="tipe" value="ganti_password">

                    <div class="mb-3">
                        <label for="password_lama" class="form-label small fw-semibold text-secondary">Password Saat Ini <span class="text-danger">*</span></label>
                        <div class="input-group">
                            <span class="input-group-text bg-light text-muted"><i class="bi bi-lock"></i></span>
                            <input type="password" class="form-control" id="password_lama" name="password_lama" placeholder="Password lama Anda" required>
                            <button class="btn btn-outline-secondary toggle-pass" type="button" data-target="password_lama">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="password_baru" class="form-label small fw-semibold text-secondary">Password Baru <span class="text-danger">*</span></label>
                        <div class="input-group">
                            <span class="input-group-text bg-light text-muted"><i class="bi bi-lock-fill"></i></span>
                            <input type="password" class="form-control" id="password_baru" name="password_baru" placeholder="Minimal 6 karakter" required>
                            <button class="btn btn-outline-secondary toggle-pass" type="button" data-target="password_baru">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label for="konfirmasi_password" class="form-label small fw-semibold text-secondary">Konfirmasi Password Baru <span class="text-danger">*</span></label>
                        <div class="input-group">
                            <span class="input-group-text bg-light text-muted"><i class="bi bi-shield-lock-fill"></i></span>
                            <input type="password" class="form-control" id="konfirmasi_password" name="konfirmasi_password" placeholder="Ulangi password baru" required>
                            <button class="btn btn-outline-secondary toggle-pass" type="button" data-target="konfirmasi_password">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-outline-primary w-100 py-2 fw-semibold">
                        <i class="bi bi-check-circle me-1"></i> Perbarui Password
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Toggle custom pertanyaan
    const selectPertanyaan = document.getElementById('select_pertanyaan');
    const containerCustom  = document.getElementById('container_profil_custom');
    const inputCustom      = document.getElementById('input_profil_custom');

    if (selectPertanyaan && containerCustom) {
        selectPertanyaan.addEventListener('change', function() {
            if (this.value === 'custom') {
                containerCustom.classList.remove('d-none');
                if (inputCustom) inputCustom.focus();
            } else {
                containerCustom.classList.add('d-none');
            }
        });
    }

    // Toggle lihat password
    document.querySelectorAll('.toggle-pass').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId    = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const icon        = this.querySelector('i');
            if (targetInput && icon) {
                const isPass = targetInput.getAttribute('type') === 'password';
                targetInput.setAttribute('type', isPass ? 'text' : 'password');
                icon.classList.toggle('bi-eye', !isPass);
                icon.classList.toggle('bi-eye-slash', isPass);
            }
        });
    });
});
</script>

<?php
require_once __DIR__ . '/../template/footer.php';
?>
