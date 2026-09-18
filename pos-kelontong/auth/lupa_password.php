<?php
/**
 * File: auth/lupa_password.php
 * Deskripsi: Halaman pemulihan akun dan reset password menggunakan pertanyaan keamanan
 * Fitur: Multi-step wizard (Cek Username -> Jawab Pertanyaan Keamanan -> Set Password Baru)
 */

// ==========================================
// 1. BUFFERING, MEMULAI SESI & MEMUAT DEPENDENSI
// ==========================================
ob_start();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/cek_session.php';

// Jika pengguna sudah login, langsung alihkan ke dashboard
redirect_jika_login();

// ==========================================
// 2. INISIALISASI VARIABEL STATUS
// ==========================================
$pesan_error   = '';
$pesan_sukses  = '';
$pesan_warning = '';

// Inisialisasi status sesi reset jika belum ada
if (!isset($_SESSION['reset_flow'])) {
    $_SESSION['reset_flow'] = [
        'step'     => 1,
        'user_id'  => null,
        'username' => '',
        'question' => '',
        'verified' => false
    ];
}

$step = $_SESSION['reset_flow']['step'] ?? 1;

// Opsi untuk mereset alur kembali ke tahap 1 jika pengguna ingin ganti akun
if (isset($_GET['action']) && $_GET['action'] === 'batal') {
    unset($_SESSION['reset_flow']);
    header("Location: lupa_password.php");
    exit;
}

