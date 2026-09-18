<?php
/**
 * File: auth/login.php
 * Deskripsi: Form dan proses autentikasi login (verifikasi password_hash dan inisialisasi session)
 * Aturan: Menggunakan prepared statements, password_verify(), dan session aman
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

// Jika pengguna sudah memiliki sesi login aktif, langsung arahkan ke dashboard
redirect_jika_login();

// ==========================================
// 2. INISIALISASI VARIABEL STATUS & NOTIFIKASI
// ==========================================
$pesan_error = '';
$pesan_sukses = '';

// Menangkap notifikasi dari parameter URL GET
if (isset($_GET['pesan'])) {
    if ($_GET['pesan'] === 'logout') {
        $pesan_sukses = 'Anda telah berhasil logout dari sistem.';
    } elseif ($_GET['pesan'] === 'belum_login') {
        $pesan_error = 'Silakan login terlebih dahulu untuk mengakses sistem.';
    } elseif ($_GET['pesan'] === 'akses_ditolak') {
        $pesan_error = 'Akses ditolak! Anda tidak memiliki izin untuk halaman tersebut.';
    } elseif ($_GET['pesan'] === 'password_direset') {
        $pesan_sukses = 'Password berhasil direset! Silakan login dengan password baru Anda.';
    }
}

// ==========================================
// 3. PEMROSESAN FORM LOGIN (METODE POST)
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Proteksi Rate Limiting (Maksimal 5x gagal dalam 5 menit)
    $attempts = $_SESSION['login_attempts'] ?? 0;
    $last_attempt = $_SESSION['last_attempt_time'] ?? 0;

    if ($attempts >= 5 && (time() - $last_attempt) < 300) {
        $sisa_waktu = ceil((300 - (time() - $last_attempt)) / 60);
        $pesan_error = "Terlalu banyak percobaan login yang gagal. Silakan tunggu {$sisa_waktu} menit sebelum mencoba lagi.";
    } elseif (!validasi_csrf()) {
        // Proteksi Cross-Site Request Forgery (CSRF)
        $pesan_error = 'Token keamanan (CSRF) tidak valid atau sesi telah kedaluwarsa!';
    } else {
        // Sanitasi dan pengambilan input
        $username = trim($_POST['username'] ?? '');
        $password = trim($_POST['password'] ?? '');

        // Validasi input tidak boleh kosong
        if (empty($username) || empty($password)) {
            $pesan_error = 'Username dan password wajib diisi!';
        } else {
            // Menyiapkan query dengan Prepared Statement untuk mencegah SQL Injection
            $query = "SELECT id, username, password, nama_lengkap, role FROM users WHERE username = ? LIMIT 1";
            $stmt = mysqli_prepare($conn, $query);

            if ($stmt) {
                // Binding parameter username
                mysqli_stmt_bind_param($stmt, "s", $username);
                mysqli_stmt_execute($stmt);
                $result = mysqli_stmt_get_result($stmt);

                // Memeriksa keberadaan user dan validasi password
                if ($user = mysqli_fetch_assoc($result)) {
                    if (password_verify($password, $user['password'])) {
                        // Reset percobaan gagal jika login sukses
                        unset($_SESSION['login_attempts'], $_SESSION['last_attempt_time']);

                        // Regenerasi ID sesi untuk mencegah serangan session fixation
                        session_regenerate_id(true);

                        // Menyimpan data penting ke dalam variabel session
                        $_SESSION['login']        = true;
                        $_SESSION['id']           = $user['id'];
                        $_SESSION['username']     = $user['username'];
                        $_SESSION['nama_lengkap'] = $user['nama_lengkap'];
                        $_SESSION['role']         = $user['role'];

                        // Tutup statement dan alihkan ke dashboard
                        mysqli_stmt_close($stmt);
                        header("Location: " . BASE_URL . "dashboard/index.php");
                        exit;
                    } else {
                        // Catat percobaan gagal
                        $_SESSION['login_attempts'] = $attempts + 1;
                        $_SESSION['last_attempt_time'] = time();
                        $pesan_error = 'Password yang Anda masukkan salah!';
                    }
                } else {
                    // Catat percobaan gagal
                    $_SESSION['login_attempts'] = $attempts + 1;
                    $_SESSION['last_attempt_time'] = time();
                    $pesan_error = 'Username tidak ditemukan!';
                }

                mysqli_stmt_close($stmt);
            } else {
                $pesan_error = 'Terjadi kesalahan sistem saat memproses login.';
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
    <title>Login - POS Toko Kelontong</title>
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
        .login-card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
            width: 100%;
            max-width: 420px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .login-header {
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
            color: #ffffff;
            padding: 32px 24px 24px;
            text-align: center;
        }
        .login-icon {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.15);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-size: 28px;
            margin-bottom: 12px;
            backdrop-filter: blur(4px);
        }
        .login-body {
            padding: 30px 28px;
        }
        .form-floating:focus-within {
            z-index: 2;
        }
        .btn-login {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            border: none;
            padding: 12px;
            font-weight: 600;
            border-radius: 8px;
            transition: all 0.2s ease;
        }
        .btn-login:hover {
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
        }
        .toggle-password {
            cursor: pointer;
            z-index: 10;
        }
    </style>
</head>
<body>

<div class="login-card">
    <!-- Header Kartu Login -->
    <div class="login-header">
        <div class="login-icon">
            <i class="bi bi-shop"></i>
        </div>
        <h4 class="fw-bold mb-1">POS Kelontong</h4>
        <p class="text-white-50 mb-0 small">Sistem Manajemen Penjualan & Kasir</p>
    </div>

    <!-- Badan Form Login -->
    <div class="login-body">
        <!-- Notifikasi Pesan Sukses -->
        <?php if (!empty($pesan_sukses)): ?>
            <div class="alert alert-success alert-dismissible fade show d-flex align-items-center py-2 px-3 small" role="alert">
                <i class="bi bi-check-circle-fill me-2 fs-5"></i>
                <div><?= htmlspecialchars($pesan_sukses) ?></div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>

        <!-- Notifikasi Pesan Error -->
        <?php if (!empty($pesan_error)): ?>
            <div class="alert alert-danger alert-dismissible fade show d-flex align-items-center py-2 px-3 small" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div><?= htmlspecialchars($pesan_error) ?></div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>

        <!-- Form Input Login -->
        <form action="" method="POST" autocomplete="off">
            <?= csrf_field() ?>
            <div class="mb-3">
                <label for="username" class="form-label small fw-semibold text-secondary">Username</label>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-person"></i></span>
                    <input type="text" class="form-control" id="username" name="username" placeholder="Masukkan username" value="<?= htmlspecialchars($username ?? '') ?>" required autofocus>
                </div>
            </div>

            <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <label for="password" class="form-label small fw-semibold text-secondary mb-0">Password</label>
                    <a href="lupa_password.php" class="small text-decoration-none text-primary fw-medium">Lupa Password?</a>
                </div>
                <div class="input-group">
                    <span class="input-group-text bg-light text-muted"><i class="bi bi-lock"></i></span>
                    <input type="password" class="form-control" id="password" name="password" placeholder="Masukkan password" required>
                    <button class="btn btn-outline-secondary toggle-password" type="button" id="btnTogglePassword" title="Lihat Password">
                        <i class="bi bi-eye" id="eyeIcon"></i>
                    </button>
                </div>
            </div>

            <button type="submit" class="btn btn-primary w-100 btn-login text-white">
                <i class="bi bi-box-arrow-in-right me-1"></i> Masuk ke Sistem
            </button>
        </form>

        <div class="text-center mt-4 pt-2 border-top">
            <small class="text-muted">Aplikasi POS Toko Kelontong &copy; <?= date('Y') ?></small>
        </div>
    </div>
</div>

<!-- Bootstrap 5 JS Bundle -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
    // Fitur interaktif toggle lihat password
    const togglePasswordBtn = document.getElementById('btnTogglePassword');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');

    if (togglePasswordBtn && passwordInput && eyeIcon) {
        togglePasswordBtn.addEventListener('click', function () {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            eyeIcon.classList.toggle('bi-eye', !isPassword);
            eyeIcon.classList.toggle('bi-eye-slash', isPassword);
        });
    }
</script>
</body>
</html>
