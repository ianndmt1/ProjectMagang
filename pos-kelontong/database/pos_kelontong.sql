-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 18 Sep 2026 pada 17.50
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pos_kelontong`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `barang`
--

CREATE TABLE `barang` (
  `id` int(11) NOT NULL,
  `kode_barang` varchar(20) NOT NULL,
  `id_kategori` int(11) DEFAULT NULL,
  `nama_barang` varchar(150) NOT NULL,
  `harga_beli` decimal(12,2) DEFAULT 0.00,
  `harga_jual` decimal(12,2) NOT NULL,
  `stok` int(11) NOT NULL DEFAULT 0,
  `satuan` varchar(20) DEFAULT 'pcs',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `barang`
--

INSERT INTO `barang` (`id`, `kode_barang`, `id_kategori`, `nama_barang`, `harga_beli`, `harga_jual`, `stok`, `satuan`, `created_at`, `updated_at`) VALUES
(2, 'BRG001', 6, 'Indomie Goreng Original', 2800.00, 3500.00, 118, 'bungkus', '2026-09-17 02:02:20', '2026-09-17 03:42:38'),
(3, 'BRG002', 6, 'Minyak Goreng Bimoli 1 Liter', 16500.00, 18500.00, 40, 'pouch', '2026-09-17 02:02:20', '2026-09-17 03:42:38'),
(4, 'BRG003', 6, 'Gula Pasir Gulaku Premium 1 kg', 15000.00, 17500.00, 25, 'kg', '2026-09-17 02:02:20', '2026-09-17 03:42:38'),
(5, 'BRG004', 7, 'Kopi Kapal Api Spesial Mix (Renceng)', 12000.00, 15000.00, 30, 'renceng', '2026-09-17 02:02:20', '2026-09-17 03:42:38'),
(6, 'BRG005', 6, 'Beras Ramos Super 5 kg', 65000.00, 72000.00, 13, 'karung', '2026-09-17 02:02:20', '2026-09-17 04:54:14'),
(7, 'BRG006', 7, 'Teh Botol Sosro 330ml', 3000.00, 4000.00, 4, 'botol', '2026-09-17 02:02:20', '2026-09-17 03:42:38'),
(9, 'BRG999', 7, 'Kopi Kapal Api 165g', 25000.00, 30000.00, 50, 'pcs', '2026-09-18 03:59:48', '2026-09-18 03:59:48');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kategori`
--

