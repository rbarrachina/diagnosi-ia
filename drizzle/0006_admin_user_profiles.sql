ALTER TABLE `admin_users` ADD COLUMN `email` varchar(254);--> statement-breakpoint
ALTER TABLE `admin_users` ADD COLUMN `display_name` varchar(255);--> statement-breakpoint
ALTER TABLE `admin_users` ADD COLUMN `last_login_at` datetime(3);--> statement-breakpoint
UPDATE `admin_users` au
INNER JOIN `admin_email_invitations` ai ON ai.`accepted_by` = au.`user_id`
SET au.`email` = COALESCE(au.`email`, ai.`email`),
    au.`display_name` = COALESCE(au.`display_name`, ai.`email`),
    au.`last_login_at` = COALESCE(au.`last_login_at`, ai.`accepted_at`)
WHERE au.`email` IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique_idx` ON `admin_users` (`email`);--> statement-breakpoint
ALTER TABLE `admin_users` ADD CONSTRAINT `admin_users_email_format_check` CHECK(`admin_users`.`email` is null or `admin_users`.`email` regexp '^[^@[:space:]]+@xtec\.cat$');--> statement-breakpoint
ALTER TABLE `admin_users` ADD CONSTRAINT `admin_users_display_name_not_blank_check` CHECK(`admin_users`.`display_name` is null or trim(`admin_users`.`display_name`) <> '');
