CREATE TABLE `admin_centre_actions` (
	`id` char(36) NOT NULL,
	`centre_id` char(36) NOT NULL,
	`centre_label` varchar(255) NOT NULL,
	`action` varchar(32) NOT NULL,
	`actor_user_id` varchar(191) NOT NULL,
	`affected_submissions` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `admin_centre_actions_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_centre_actions_action_check` CHECK(`admin_centre_actions`.`action` in ('suspended', 'reactivated', 'responses_reset', 'space_reset', 'deleted')),
	CONSTRAINT `admin_centre_actions_centre_label_not_blank_check` CHECK(trim(`admin_centre_actions`.`centre_label`) <> ''),
	CONSTRAINT `admin_centre_actions_actor_user_id_not_blank_check` CHECK(trim(`admin_centre_actions`.`actor_user_id`) <> ''),
	CONSTRAINT `admin_centre_actions_affected_submissions_check` CHECK(`admin_centre_actions`.`affected_submissions` >= 0)
);
--> statement-breakpoint
ALTER TABLE `centres` ADD `is_suspended` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `centres` ADD `suspended_at` datetime(3);--> statement-breakpoint
ALTER TABLE `centres` ADD `suspended_by` varchar(191);--> statement-breakpoint
CREATE INDEX `admin_centre_actions_centre_id_idx` ON `admin_centre_actions` (`centre_id`);--> statement-breakpoint
CREATE INDEX `admin_centre_actions_actor_user_id_idx` ON `admin_centre_actions` (`actor_user_id`);--> statement-breakpoint
ALTER TABLE `centres` ADD CONSTRAINT `centres_suspension_check` CHECK ((`centres`.`is_suspended` = false and `centres`.`suspended_at` is null and `centres`.`suspended_by` is null) or (`centres`.`is_suspended` = true and `centres`.`suspended_at` is not null and trim(`centres`.`suspended_by`) <> ''));