-- AlterTable
ALTER TABLE `users` ADD COLUMN `need_password_reset` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reset_requested_at` DATETIME(3) NULL;