CREATE TABLE `kategori` (
  `id` int(11) NOT NULL,
  `nama_kategori` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `kategori`
--

INSERT INTO `kategori` (`id`, `nama_kategori`) VALUES
(7, 'Minuman'),
(3, 'Obat-obatan'),
(4, 'Pampers'),
(1, 'Rokok'),
(2, 'Sabun Mandi'),
(6, 'Sembako'),
(5, 'Softex');

-- --------------------------------------------------------

--
-- Struktur dari tabel `pelanggan`
--

CREATE TABLE `pelanggan` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `alamat` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `pelanggan`
--

INSERT INTO `pelanggan` (`id`, `nama`, `no_hp`, `alamat`, `created_at`) VALUES
(1, '__TEST_PELANGGAN__', '081299998888', 'Jl. Uji Coba No. 99', '2026-09-17 03:52:12'),
(3, 'adas', 'adad', 'adadsa', '2026-09-17 04:39:49'),
(4, 'joko', '', '', '2026-09-17 04:42:56');

-- --------------------------------------------------------

--
-- Struktur dari tabel `pembayaran_piutang`
--

CREATE TABLE `pembayaran_piutang` (
  `id` int(11) NOT NULL,
  `id_piutang` int(11) NOT NULL,
  `jumlah_bayar` decimal(12,2) NOT NULL,
  `tanggal_bayar` timestamp NOT NULL DEFAULT current_timestamp(),
  `keterangan` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `pembayaran_piutang`
--

INSERT INTO `pembayaran_piutang` (`id`, `id_piutang`, `jumlah_bayar`, `tanggal_bayar`, `keterangan`) VALUES
(3, 2, 20000.00, '2026-09-17 04:43:22', 'Uang Muka (DP) Transaksi Kasir'),
(4, 3, 49997.00, '2026-09-17 04:54:14', 'Uang Muka (DP) Transaksi Kasir'),
(5, 3, 20000.00, '2026-09-17 04:55:27', 'Pembayaran Cicilan Kasbon'),
(6, 3, 2003.00, '2026-09-17 04:56:33', 'Pelunasan Kasbon');

-- --------------------------------------------------------

--
-- Struktur dari tabel `piutang`
--

CREATE TABLE `piutang` (
  `id` int(11) NOT NULL,
  `id_transaksi` int(11) NOT NULL,
  `id_pelanggan` int(11) NOT NULL,
  `total_piutang` decimal(12,2) NOT NULL,
  `sisa_piutang` decimal(12,2) NOT NULL,
  `status` enum('belum_lunas','lunas') NOT NULL DEFAULT 'belum_lunas',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `piutang`
--

INSERT INTO `piutang` (`id`, `id_transaksi`, `id_pelanggan`, `total_piutang`, `sisa_piutang`, `status`, `created_at`) VALUES
(2, 4, 4, 72000.00, 52000.00, 'belum_lunas', '2026-09-17 04:43:22'),
(3, 5, 4, 72000.00, 0.00, 'lunas', '2026-09-17 04:54:14');

-- --------------------------------------------------------

--
-- Struktur dari tabel `transaksi`
--

CREATE TABLE `transaksi` (
  `id` int(11) NOT NULL,
  `kode_transaksi` varchar(30) NOT NULL,
  `id_kasir` int(11) NOT NULL,
  `metode_pembayaran` enum('tunai','piutang') NOT NULL DEFAULT 'tunai',
  `id_pelanggan` int(11) DEFAULT NULL,
  `total_belanja` decimal(12,2) NOT NULL,
  `uang_bayar` decimal(12,2) NOT NULL,
  `kembalian` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `transaksi`
--

INSERT INTO `transaksi` (`id`, `kode_transaksi`, `id_kasir`, `metode_pembayaran`, `id_pelanggan`, `total_belanja`, `uang_bayar`, `kembalian`, `created_at`) VALUES
(1, 'TRX-20260917-TEST01', 1, 'tunai', NULL, 7000.00, 10000.00, 3000.00, '2026-09-17 02:07:08'),
(4, 'TRX-20260917-0002', 1, 'piutang', 4, 72000.00, 20000.00, 0.00, '2026-09-17 04:43:22'),
(5, 'TRX-20260917-0003', 1, 'piutang', 4, 72000.00, 49997.00, 0.00, '2026-09-17 04:54:14');

-- --------------------------------------------------------

--
-- Struktur dari tabel `transaksi_detail`
--

CREATE TABLE `transaksi_detail` (
  `id` int(11) NOT NULL,
  `id_transaksi` int(11) NOT NULL,
  `id_barang` int(11) NOT NULL,
  `nama_barang` varchar(150) NOT NULL,
  `harga_satuan` decimal(12,2) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `transaksi_detail`
--

INSERT INTO `transaksi_detail` (`id`, `id_transaksi`, `id_barang`, `nama_barang`, `harga_satuan`, `jumlah`, `subtotal`) VALUES
(1, 1, 2, 'Indomie Goreng Original', 3500.00, 2, 7000.00),
(3, 4, 6, 'Beras Ramos Super 5 kg', 72000.00, 1, 72000.00),
(4, 5, 6, 'Beras Ramos Super 5 kg', 72000.00, 1, 72000.00);

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `role` enum('pemilik','kasir') NOT NULL DEFAULT 'kasir',
  `pertanyaan_keamanan` varchar(255) DEFAULT NULL,
  `jawaban_keamanan` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `nama_lengkap`, `role`, `pertanyaan_keamanan`, `jawaban_keamanan`, `created_at`) VALUES
(1, 'pemilik', '$2y$10$S1pmqpb0W.GFe1eEG1uFF.zgqRHMwuI593/zEI2njS64SE8Z5ByPG', 'Pemilik Toko', 'pemilik', NULL, NULL, '2026-09-17 01:59:00'),
(2, 'kasir', '$2y$10$eQrONNLDAvlEkijSIj7tOuT6y9T2xzW9ZTUynGcNJ5i2Ek7N7XZWa', 'Kasir 1', 'kasir', NULL, NULL, '2026-09-17 01:59:00'),
(4, 'kasir2', '$2y$10$7/vq8Q5bbd2j2zA0e14PWeqPjdTJRyfshkOlETqzrUYSlkn4nSev6', 'siti', 'kasir', 'Apa nama hewan peliharaan pertama Anda?', '$2y$10$NTkVT1ha.lrjasRAsVtknONR4qL3QkbfoHgmXFIUY6/YbFZOdX.6.', '2026-09-17 03:01:19');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `barang`
--
ALTER TABLE `barang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_barang` (`kode_barang`),
  ADD KEY `fk_barang_kategori` (`id_kategori`);

--
-- Indeks untuk tabel `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama_kategori` (`nama_kategori`);

--
-- Indeks untuk tabel `pelanggan`
--
ALTER TABLE `pelanggan`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `pembayaran_piutang`
--
ALTER TABLE `pembayaran_piutang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_piutang` (`id_piutang`);

--
-- Indeks untuk tabel `piutang`
--
ALTER TABLE `piutang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_transaksi` (`id_transaksi`),
  ADD KEY `id_pelanggan` (`id_pelanggan`);

--
-- Indeks untuk tabel `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_transaksi` (`kode_transaksi`),
  ADD KEY `id_kasir` (`id_kasir`),
  ADD KEY `fk_transaksi_pelanggan` (`id_pelanggan`);

--
-- Indeks untuk tabel `transaksi_detail`
--
ALTER TABLE `transaksi_detail`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_transaksi` (`id_transaksi`),
  ADD KEY `id_barang` (`id_barang`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `barang`
--
ALTER TABLE `barang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `pelanggan`
--
ALTER TABLE `pelanggan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `pembayaran_piutang`
--
ALTER TABLE `pembayaran_piutang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `piutang`
--
ALTER TABLE `piutang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `transaksi_detail`
--
ALTER TABLE `transaksi_detail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `barang`
--
ALTER TABLE `barang`
  ADD CONSTRAINT `fk_barang_kategori` FOREIGN KEY (`id_kategori`) REFERENCES `kategori` (`id`);

--
-- Ketidakleluasaan untuk tabel `pembayaran_piutang`
--
ALTER TABLE `pembayaran_piutang`
  ADD CONSTRAINT `pembayaran_piutang_ibfk_1` FOREIGN KEY (`id_piutang`) REFERENCES `piutang` (`id`);

--
-- Ketidakleluasaan untuk tabel `piutang`
--
ALTER TABLE `piutang`
  ADD CONSTRAINT `piutang_ibfk_1` FOREIGN KEY (`id_transaksi`) REFERENCES `transaksi` (`id`),
  ADD CONSTRAINT `piutang_ibfk_2` FOREIGN KEY (`id_pelanggan`) REFERENCES `pelanggan` (`id`);

--
-- Ketidakleluasaan untuk tabel `transaksi`
--
ALTER TABLE `transaksi`
  ADD CONSTRAINT `fk_transaksi_pelanggan` FOREIGN KEY (`id_pelanggan`) REFERENCES `pelanggan` (`id`),
  ADD CONSTRAINT `transaksi_ibfk_1` FOREIGN KEY (`id_kasir`) REFERENCES `users` (`id`);

--
-- Ketidakleluasaan untuk tabel `transaksi_detail`
--
ALTER TABLE `transaksi_detail`
  ADD CONSTRAINT `transaksi_detail_ibfk_1` FOREIGN KEY (`id_transaksi`) REFERENCES `transaksi` (`id`),
  ADD CONSTRAINT `transaksi_detail_ibfk_2` FOREIGN KEY (`id_barang`) REFERENCES `barang` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
