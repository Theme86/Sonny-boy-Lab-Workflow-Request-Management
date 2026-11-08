-- AlterTable
ALTER TABLE `hazards` ADD COLUMN `code` VARCHAR(10) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `hazards_code_key` ON `hazards`(`code`);
