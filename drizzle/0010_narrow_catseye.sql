DELETE FROM `answers`;--> statement-breakpoint
DELETE FROM `submission_locks`;--> statement-breakpoint
DELETE FROM `submissions`;--> statement-breakpoint
DELETE FROM `diagnostic_spaces`;--> statement-breakpoint
DELETE FROM `centre_accounts`;--> statement-breakpoint
DELETE FROM `centres`;--> statement-breakpoint
ALTER TABLE `centres` ADD `profile_confirmed_at` datetime(3);--> statement-breakpoint
ALTER TABLE `centres` ADD `allow_xtec` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `centres` ADD `custom_domain` varchar(253);--> statement-breakpoint
ALTER TABLE `centres` ADD `email_policy_configured_at` datetime(3);--> statement-breakpoint
ALTER TABLE `centres` ADD CONSTRAINT `centres_custom_domain_format_check` CHECK (`centres`.`custom_domain` is null or `centres`.`custom_domain` regexp '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$');--> statement-breakpoint
ALTER TABLE `centres` ADD CONSTRAINT `centres_email_policy_check` CHECK (`centres`.`email_policy_configured_at` is null or `centres`.`allow_xtec` = true or `centres`.`custom_domain` is not null);
