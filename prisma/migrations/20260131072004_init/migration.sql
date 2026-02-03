-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jenis_karyawan` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama_jenis` VARCHAR(255) NOT NULL,
    `jam_masuk` TIME NOT NULL,
    `jam_pulang` TIME NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `karyawan` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `nip` VARCHAR(50) NOT NULL,
    `nama` VARCHAR(255) NOT NULL,
    `jenis_karyawan_id` BIGINT NOT NULL,
    `no_hp` VARCHAR(20) NOT NULL,
    `alamat` TEXT NOT NULL,
    `status` ENUM('AKTIF', 'NONAKTIF') NOT NULL DEFAULT 'AKTIF',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `karyawan_user_id_key`(`user_id`),
    UNIQUE INDEX `karyawan_nip_key`(`nip`),
    INDEX `karyawan_user_id_idx`(`user_id`),
    INDEX `karyawan_jenis_karyawan_id_idx`(`jenis_karyawan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `absensi` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `karyawan_id` BIGINT NOT NULL,
    `tanggal` DATE NOT NULL,
    `jam_masuk` TIME NULL,
    `jam_pulang` TIME NULL,
    `status` ENUM('HADIR', 'TERLAMBAT', 'ALPHA', 'IZIN', 'CUTI') NOT NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `absensi_karyawan_id_idx`(`karyawan_id`),
    INDEX `absensi_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `izin_cuti` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `karyawan_id` BIGINT NOT NULL,
    `jenis` ENUM('IZIN', 'CUTI', 'SAKIT') NOT NULL,
    `tanggal_mulai` DATE NOT NULL,
    `tanggal_selesai` DATE NOT NULL,
    `alasan` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `izin_cuti_karyawan_id_idx`(`karyawan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lembur` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `karyawan_id` BIGINT NOT NULL,
    `tanggal` DATE NOT NULL,
    `jam_mulai` TIME NOT NULL,
    `jam_selesai` TIME NOT NULL,
    `total_jam` TIME NOT NULL,
    `keterangan` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lembur_karyawan_id_idx`(`karyawan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `karyawan` ADD CONSTRAINT `karyawan_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `karyawan` ADD CONSTRAINT `karyawan_jenis_karyawan_id_fkey` FOREIGN KEY (`jenis_karyawan_id`) REFERENCES `jenis_karyawan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absensi` ADD CONSTRAINT `absensi_karyawan_id_fkey` FOREIGN KEY (`karyawan_id`) REFERENCES `karyawan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `izin_cuti` ADD CONSTRAINT `izin_cuti_karyawan_id_fkey` FOREIGN KEY (`karyawan_id`) REFERENCES `karyawan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lembur` ADD CONSTRAINT `lembur_karyawan_id_fkey` FOREIGN KEY (`karyawan_id`) REFERENCES `karyawan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