// ==========================================
// 3. PEMROSESAN FORM SESUAI TAHAP (POST)
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validasi CSRF Token
    if (!validasi_csrf()) {
        $pesan_error = 'Token keamanan (CSRF) tidak valid atau sesi telah kedaluwarsa!';
    } else {
        $submitted_step = (int)($_POST['step'] ?? 1);

        // ----------------------------------------------------
        // TAHAP 1: VERIFIKASI USERNAME
        // ----------------------------------------------------
        if ($submitted_step === 1) {
            $username = trim($_POST['username'] ?? '');

            if (empty($username)) {
                $pesan_error = 'Silakan masukkan username akun Anda!';
            } else {
                $query = "SELECT id, username, nama_lengkap, pertanyaan_keamanan, jawaban_keamanan FROM users WHERE username = ? LIMIT 1";
                $stmt  = mysqli_prepare($conn, $query);

                if ($stmt) {
                    mysqli_stmt_bind_param($stmt, "s", $username);
                    mysqli_stmt_execute($stmt);
                    $result = mysqli_stmt_get_result($stmt);

                    if ($user = mysqli_fetch_assoc($result)) {
                        // Periksa apakah pengguna sudah mengatur pertanyaan keamanan
                        if (empty($user['pertanyaan_keamanan']) || empty($user['jawaban_keamanan'])) {
                            $pesan_warning = "Akun <strong>" . htmlspecialchars($user['username']) . "</strong> (" . htmlspecialchars($user['nama_lengkap']) . ") belum mengonfigurasi pertanyaan keamanan.<br>Silakan hubungi <strong>Pemilik Toko</strong> untuk melakukan reset password akun Anda secara manual.";
                        } else {
                            // Berpindah ke Tahap 2
                            $_SESSION['reset_flow'] = [
                                'step'     => 2,
                                'user_id'  => (int)$user['id'],
                                'username' => $user['username'],
                                'nama'     => $user['nama_lengkap'],
                                'question' => $user['pertanyaan_keamanan'],
                                'verified' => false
                            ];
                            header("Location: lupa_password.php");
                            exit;
                        }
                    } else {
                        $pesan_error = 'Username tidak ditemukan dalam sistem!';
                    }
                    mysqli_stmt_close($stmt);
                } else {
                    $pesan_error = 'Terjadi kesalahan sistem database saat memeriksa username.';
                }
            }
        }

        // ----------------------------------------------------
        // TAHAP 2: VERIFIKASI JAWABAN KEAMANAN
        // ----------------------------------------------------
        elseif ($submitted_step === 2) {
            $user_id = $_SESSION['reset_flow']['user_id'] ?? 0;
            $jawaban = trim($_POST['jawaban_keamanan'] ?? '');

            if ($user_id <= 0 || empty($_SESSION['reset_flow']['question'])) {
                unset($_SESSION['reset_flow']);
                header("Location: lupa_password.php");
                exit;
            }

            if (empty($jawaban)) {
                $pesan_error = 'Jawaban keamanan wajib diisi!';
            } else {
                // Ambil hash jawaban tersimpan
                $query = "SELECT jawaban_keamanan FROM users WHERE id = ? LIMIT 1";
                $stmt  = mysqli_prepare($conn, $query);

                if ($stmt) {
                    mysqli_stmt_bind_param($stmt, "i", $user_id);
                    mysqli_stmt_execute($stmt);
                    $result = mysqli_stmt_get_result($stmt);

                    if ($row = mysqli_fetch_assoc($result)) {
                        $hash_tersimpan = $row['jawaban_keamanan'];

                        // Verifikasi jawaban (mendukung case-insensitive dengan strtolower dan format asli)
                        $jawaban_lower = strtolower($jawaban);
                        $is_valid = password_verify($jawaban_lower, $hash_tersimpan) || password_verify($jawaban, $hash_tersimpan);

                        if ($is_valid) {
                            $_SESSION['reset_flow']['step']     = 3;
                            $_SESSION['reset_flow']['verified'] = true;
                            header("Location: lupa_password.php");
                            exit;
                        } else {
                            $pesan_error = 'Jawaban keamanan tidak cocok! Pastikan ejaan jawaban sudah sesuai.';
                        }
                    } else {
                        $pesan_error = 'Pengguna tidak valid.';
                    }
                    mysqli_stmt_close($stmt);
                }
            }
        }

        // ----------------------------------------------------
        // TAHAP 3: PEMBUATAN PASSWORD BARU
        // ----------------------------------------------------
        elseif ($submitted_step === 3) {
            $user_id = $_SESSION['reset_flow']['user_id'] ?? 0;
            $is_verified = $_SESSION['reset_flow']['verified'] ?? false;

            if ($user_id <= 0 || !$is_verified) {
                unset($_SESSION['reset_flow']);
                header("Location: lupa_password.php");
                exit;
            }

            $password_baru = trim($_POST['password_baru'] ?? '');
            $konfirmasi    = trim($_POST['konfirmasi_password'] ?? '');

            if (empty($password_baru) || empty($konfirmasi)) {
                $pesan_error = 'Password baru dan konfirmasi password wajib diisi!';
            } elseif (strlen($password_baru) < 6) {
                $pesan_error = 'Password baru minimal harus terdiri dari 6 karakter!';
            } elseif ($password_baru !== $konfirmasi) {
                $pesan_error = 'Konfirmasi password tidak cocok dengan password baru!';
            } else {
                // Hash password baru dan simpan ke database
                $hash_baru = password_hash($password_baru, PASSWORD_DEFAULT);
                $query = "UPDATE users SET password = ? WHERE id = ?";
                $stmt  = mysqli_prepare($conn, $query);

                if ($stmt) {
                    mysqli_stmt_bind_param($stmt, "si", $hash_baru, $user_id);
                    if (mysqli_stmt_execute($stmt)) {
                        mysqli_stmt_close($stmt);
                        // Bersihkan sesi reset flow
                        unset($_SESSION['reset_flow']);
                        // Alihkan ke halaman login dengan pesan sukses
                        header("Location: login.php?pesan=password_direset");
                        exit;
                    } else {
                        $pesan_error = 'Gagal memperbarui password pada database.';
                    }
                    mysqli_stmt_close($stmt);
                }
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lupa Password - POS Toko Kelontong</title>
    <!-- Bootstrap 5.3 CSS & Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
        }
        .reset-card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.28);
            width: 100%;
            max-width: 460px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .reset-header {
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
            color: #ffffff;
            padding: 28px 24px 20px;
            text-align: center;
        }
        .reset-icon {
            width: 56px;
            height: 56px;
            background: rgba(255, 255, 255, 0.15);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-size: 26px;
            margin-bottom: 10px;
            backdrop-filter: blur(4px);
        }
        .reset-body {
            padding: 28px 26px;
        }
        .step-indicator {
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
            position: relative;
        }
        .step-indicator::before {
            content: "";
            position: absolute;
            top: 14px;
            left: 20px;
            right: 20px;
            height: 2px;
            background: #e2e8f0;
            z-index: 1;
        }
        .step-item {
            position: relative;
            z-index: 2;
            background: #ffffff;
            padding: 0 8px;
            text-align: center;
        }
        .step-bubble {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            background: #e2e8f0;
            color: #64748b;
            margin-bottom: 4px;
            transition: all 0.2s ease;
        }
        .step-item.active .step-bubble {
            background: #2563eb;
            color: #ffffff;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
        }
        .step-item.completed .step-bubble {
            background: #10b981;
            color: #ffffff;
        }
        .step-title {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            display: block;
        }
        .step-item.active .step-title {
            color: #1e3a8a;
        }
        .btn-action {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            border: none;
            padding: 11px;
            font-weight: 600;
            border-radius: 8px;
            transition: all 0.2s ease;
        }
        .btn-action:hover {
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
        }
        .question-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 16px;
        }
        .toggle-password {
            cursor: pointer;
            z-index: 10;
        }
    </style>
