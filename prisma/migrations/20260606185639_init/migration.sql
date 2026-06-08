-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `noHp` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `pin` VARCHAR(191) NULL,
    `saldo` DOUBLE NOT NULL DEFAULT 0,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_noHp_key`(`noHp`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Produk` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `kategori` ENUM('PULSA', 'PAKET_DATA', 'PLN', 'GAME', 'EMONEY') NOT NULL,
    `operator` VARCHAR(191) NOT NULL,
    `hargaBeli` DOUBLE NOT NULL,
    `hargaJual` DOUBLE NOT NULL,
    `isAktif` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Produk_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaksi` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `produkId` VARCHAR(191) NOT NULL,
    `nomorTujuan` VARCHAR(191) NOT NULL,
    `harga` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'SUKSES', 'GAGAL') NOT NULL DEFAULT 'PENDING',
    `refId` VARCHAR(191) NULL,
    `keterangan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Transaksi_refId_key`(`refId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopupSaldo` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `jumlah` DOUBLE NOT NULL,
    `metode` VARCHAR(191) NOT NULL,
    `bukti` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'SUKSES', 'GAGAL') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transaksi` ADD CONSTRAINT `Transaksi_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaksi` ADD CONSTRAINT `Transaksi_produkId_fkey` FOREIGN KEY (`produkId`) REFERENCES `Produk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopupSaldo` ADD CONSTRAINT `TopupSaldo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
