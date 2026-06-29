CREATE TABLE `admin_users` (
	`user_id` varchar(191) NOT NULL,
	`role` varchar(20) NOT NULL DEFAULT 'admin',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`created_by` varchar(191),
	CONSTRAINT `admin_users_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `admin_users_role_check` CHECK(`admin_users`.`role` in ('admin')),
	CONSTRAINT `admin_users_user_id_not_blank_check` CHECK(trim(`admin_users`.`user_id`) <> ''),
	CONSTRAINT `admin_users_created_by_not_blank_check` CHECK(`admin_users`.`created_by` is null or trim(`admin_users`.`created_by`) <> '')
);
--> statement-breakpoint
CREATE TABLE `answers` (
	`submission_id` char(36) NOT NULL,
	`questionnaire_id` char(3) NOT NULL,
	`question_id` char(36) NOT NULL,
	`value` tinyint NOT NULL,
	CONSTRAINT `answers_pkey` PRIMARY KEY(`submission_id`,`question_id`),
	CONSTRAINT `answers_value_check` CHECK(`answers`.`value` in (0, 1, 2, 3))
);
--> statement-breakpoint
CREATE TABLE `diagnostic_spaces` (
	`id` char(36) NOT NULL,
	`public_code` varchar(20) NOT NULL,
	`private_token_hmac` varchar(128) NOT NULL,
	`owner_user_id` varchar(191),
	`results_token_hash` varchar(128) NOT NULL,
	`results_token_encrypted` text,
	`results_token_enabled` boolean NOT NULL DEFAULT true,
	`results_token_created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`results_token_expires_at` datetime(3),
	`questionnaire_id` char(3) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`closed_at` datetime(3),
	CONSTRAINT `diagnostic_spaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `diagnostic_spaces_public_code_key` UNIQUE(`public_code`),
	CONSTRAINT `diagnostic_spaces_id_questionnaire_unique` UNIQUE(`id`,`questionnaire_id`),
	CONSTRAINT `diagnostic_spaces_owner_user_id_unique_idx` UNIQUE(`owner_user_id`),
	CONSTRAINT `diagnostic_spaces_public_code_format_check` CHECK(`diagnostic_spaces`.`public_code` regexp '^C-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$'),
	CONSTRAINT `diagnostic_spaces_private_token_hmac_length_check` CHECK(char_length(`diagnostic_spaces`.`private_token_hmac`) >= 43),
	CONSTRAINT `diagnostic_spaces_results_token_hash_length_check` CHECK(char_length(`diagnostic_spaces`.`results_token_hash`) >= 43),
	CONSTRAINT `diagnostic_spaces_results_token_encrypted_not_blank_check` CHECK(`diagnostic_spaces`.`results_token_encrypted` is null or trim(`diagnostic_spaces`.`results_token_encrypted`) <> ''),
	CONSTRAINT `diagnostic_spaces_results_token_expires_at_check` CHECK(`diagnostic_spaces`.`results_token_expires_at` is null or `diagnostic_spaces`.`results_token_expires_at` >= `diagnostic_spaces`.`results_token_created_at`),
	CONSTRAINT `diagnostic_spaces_closed_at_check` CHECK(`diagnostic_spaces`.`closed_at` is null or `diagnostic_spaces`.`closed_at` >= `diagnostic_spaces`.`created_at`)
);
--> statement-breakpoint
CREATE TABLE `question_blocks` (
	`id` char(2) NOT NULL,
	`questionnaire_id` char(3) NOT NULL,
	`position` int NOT NULL,
	`title` varchar(255) NOT NULL,
	CONSTRAINT `question_blocks_pkey` PRIMARY KEY(`id`,`questionnaire_id`),
	CONSTRAINT `question_blocks_questionnaire_position_key` UNIQUE(`questionnaire_id`,`position`),
	CONSTRAINT `question_blocks_id_format_check` CHECK(`question_blocks`.`id` regexp '^[0-9]{2}$'),
	CONSTRAINT `question_blocks_position_check` CHECK(`question_blocks`.`position` between 1 and 10),
	CONSTRAINT `question_blocks_title_not_blank_check` CHECK(trim(`question_blocks`.`title`) <> '')
);
--> statement-breakpoint
CREATE TABLE `questionnaires` (
	`id` char(3) NOT NULL,
	`version` varchar(20) NOT NULL,
	`title` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `questionnaires_id` PRIMARY KEY(`id`),
	CONSTRAINT `questionnaires_version_key` UNIQUE(`version`),
	CONSTRAINT `questionnaires_title_unique_idx` UNIQUE((lower(trim(`title`)))),
	CONSTRAINT `questionnaires_id_format_check` CHECK(`questionnaires`.`id` regexp '^[0-9]{3}$'),
	CONSTRAINT `questionnaires_version_format_check` CHECK(`questionnaires`.`version` regexp '^[0-9]{4}\.[0-9]+$'),
	CONSTRAINT `questionnaires_title_not_blank_check` CHECK(trim(`questionnaires`.`title`) <> '')
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` char(36) NOT NULL,
	`questionnaire_id` char(3) NOT NULL,
	`block_id` char(2) NOT NULL,
	`position` int NOT NULL,
	`block_position` int NOT NULL,
	`text` text NOT NULL,
	`scale_min` tinyint NOT NULL DEFAULT 0,
	`scale_max` tinyint NOT NULL DEFAULT 3,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `questions_id_questionnaire_unique` UNIQUE(`id`,`questionnaire_id`),
	CONSTRAINT `questions_questionnaire_position_key` UNIQUE(`questionnaire_id`,`position`),
	CONSTRAINT `questions_block_position_key` UNIQUE(`questionnaire_id`,`block_id`,`block_position`),
	CONSTRAINT `questions_position_check` CHECK(`questions`.`position` between 1 and 100),
	CONSTRAINT `questions_block_position_check` CHECK(`questions`.`block_position` between 1 and 10),
	CONSTRAINT `questions_text_not_blank_check` CHECK(trim(`questions`.`text`) <> ''),
	CONSTRAINT `questions_scale_min_check` CHECK(`questions`.`scale_min` = 0),
	CONSTRAINT `questions_scale_max_check` CHECK(`questions`.`scale_max` = 3)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` char(36) NOT NULL,
	`diagnostic_space_id` char(36) NOT NULL,
	`questionnaire_id` char(3) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `submissions_id_questionnaire_unique` UNIQUE(`id`,`questionnaire_id`)
);
--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_submission_questionnaire_fk` FOREIGN KEY (`submission_id`,`questionnaire_id`) REFERENCES `submissions`(`id`,`questionnaire_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_question_questionnaire_fk` FOREIGN KEY (`question_id`,`questionnaire_id`) REFERENCES `questions`(`id`,`questionnaire_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `diagnostic_spaces` ADD CONSTRAINT `diagnostic_spaces_questionnaire_id_fkey` FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_blocks` ADD CONSTRAINT `question_blocks_questionnaire_id_fkey` FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_questionnaire_id_fkey` FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_block_questionnaire_fk` FOREIGN KEY (`block_id`,`questionnaire_id`) REFERENCES `question_blocks`(`id`,`questionnaire_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_space_questionnaire_fk` FOREIGN KEY (`diagnostic_space_id`,`questionnaire_id`) REFERENCES `diagnostic_spaces`(`id`,`questionnaire_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_users_created_by_idx` ON `admin_users` (`created_by`);--> statement-breakpoint
CREATE INDEX `answers_submission_id_idx` ON `answers` (`submission_id`);--> statement-breakpoint
CREATE INDEX `answers_question_id_idx` ON `answers` (`question_id`);--> statement-breakpoint
CREATE INDEX `answers_questionnaire_id_idx` ON `answers` (`questionnaire_id`);--> statement-breakpoint
CREATE INDEX `diagnostic_spaces_questionnaire_id_idx` ON `diagnostic_spaces` (`questionnaire_id`);--> statement-breakpoint
CREATE INDEX `diagnostic_spaces_owner_public_code_idx` ON `diagnostic_spaces` (`owner_user_id`,`public_code`);--> statement-breakpoint
CREATE INDEX `question_blocks_questionnaire_id_idx` ON `question_blocks` (`questionnaire_id`);--> statement-breakpoint
CREATE INDEX `questions_questionnaire_id_idx` ON `questions` (`questionnaire_id`);--> statement-breakpoint
CREATE INDEX `questions_block_id_idx` ON `questions` (`block_id`);--> statement-breakpoint
CREATE INDEX `submissions_diagnostic_space_id_idx` ON `submissions` (`diagnostic_space_id`);--> statement-breakpoint
CREATE INDEX `submissions_questionnaire_id_idx` ON `submissions` (`questionnaire_id`);
