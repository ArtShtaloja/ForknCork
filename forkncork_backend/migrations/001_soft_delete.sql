-- Migration: Add soft delete (deleted_at) to products, categories, orders, contact_messages
-- Run this against your Aiven database to enable soft delete

ALTER TABLE `products` ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE `products` ADD INDEX `idx_products_deleted_at` (`deleted_at`);

ALTER TABLE `categories` ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE `categories` ADD INDEX `idx_categories_deleted_at` (`deleted_at`);

ALTER TABLE `orders` ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE `orders` ADD INDEX `idx_orders_deleted_at` (`deleted_at`);

ALTER TABLE `contact_messages` ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE `contact_messages` ADD INDEX `idx_contact_messages_deleted_at` (`deleted_at`);
