-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `consumable_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `notifications_consumable_id_idx` ON `notifications`(`consumable_id`);

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_consumable_id_fkey` FOREIGN KEY (`consumable_id`) REFERENCES `consumables`(`consumable_id`) ON DELETE CASCADE ON UPDATE CASCADE;
