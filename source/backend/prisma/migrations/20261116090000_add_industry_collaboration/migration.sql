-- AlterTable
ALTER TABLE `requests` MODIFY `type` ENUM('maintenance', 'access_permission', 'consumable_order', 'equipment_reservation', 'ticket', 'industry_collaboration') NOT NULL;

-- CreateTable
CREATE TABLE `industry_collaboration_details` (
    `request_id` INTEGER NOT NULL,
    `partner_company` VARCHAR(150) NOT NULL,
    `contact_name` VARCHAR(100) NOT NULL,
    `contact_email` VARCHAR(150) NOT NULL,
    `contact_phone` VARCHAR(30) NULL,
    `confidentiality` ENUM('public', 'internal', 'restricted') NOT NULL DEFAULT 'restricted',

    PRIMARY KEY (`request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restricted_access_logs` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `request_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `accessed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `restricted_access_logs_request_id_accessed_at_idx`(`request_id`, `accessed_at`),
    INDEX `restricted_access_logs_user_id_idx`(`user_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `industry_collaboration_details` ADD CONSTRAINT `industry_collaboration_details_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests`(`request_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restricted_access_logs` ADD CONSTRAINT `restricted_access_logs_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests`(`request_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restricted_access_logs` ADD CONSTRAINT `restricted_access_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;