</head>
<body>

<div class="reset-card">
    <!-- Header Kartu -->
    <div class="reset-header">
        <div class="reset-icon">
            <i class="bi bi-shield-lock"></i>
        </div>
        <h5 class="fw-bold mb-1">Pemulihan Password</h5>
        <p class="text-white-50 mb-0 small">Reset password dengan Pertanyaan Keamanan</p>
    </div>

    <!-- Badan Form -->
    <div class="reset-body">

        <!-- Indikator Langkah -->
        <div class="step-indicator">
            <div class="step-item <?= ($step === 1) ? 'active' : (($step > 1) ? 'completed' : '') ?>">
                <div class="step-bubble">
                    <?= ($step > 1) ? '<i class="bi bi-check-lg"></i>' : '1' ?>
                </div>
                <span class="step-title">Username</span>
            </div>
            <div class="step-item <?= ($step === 2) ? 'active' : (($step > 2) ? 'completed' : '') ?>">
                <div class="step-bubble">
                    <?= ($step > 2) ? '<i class="bi bi-check-lg"></i>' : '2' ?>
                </div>
                <span class="step-title">Pertanyaan</span>
            </div>
            <div class="step-item <?= ($step === 3) ? 'active' : '' ?>">
                <div class="step-bubble">3</div>
                <span class="step-title">Password Baru</span>
            </div>
        </div>

        <!-- Alert Error -->
        <?php if (!empty($pesan_error)): ?>
            <div class="alert alert-danger alert-dismissible fade show d-flex align-items-center py-2 px-3 small mb-3" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div><?= htmlspecialchars($pesan_error) ?></div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>

        <!-- Alert Warning (Jika pertanyaan keamanan belum diset) -->
        <?php if (!empty($pesan_warning)): ?>
            <div class="alert alert-warning alert-dismissible fade show py-2 px-3 small mb-3" role="alert">
                <div class="d-flex align-items-start">
                    <i class="bi bi-info-circle-fill me-2 fs-5 mt-1 text-warning"></i>
                    <div><?= $pesan_warning ?></div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>

        <!-- ========================================== -->
        <!-- FORM TAHAP 1: INPUT USERNAME               -->
        <!-- ========================================== -->
        <?php if ($step === 1): ?>
            <form action="" method="POST" autocomplete="off">
                <?= csrf_field() ?>
                <input type="hidden" name="step" value="1">
                
                <div class="mb-3">
                    <label for="username" class="form-label small fw-semibold text-secondary">Username Akun</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light text-muted"><i class="bi bi-person"></i></span>
                        <input type="text" class="form-control" id="username" name="username" placeholder="Masukkan username yang lupa password" value="<?= htmlspecialchars($_POST['username'] ?? '') ?>" required autofocus>
                    </div>
                    <div class="form-text small">Sistem akan memeriksa pertanyaan keamanan yang terhubung dengan akun ini.</div>
                </div>

                <button type="submit" class="btn btn-primary w-100 btn-action text-white mb-3">
                    Lanjutkan <i class="bi bi-arrow-right ms-1"></i>
                </button>
            </form>

        <!-- ========================================== -->
        <!-- FORM TAHAP 2: JAWAB PERTANYAAN KEAMANAN    -->
        <!-- ========================================== -->
        <?php elseif ($step === 2): ?>
            <div class="mb-2 d-flex justify-content-between align-items-center">
                <span class="badge bg-light text-dark border px-2 py-1">
                    <i class="bi bi-person-circle me-1 text-primary"></i> <?= htmlspecialchars($_SESSION['reset_flow']['username']) ?>
                </span>
                <a href="lupa_password.php?action=batal" class="text-decoration-none small text-muted">
                    <i class="bi bi-arrow-counterclockwise me-1"></i>Ganti Username
                </a>
            </div>

            <div class="question-box">
                <div class="small text-primary fw-bold mb-1">
                    <i class="bi bi-patch-question-fill me-1"></i> Pertanyaan Keamanan:
                </div>
                <div class="fw-semibold text-dark">
                    <?= htmlspecialchars($_SESSION['reset_flow']['question']) ?>
                </div>
            </div>

            <form action="" method="POST" autocomplete="off">
                <?= csrf_field() ?>
                <input type="hidden" name="step" value="2">

                <div class="mb-3">
                    <label for="jawaban_keamanan" class="form-label small fw-semibold text-secondary">Jawaban Anda</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light text-muted"><i class="bi bi-chat-left-dots"></i></span>
                        <input type="text" class="form-control" id="jawaban_keamanan" name="jawaban_keamanan" placeholder="Ketik jawaban keamanan..." required autofocus>
                    </div>
                    <div class="form-text small">Jawaban tidak membedakan huruf besar maupun huruf kecil.</div>
                </div>

                <button type="submit" class="btn btn-primary w-100 btn-action text-white mb-3">
                    <i class="bi bi-check-circle me-1"></i> Verifikasi Jawaban
                </button>
            </form>

        <!-- ========================================== -->
        <!-- FORM TAHAP 3: SET PASSWORD BARU           -->
        <!-- ========================================== -->
        <?php elseif ($step === 3): ?>
            <div class="alert alert-success py-2 px-3 small mb-3 d-flex align-items-center">
                <i class="bi bi-check-circle-fill me-2 fs-5"></i>
                <div>Pertanyaan keamanan terverifikasi! Silakan buat password baru Anda.</div>
            </div>

            <form action="" method="POST" autocomplete="off">
                <?= csrf_field() ?>
                <input type="hidden" name="step" value="3">

                <div class="mb-3">
                    <label for="password_baru" class="form-label small fw-semibold text-secondary">Password Baru</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light text-muted"><i class="bi bi-lock"></i></span>
                        <input type="password" class="form-control" id="password_baru" name="password_baru" placeholder="Minimal 6 karakter" required autofocus>
                        <button class="btn btn-outline-secondary toggle-password" type="button" data-target="password_baru" title="Lihat Password">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </div>

                <div class="mb-4">
                    <label for="konfirmasi_password" class="form-label small fw-semibold text-secondary">Konfirmasi Password Baru</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light text-muted"><i class="bi bi-lock-fill"></i></span>
                        <input type="password" class="form-control" id="konfirmasi_password" name="konfirmasi_password" placeholder="Ulangi password baru" required>
                        <button class="btn btn-outline-secondary toggle-password" type="button" data-target="konfirmasi_password" title="Lihat Password">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </div>

                <button type="submit" class="btn btn-success w-100 btn-action text-white mb-3" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <i class="bi bi-save me-1"></i> Simpan Password Baru
                </button>
            </form>
        <?php endif; ?>

        <!-- Navigasi Bawah Kembali ke Login -->
        <div class="text-center mt-3 pt-3 border-top">
            <a href="login.php" class="text-decoration-none small text-muted">
                <i class="bi bi-arrow-left me-1"></i> Kembali ke Halaman Login
            </a>
        </div>
    </div>
</div>

<!-- Bootstrap 5 JS Bundle -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
    // Interaktivitas Toggle Password
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const icon = this.querySelector('i');
            if (targetInput && icon) {
                const isPass = targetInput.getAttribute('type') === 'password';
                targetInput.setAttribute('type', isPass ? 'text' : 'password');
                icon.classList.toggle('bi-eye', !isPass);
                icon.classList.toggle('bi-eye-slash', isPass);
            }
        });
    });
</script>
</body>
</html>
