-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `role` ENUM('member', 'ta', 'lecturer', 'lab_manager') NOT NULL DEFAULT 'member',
    `email` VARCHAR(255) NOT NULL,
    `google_id` VARCHAR(255) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `banner_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login_at` DATETIME(3) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_google_id_key`(`google_id`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

    INDEX `projects_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`project_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_sessions` (
    `lab_session_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(250) NULL,
    `project_id` INTEGER NULL,
    `room_id` INTEGER NOT NULL,
    `status` ENUM('pending_approval', 'approved', 'rejected', 'scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending_approval',
    `archived` BOOLEAN NOT NULL DEFAULT false,
    `requested_by` INTEGER NOT NULL,
    `approved_by` INTEGER NULL,
    `requested_start` DATETIME(3) NOT NULL,
    `requested_end` DATETIME(3) NOT NULL,
    `actual_start` DATETIME(3) NULL,
    `actual_end` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lab_sessions_project_id_idx`(`project_id`),
    INDEX `lab_sessions_requested_by_idx`(`requested_by`),
    INDEX `lab_sessions_approved_by_idx`(`approved_by`),
    INDEX `lab_sessions_room_id_requested_start_requested_end_idx`(`room_id`, `requested_start`, `requested_end`),
    PRIMARY KEY (`lab_session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_participants` (
    `lab_session_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `session_role` VARCHAR(20) NOT NULL,
    `attended` BOOLEAN NULL DEFAULT false,

    INDEX `session_participants_user_id_idx`(`user_id`),
    PRIMARY KEY (`lab_session_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_session_equipment` (
    `lab_session_id` INTEGER NOT NULL,
    `equipment_id` INTEGER NOT NULL,
    `quantity_reserved` INTEGER NOT NULL,
    `quantity_returned` INTEGER NULL,
    `condition_notes` VARCHAR(250) NULL,

    INDEX `lab_session_equipment_equipment_id_idx`(`equipment_id`),
    PRIMARY KEY (`lab_session_id`, `equipment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_session_consumables` (
    `lab_session_id` INTEGER NOT NULL,
    `consumable_id` INTEGER NOT NULL,
    `quantity_planned` DECIMAL(10, 2) NOT NULL,
    `quantity_used` DECIMAL(10, 2) NULL,

    INDEX `lab_session_consumables_consumable_id_idx`(`consumable_id`),
    PRIMARY KEY (`lab_session_id`, `consumable_id`)
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

    INDEX `equipments_category_id_idx`(`category_id`),
    PRIMARY KEY (`equipment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prop_equip` (
    `equipment_id` INTEGER NOT NULL,
    `property_id` INTEGER NOT NULL,

    INDEX `prop_equip_property_id_idx`(`property_id`),
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

    INDEX `haz_con_hazard_id_idx`(`hazard_id`),
    PRIMARY KEY (`consumable_id`, `hazard_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prop_con` (
    `consumable_id` INTEGER NOT NULL,
    `property_id` INTEGER NOT NULL,

    INDEX `prop_con_property_id_idx`(`property_id`),
    PRIMARY KEY (`consumable_id`, `property_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requests` (
    `request_id` INTEGER NOT NULL AUTO_INCREMENT,
    `requester_id` INTEGER NOT NULL,
    `assigned_to` INTEGER NULL,
    `type` ENUM('maintenance', 'access_permission', 'consumable_order', 'equipment_reservation', 'ticket') NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` VARCHAR(250) NULL,
    `status` ENUM('open', 'in_review', 'approved', 'in_progress', 'blocked', 'completed', 'rejected', 'closed') NOT NULL DEFAULT 'open',
    `priority` VARCHAR(10) NULL DEFAULT 'medium',
    `equipment_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closed_at` DATETIME(3) NULL,

    INDEX `requests_requester_id_idx`(`requester_id`),
    INDEX `requests_assigned_to_idx`(`assigned_to`),
    INDEX `requests_equipment_id_idx`(`equipment_id`),
    INDEX `requests_type_status_idx`(`type`, `status`),
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

    INDEX `request_status_history_request_id_idx`(`request_id`),
    INDEX `request_status_history_changed_by_idx`(`changed_by`),
    PRIMARY KEY (`history_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consumable_order_items` (
    `order_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `request_id` INTEGER NOT NULL,
    `consumable_id` INTEGER NOT NULL,
    `quantity_requested` DECIMAL(10, 2) NOT NULL,
    `quantity_approved` DECIMAL(10, 2) NULL,

    INDEX `consumable_order_items_request_id_idx`(`request_id`),
    INDEX `consumable_order_items_consumable_id_idx`(`consumable_id`),
    PRIMARY KEY (`order_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `access_permission_details` (
    `request_id` INTEGER NOT NULL,
    `resource_type` ENUM('room', 'equipment', 'software') NOT NULL,
    `resource_id` INTEGER NULL,
    `expires_at` DATETIME(3) NULL,

    PRIMARY KEY (`request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_reservation_details` (
    `request_id` INTEGER NOT NULL,
    `equipment_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `checked_out_at` DATETIME(3) NULL,
    `due_at` DATETIME(3) NULL,
    `returned_at` DATETIME(3) NULL,

    INDEX `equipment_reservation_details_equipment_id_idx`(`equipment_id`),
    PRIMARY KEY (`request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `notification_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `request_id` INTEGER NULL,
    `lab_session_id` INTEGER NULL,
    `message` VARCHAR(255) NOT NULL,
    `notif_type` VARCHAR(30) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_is_read_idx`(`user_id`, `is_read`),
    INDEX `notifications_request_id_idx`(`request_id`),
    INDEX `notifications_lab_session_id_idx`(`lab_session_id`),
    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_sessions` ADD CONSTRAINT `lab_sessions_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_sessions` ADD CONSTRAINT `lab_sessions_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `lab_rooms`(`room_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_sessions` ADD CONSTRAINT `lab_sessions_requested_by_fkey` FOREIGN KEY (`requested_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_sessions` ADD CONSTRAINT `lab_sessions_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_participants` ADD CONSTRAINT `session_participants_lab_session_id_fkey` FOREIGN KEY (`lab_session_id`) REFERENCES `lab_sessions`(`lab_session_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_participants` ADD CONSTRAINT `session_participants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_session_equipment` ADD CONSTRAINT `lab_session_equipment_lab_session_id_fkey` FOREIGN KEY (`lab_session_id`) REFERENCES `lab_sessions`(`lab_session_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_session_equipment` ADD CONSTRAINT `lab_session_equipment_equipment_id_fkey` FOREIGN KEY (`equipment_id`) REFERENCES `equipments`(`equipment_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_session_consumables` ADD CONSTRAINT `lab_session_consumables_lab_session_id_fkey` FOREIGN KEY (`lab_session_id`) REFERENCES `lab_sessions`(`lab_session_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_session_consumables` ADD CONSTRAINT `lab_session_consumables_consumable_id_fkey` FOREIGN KEY (`consumable_id`) REFERENCES `consumables`(`consumable_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE `consumable_order_items` ADD CONSTRAINT `consumable_order_items_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests`(`request_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consumable_order_items` ADD CONSTRAINT `consumable_order_items_consumable_id_fkey` FOREIGN KEY (`consumable_id`) REFERENCES `consumables`(`consumable_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `access_permission_details` ADD CONSTRAINT `access_permission_details_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests`(`request_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_reservation_details` ADD CONSTRAINT `equipment_reservation_details_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests`(`request_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_reservation_details` ADD CONSTRAINT `equipment_reservation_details_equipment_id_fkey` FOREIGN KEY (`equipment_id`) REFERENCES `equipments`(`equipment_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests`(`request_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_lab_session_id_fkey` FOREIGN KEY (`lab_session_id`) REFERENCES `lab_sessions`(`lab_session_id`) ON DELETE SET NULL ON UPDATE CASCADE;
