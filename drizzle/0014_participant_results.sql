-- Destructive privacy-model migration.
-- Back up the database before deployment. Existing answers, submissions and
-- duplicate-prevention locks are test data and are intentionally not exported.
START TRANSACTION;--> statement-breakpoint
DELETE FROM `answers`;--> statement-breakpoint
DELETE FROM `submissions`;--> statement-breakpoint
DELETE FROM `submission_locks`;--> statement-breakpoint
COMMIT;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_id_space_unique` UNIQUE(`id`,`diagnostic_space_id`);--> statement-breakpoint
DROP TABLE `submission_locks`;--> statement-breakpoint
CREATE TABLE `participant_submissions` (
	`submission_id` char(36) NOT NULL,
	`diagnostic_space_id` char(36) NOT NULL,
	`participant_user_id` varchar(191) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `participant_submissions_pkey` PRIMARY KEY(`submission_id`),
	CONSTRAINT `participant_submissions_space_user_unique` UNIQUE(`diagnostic_space_id`,`participant_user_id`),
	CONSTRAINT `participant_submissions_user_id_not_blank_check` CHECK(trim(`participant_user_id`) <> '')
);--> statement-breakpoint
CREATE INDEX `participant_submissions_user_idx` ON `participant_submissions` (`participant_user_id`);--> statement-breakpoint
CREATE INDEX `participant_submissions_space_idx` ON `participant_submissions` (`diagnostic_space_id`);--> statement-breakpoint
ALTER TABLE `participant_submissions` ADD CONSTRAINT `participant_submissions_submission_space_fk` FOREIGN KEY (`submission_id`,`diagnostic_space_id`) REFERENCES `submissions`(`id`,`diagnostic_space_id`) ON DELETE CASCADE ON UPDATE NO ACTION;
