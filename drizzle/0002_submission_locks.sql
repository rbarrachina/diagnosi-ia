CREATE TABLE `submission_locks` (
	`diagnostic_space_id` char(36) NOT NULL,
	`public_code` varchar(20) NOT NULL,
	`lock_hmac` varchar(128) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `submission_locks_pkey` PRIMARY KEY(`diagnostic_space_id`,`lock_hmac`),
	CONSTRAINT `submission_locks_public_code_format_check` CHECK(`submission_locks`.`public_code` regexp '^C-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$'),
	CONSTRAINT `submission_locks_lock_hmac_length_check` CHECK(char_length(`submission_locks`.`lock_hmac`) >= 43)
);
--> statement-breakpoint
ALTER TABLE `submission_locks` ADD CONSTRAINT `submission_locks_diagnostic_space_id_fkey` FOREIGN KEY (`diagnostic_space_id`) REFERENCES `diagnostic_spaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `submission_locks_diagnostic_space_id_idx` ON `submission_locks` (`diagnostic_space_id`);
