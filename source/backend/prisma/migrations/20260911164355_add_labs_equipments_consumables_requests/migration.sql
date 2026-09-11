-- CreateTable
CREATE TABLE `lab_rooms` (
    `room_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `capacity` INTEGER NULL,
    `location` VARCHAR(100) NULL,

    PRIMARY KEY (`room_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `project_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `type` VARCHAR(30) NULL,
    `owner_id` INTEGER NULL,

    PRIMARY KEY (`project_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_categories` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(250) NULL,

    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_property` (
    `property_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(250) NULL,

    PRIMARY KEY (`property_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipments` (
    `equipment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(250) NULL,
    `category_id` INTEGER NULL,
    `quantity_total` INTEGER NOT NULL DEFAULT 0,
    `quantity_available` INTEGER NOT NULL DEFAULT 0,
    `location` VARCHAR(100) NULL,
    `image_url` VARCHAR(500) NULL,

    PRIMARY KEY (`equipment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prop_equip` (
    `equipment_id` INTEGER NOT NULL,
    `property_id` INTEGER NOT NULL,

    PRIMARY KEY (`equipment_id`, `property_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hazards` (
    `hazard_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(250) NULL,

    PRIMARY KEY (`hazard_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consumable_property` (
    `property_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(250) NULL,

    PRIMARY KEY (`property_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consumables` (
    `consumable_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(250) NULL,
    `unit` VARCHAR(10) NOT NULL,
    `current_stock` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `reorder_threshold` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `ph_value` DECIMAL(4, 2) NULL,
    `expiry_date` DATE NULL,
    `image_url` VARCHAR(500) NULL,

    PRIMARY KEY (`consumable_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `haz_con` (
    `consumable_id` INTEGER NOT NULL,
    `hazard_id` INTEGER NOT NULL,

    PRIMARY KEY (`consumable_id`, `hazard_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prop_con` (
    `consumable_id` INTEGER NOT NULL,
    `property_id` INTEGER NOT NULL,

    PRIMARY KEY (`consumable_id`, `property_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requests` (
    `request_id` INTEGER NOT NULL AUTO_INCREMENT,
    `requester_id` INTEGER NOT NULL,
    `assigned_to` INTEGER NULL,
    `type` ENUM('borrow', 'maintenance', 'calibration', 'repair', 'other') NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` VARCHAR(250) NULL,
    `status` ENUM('open', 'in_progress', 'resolved', 'closed', 'rejected') NOT NULL DEFAULT 'open',
    `priority` VARCHAR(10) NULL DEFAULT 'medium',
    `equipment_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closed_at` DATETIME(3) NULL,

    PRIMARY KEY (`request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `request_status_history` (
    `history_id` INTEGER NOT NULL AUTO_INCREMENT,
    `request_id` INTEGER NOT NULL,
    `old_status` VARCHAR(20) NULL,
    `new_status` VARCHAR(20) NULL,
    `changed_by` INTEGER NULL,
    `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`history_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipments` ADD CONSTRAINT `equipments_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `equipment_categories`(`category_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prop_equip` ADD CONSTRAINT `prop_equip_equipment_id_fkey` FOREIGN KEY (`equipment_id`) REFERENCES `equipments`(`equipment_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prop_equip` ADD CONSTRAINT `prop_equip_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `equipment_property`(`property_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `haz_con` ADD CONSTRAINT `haz_con_consumable_id_fkey` FOREIGN KEY (`consumable_id`) REFERENCES `consumables`(`consumable_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `haz_con` ADD CONSTRAINT `haz_con_hazard_id_fkey` FOREIGN KEY (`hazard_id`) REFERENCES `hazards`(`hazard_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prop_con` ADD CONSTRAINT `prop_con_consumable_id_fkey` FOREIGN KEY (`consumable_id`) REFERENCES `consumables`(`consumable_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prop_con` ADD CONSTRAINT `prop_con_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `consumable_property`(`property_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requests` ADD CONSTRAINT `requests_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requests` ADD CONSTRAINT `requests_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requests` ADD CONSTRAINT `requests_equipment_id_fkey` FOREIGN KEY (`equipment_id`) REFERENCES `equipments`(`equipment_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_status_history` ADD CONSTRAINT `request_status_history_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests`(`request_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_status_history` ADD CONSTRAINT `request_status_history_changed_by_fkey` FOREIGN KEY (`changed_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
