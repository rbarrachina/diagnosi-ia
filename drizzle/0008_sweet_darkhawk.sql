DELETE FROM `answers`;--> statement-breakpoint
DELETE FROM `submission_locks`;--> statement-breakpoint
DELETE FROM `submissions`;--> statement-breakpoint
DELETE FROM `diagnostic_spaces`;--> statement-breakpoint
CREATE TABLE `centre_accounts` (
	`user_id` varchar(191) NOT NULL,
	`centre_id` char(36) NOT NULL,
	`email` varchar(254) NOT NULL,
	`display_name` varchar(255),
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`last_login_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `centre_accounts_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `centre_accounts_email_unique_idx` UNIQUE(`email`),
	CONSTRAINT `centre_accounts_centre_id_unique_idx` UNIQUE(`centre_id`),
	CONSTRAINT `centre_accounts_email_format_check` CHECK(`centre_accounts`.`email` regexp '^[abcde][0-9]{7}@xtec\.cat$'),
	CONSTRAINT `centre_accounts_display_name_not_blank_check` CHECK(`centre_accounts`.`display_name` is null or trim(`centre_accounts`.`display_name`) <> '')
);
--> statement-breakpoint
CREATE TABLE `centres` (
	`id` char(36) NOT NULL,
	`email` varchar(254) NOT NULL,
	`official_code` char(8),
	`official_name` varchar(255),
	`municipality` varchar(255),
	`territorial_area` varchar(255),
	`educational_service` varchar(255),
	`source_status` varchar(24) NOT NULL DEFAULT 'pending',
	`last_attempt_at` datetime(3),
	`last_success_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `centres_id` PRIMARY KEY(`id`),
	CONSTRAINT `centres_email_unique_idx` UNIQUE(`email`),
	CONSTRAINT `centres_official_code_unique_idx` UNIQUE(`official_code`),
	CONSTRAINT `centres_email_format_check` CHECK(`centres`.`email` regexp '^[abcde][0-9]{7}@xtec\.cat$'),
	CONSTRAINT `centres_official_code_format_check` CHECK(`centres`.`official_code` is null or `centres`.`official_code` regexp '^[0-9]{8}$'),
	CONSTRAINT `centres_source_status_check` CHECK(`centres`.`source_status` in ('pending', 'ok', 'not_found', 'unavailable'))
);
--> statement-breakpoint
ALTER TABLE `diagnostic_spaces` ADD `centre_id` char(36);--> statement-breakpoint
ALTER TABLE `diagnostic_spaces` ADD CONSTRAINT `diagnostic_spaces_centre_id_unique_idx` UNIQUE(`centre_id`);--> statement-breakpoint
ALTER TABLE `centre_accounts` ADD CONSTRAINT `centre_accounts_centre_id_fkey` FOREIGN KEY (`centre_id`) REFERENCES `centres`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diagnostic_spaces` ADD CONSTRAINT `diagnostic_spaces_centre_id_fkey` FOREIGN KEY (`centre_id`) REFERENCES `centres`(`id`) ON DELETE restrict ON UPDATE no action;
