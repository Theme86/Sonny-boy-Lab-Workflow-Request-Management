-- AlterTable
ALTER TABLE `users` ADD COLUMN `bio` VARCHAR(300) NULL,
    ADD COLUMN `department` VARCHAR(150) NULL,
    ADD COLUMN `phone` VARCHAR(20) NULL,
    ADD COLUMN `profile_completed_at` DATETIME(3) NULL,
    ADD COLUMN `student_id` VARCHAR(20) NULL;
