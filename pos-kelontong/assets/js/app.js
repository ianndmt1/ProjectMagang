/**
 * File: assets/js/app.js
 * Deskripsi: Skrip JavaScript utilitas & interaksi global POS Toko Kelontong
 * Fase 9 - Polish UI/UX: Auto-dismiss alert (semua jenis), toast notifikasi,
 *          loading state, keyboard shortcut, animasi transisi halaman
 */

document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. AUTO-DISMISS ALERT — semua tipe (sukses, bahaya, warning, info)
    // ==========================================
    // Sukses: hilang setelah 5 detik
    // Danger/warning: hilang setelah 8 detik (beri waktu baca)
    const alertTimings = {
        'alert-success': 5000,
        'alert-info':    5000,
        'alert-warning': 8000,
        'alert-danger':  8000,
    };

    document.querySelectorAll('.alert-dismissible').forEach(function (alertEl) {
        let delay = 5000; // default
        for (const [cls, time] of Object.entries(alertTimings)) {
            if (alertEl.classList.contains(cls)) {
                delay = time;
                break;
            }
        }
        setTimeout(function () {
            if (alertEl && document.contains(alertEl)) {
                if (typeof bootstrap !== 'undefined') {
                    const bsAlert = bootstrap.Alert.getOrCreateInstance(alertEl);
                    if (bsAlert) bsAlert.close();
                } else {
                    alertEl.style.opacity = '0';
                    alertEl.style.transition = 'opacity 0.4s ease';
                    setTimeout(() => alertEl.remove(), 400);
                }
            }
        }, delay);
    });

    // ==========================================
    // 2. TOAST NOTIFIKASI — fungsi global window.posToast()
    // ==========================================
    // Buat container toast jika belum ada
    let toastContainer = document.getElementById('posToastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'posToastContainer';
        // Pojok kanan bawah agar tidak menganggu keranjang
        toastContainer.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:1090;display:flex;flex-direction:column;gap:0.5rem;';
        document.body.appendChild(toastContainer);
    }

    /**
     * Tampilkan toast notifikasi ringan
     * @param {string} message Pesan yang ditampilkan
     * @param {string} type    'success' | 'danger' | 'warning' | 'info'
     * @param {number} duration Durasi dalam ms (default: 4000)
     */
    window.posToast = function (message, type = 'success', duration = 4000) {
        const iconMap = {
            success: 'bi-check-circle-fill',
            danger:  'bi-exclamation-triangle-fill',
            warning: 'bi-exclamation-circle-fill',
            info:    'bi-info-circle-fill',
        };
        const icon = iconMap[type] || 'bi-bell-fill';

        const toast = document.createElement('div');
        toast.className = `alert alert-${type} d-flex align-items-center gap-2 py-2 px-3 shadow-sm mb-0`;
        toast.style.cssText = 'min-width:260px;max-width:340px;animation:alertSlideIn 0.3s ease;';
        toast.innerHTML = `<i class="bi ${icon} flex-shrink-0"></i><span style="font-size:0.875rem;">${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(16px)';
            toast.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
            setTimeout(() => toast.remove(), 350);
        }, duration);
    };

    /**
     * Modal konfirmasi kustom menggantikan native browser confirm()
     * @param {Object} options { title, message, confirmText, confirmClass, onConfirm }
     */
    window.posConfirm = function(options) {
        const {
            title = 'Konfirmasi',
            message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
            confirmText = 'Ya, Lanjutkan',
            confirmClass = 'btn-danger',
            onConfirm = null
        } = options;

        let modalEl = document.getElementById('posGlobalConfirmModal');
        if (!modalEl) {
            modalEl = document.createElement('div');
            modalEl.id = 'posGlobalConfirmModal';
            modalEl.className = 'modal fade';
            modalEl.tabIndex = -1;
            modalEl.innerHTML = `
                <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
                    <div class="modal-content border-0 shadow">
                        <div class="modal-header border-bottom-0 pb-0">
                            <h6 class="modal-title fw-bold d-flex align-items-center gap-2" id="posConfirmTitle">
                                <i class="bi bi-question-circle-fill text-warning fs-5"></i>
                                <span>Konfirmasi</span>
                            </h6>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body py-3">
                            <p class="mb-0 text-secondary" id="posConfirmMessage"></p>
                        </div>
                        <div class="modal-footer border-top-0 pt-0">
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">
                                <i class="bi bi-x-lg me-1"></i> Batal
                            </button>
                            <button type="button" id="posConfirmActionBtn" class="btn btn-sm">
                                <i class="bi bi-check-lg me-1"></i> <span>Konfirmasi</span>
                            </button>
                        </div>
                    </div>
                </div>`;
            document.body.appendChild(modalEl);
        }

        document.querySelector('#posConfirmTitle span').textContent = title;
        document.getElementById('posConfirmMessage').textContent = message;
        const actionBtn = document.getElementById('posConfirmActionBtn');
        actionBtn.className = `btn btn-sm ${confirmClass}`;
        actionBtn.querySelector('span').textContent = confirmText;

        const bsModal = new bootstrap.Modal(modalEl);

        const newActionBtn = actionBtn.cloneNode(true);
        actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);
        newActionBtn.addEventListener('click', function() {
            bsModal.hide();
            if (typeof onConfirm === 'function') onConfirm();
        });

        bsModal.show();
    };

    // ==========================================
    // 3. FORMAT INPUT RIBUAN / RUPIAH (Fungsi Reusable)
    // ==========================================
    /**
     * Mengambil nilai angka murni (tanpa titik pemisah) dari sebuah input
     * @param {HTMLInputElement|string} input Elemen input atau string angka
     * @returns {number} Angka murni (float/int)
     */
    window.getRawValue = function (input) {
        if (!input) return 0;
        if (typeof input === 'string' || typeof input === 'number') {
            return parseFloat(String(input).replace(/\D/g, '')) || 0;
        }
        const raw = (input.dataset && input.dataset.value !== undefined && input.dataset.value !== '') 
                    ? input.dataset.value 
                    : input.value;
        return parseFloat(String(raw).replace(/\D/g, '')) || 0;
    };

    /**
     * Memformat input angka dengan pemisah ribuan otomatis (titik) format Indonesia.
     * Cara kerja:
     * 1. Parsing: Mengekstrak hanya karakter digit (0-9) dengan regex \D.
     * 2. Tracking Kursor: Menghitung jumlah digit sebelum posisi kursor saat ini agar saat
     *    titik ditambahkan atau dihapus (backspace), posisi kursor tidak loncat ke akhir input.
     * 3. Penyimpanan Nilai Murni: Menyimpan string angka murni di atribut input.dataset.value.
     * 4. Formatting: Mengubah angka menjadi string berpemisah titik menggunakan toLocaleString('id-ID').
     * 5. Sinkronisasi Form: Menambahkan event submit pada form pembungkus agar saat form
     *    dikirim ke server, nilai yang terkirim adalah angka murni tanpa titik.
     * 
     * @param {HTMLInputElement} input Elemen input yang akan diformat
     */
    window.formatRibuan = function (input) {
        if (!input || input._hasFormatRibuan) return;
        input._hasFormatRibuan = true;

        // Pastikan input bukan type="number" agar mendukung karakter titik
        if (input.type === 'number') {
            input.type = 'text';
            input.setAttribute('inputmode', 'numeric');
        }

        function terapkanFormat() {
            const val = input.value;
            const selectionStart = input.selectionStart ?? val.length;

            // Hitung berapa banyak digit angka murni sebelum kursor
            const digitsBeforeCursor = val.slice(0, selectionStart).replace(/\D/g, '').length;

            // Ambil hanya digit angka
            const rawNumbers = val.replace(/\D/g, '');

            // Simpan nilai asli tanpa titik di atribut data-value
            input.dataset.value = rawNumbers;

            if (!rawNumbers) {
                input.value = '';
                return;
            }

            // Format angka dengan titik pemisah ribuan id-ID (contoh: 15.000)
            const formatted = parseInt(rawNumbers, 10).toLocaleString('id-ID');
            input.value = formatted;

            // Hitung kembali posisi kursor berdasarkan jumlah digit sebelumnya
            if (input.setSelectionRange) {
                let newCursorPos = 0;
                let digitCount = 0;
                for (let i = 0; i < formatted.length; i++) {
                    if (/\d/.test(formatted[i])) {
                        digitCount++;
                    }
                    if (digitCount === digitsBeforeCursor) {
                        newCursorPos = i + 1;
                        break;
                    }
                }
                if (digitsBeforeCursor === 0) newCursorPos = 0;
                input.setSelectionRange(newCursorPos, newCursorPos);
            }
        }

        // Terapkan format saat ada pengetikan (input)
        input.addEventListener('input', terapkanFormat);

        // Format nilai inisial jika input sudah terisi nilai saat halaman dimuat
        if (input.value) {
            const initialRaw = String(input.value).replace(/\D/g, '');
            input.dataset.value = initialRaw;
            if (initialRaw) {
                input.value = parseInt(initialRaw, 10).toLocaleString('id-ID');
            }
        }

        // Normalisasi nilai ke angka murni saat form induk disubmit
        const parentForm = input.closest('form');
        if (parentForm && !parentForm._hasRibuanSubmitHandler) {
            parentForm._hasRibuanSubmitHandler = true;
            parentForm.addEventListener('submit', function () {
                parentForm.querySelectorAll('.format-ribuan, .format-rupiah').forEach(function (el) {
                    if (el.dataset && el.dataset.value !== undefined && el.dataset.value !== '') {
                        el.value = el.dataset.value;
                    } else {
                        el.value = el.value.replace(/\D/g, '');
                    }
                });
            });
        }
    };

    // Inisialisasi otomatis semua input dengan class .format-ribuan atau .format-rupiah
    document.querySelectorAll('.format-ribuan, .format-rupiah').forEach(function (input) {
        window.formatRibuan(input);
    });

    // ==========================================
    // 4. PINTASAN KEYBOARD KASIR
    // ==========================================
    document.addEventListener('keydown', function (e) {
        // F2 → fokus ke field pencarian barang
        if (e.key === 'F2') {
            e.preventDefault();
            const el = document.getElementById('inputCariBarang');
            if (el) { el.focus(); el.select(); }
        }

        // F4 → fokus ke input uang pembayaran
        if (e.key === 'F4') {
            e.preventDefault();
            const el = document.getElementById('inputUangBayar');
            if (el) { el.focus(); el.select(); }
        }

        // Escape → tutup modal yang sedang terbuka (jika ada)
        if (e.key === 'Escape') {
            // Bootstrap menangani ini otomatis, tapi kita pastikan
            const openModal = document.querySelector('.modal.show');
            if (openModal && typeof bootstrap !== 'undefined') {
                bootstrap.Modal.getInstance(openModal)?.hide();
            }
        }
    });

    // ==========================================
    // 5. KONFIRMASI HAPUS — semua tombol .btn-konfirmasi-hapus
    // ==========================================
    // Pakai modal Bootstrap kecil, bukan browser confirm()
    document.querySelectorAll('[data-konfirmasi-hapus]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const url    = this.dataset.konfirmasiHapus;
            const label  = this.dataset.label || 'data ini';

            // Buat modal mini hapus jika belum ada
            let miniModal = document.getElementById('miniHapusModal');
            if (!miniModal) {
                miniModal = document.createElement('div');
                miniModal.id = 'miniHapusModal';
                miniModal.className = 'modal fade';
                miniModal.tabIndex = -1;
                miniModal.innerHTML = `
                    <div class="modal-dialog modal-dialog-centered" style="max-width:400px">
                        <div class="modal-content border-0 shadow">
                            <div class="modal-header border-bottom-0 pb-0">
                                <h6 class="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                                    <i class="bi bi-trash3-fill"></i> Konfirmasi Hapus
                                </h6>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body py-3">
                                <p class="mb-0 text-secondary" id="miniHapusPesan"></p>
                            </div>
                            <div class="modal-footer border-top-0 pt-0">
                                <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">
                                    <i class="bi bi-x-lg me-1"></i>Batal
                                </button>
                                <a href="#" id="miniHapusConfirmBtn" class="btn btn-danger btn-sm">
                                    <i class="bi bi-trash3 me-1"></i>Ya, Hapus
                                </a>
                            </div>
                        </div>
                    </div>`;
                document.body.appendChild(miniModal);
            }

            document.getElementById('miniHapusPesan').textContent =
                `Apakah Anda yakin ingin menghapus ${label}? Tindakan ini tidak dapat dibatalkan.`;
            document.getElementById('miniHapusConfirmBtn').href = url;

            const bsModal = new bootstrap.Modal(miniModal);
            bsModal.show();
        });
    });

    // ==========================================
    // 6. ANIMASI FADE-IN HALAMAN
    // ==========================================
    // Tambahkan class animasi ke main content
    const mainContent = document.querySelector('main > .container');
    if (mainContent) {
        mainContent.style.animation = 'pageFadeIn 0.3s ease';
    }

    // ==========================================
    // 7. HIGHLIGHT BARIS TABEL AKTIF (klik untuk pilih)
    // ==========================================
    document.querySelectorAll('.table-selectable tbody tr').forEach(function (row) {
        row.addEventListener('click', function () {
            this.closest('tbody').querySelectorAll('tr').forEach(r => r.classList.remove('table-primary'));
            this.classList.add('table-primary');
        });
    });

    // ==========================================
    // 8. TOOLTIP BOOTSTRAP — aktifkan semua [data-bs-toggle="tooltip"]
    // ==========================================
    const tooltipEls = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (tooltipEls.length && typeof bootstrap !== 'undefined') {
        tooltipEls.forEach(el => new bootstrap.Tooltip(el, { trigger: 'hover focus' }));
    }

});
