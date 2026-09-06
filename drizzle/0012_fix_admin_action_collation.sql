ALTER TABLE `admin_centre_actions`
MODIFY COLUMN `actor_user_id` varchar(191)
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci
NOT NULL;
