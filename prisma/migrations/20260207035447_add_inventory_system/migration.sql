-- CreateTable
CREATE TABLE `perusahaan` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama_perusahaan` VARCHAR(255) NOT NULL,
    `alamat` TEXT NULL,
    `kontak` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barang_masuk` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `perusahaan_id` BIGINT NOT NULL,
    `tanggal_masuk` DATE NOT NULL,
    `jumlah_ekor` INTEGER NOT NULL,
    `total_kg` DECIMAL(10, 2) NOT NULL,
    `bw` DECIMAL(6, 3) NOT NULL,
    `harga_per_kg` DECIMAL(12, 2) NOT NULL,
    `total_harga` DECIMAL(15, 2) NOT NULL,
    `tanggal_pembayaran` DATE NULL,
    `jumlah_transfer` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `saldo_kita` DECIMAL(15, 2) NOT NULL,
    `nama_kandang` VARCHAR(255) NOT NULL,
    `alamat_kandang` TEXT NULL,
    `no_mobil` VARCHAR(50) NULL,
    `nama_supir` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `barang_masuk_perusahaan_id_idx`(`perusahaan_id`),
    INDEX `barang_masuk_tanggal_masuk_idx`(`tanggal_masuk`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ayam_mati` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `perusahaan_id` BIGINT NOT NULL,
    `tanggal` DATE NOT NULL,
    `jumlah_ekor` INTEGER NOT NULL,
    `keterangan` TEXT NULL,
    `status_claim` ENUM('BISA_CLAIM', 'TIDAK_BISA') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ayam_mati_perusahaan_id_idx`(`perusahaan_id`),
    INDEX `ayam_mati_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barang_keluar` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `perusahaan_id` BIGINT NOT NULL,
    `tanggal` DATE NOT NULL,
    `nama_customer` VARCHAR(255) NOT NULL,
    `jumlah_ekor` INTEGER NOT NULL,
    `total_kg` DECIMAL(10, 2) NOT NULL,
    `jenis_daging` ENUM('BESAR', 'KECIL') NOT NULL,
    `harga_per_kg` DECIMAL(12, 2) NOT NULL,
    `total_penjualan` DECIMAL(15, 2) NOT NULL,
    `pengeluaran` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_bersih` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `barang_keluar_perusahaan_id_idx`(`perusahaan_id`),
    INDEX `barang_keluar_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `barang_masuk` ADD CONSTRAINT `barang_masuk_perusahaan_id_fkey` FOREIGN KEY (`perusahaan_id`) REFERENCES `perusahaan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ayam_mati` ADD CONSTRAINT `ayam_mati_perusahaan_id_fkey` FOREIGN KEY (`perusahaan_id`) REFERENCES `perusahaan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `barang_keluar` ADD CONSTRAINT `barang_keluar_perusahaan_id_fkey` FOREIGN KEY (`perusahaan_id`) REFERENCES `perusahaan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
