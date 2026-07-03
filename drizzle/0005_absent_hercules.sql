CREATE TABLE `admin_email_invitations` (
	`email` varchar(254) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`invited_by` varchar(191) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`accepted_at` datetime(3),
	`accepted_by` varchar(191),
	CONSTRAINT `admin_email_invitations_email` PRIMARY KEY(`email`),
	CONSTRAINT `admin_email_invitations_email_format_check` CHECK(`admin_email_invitations`.`email` regexp '^[^@[:space:]]+@xtec\.cat$'),
	CONSTRAINT `admin_email_invitations_invited_by_not_blank_check` CHECK(trim(`admin_email_invitations`.`invited_by`) <> ''),
	CONSTRAINT `admin_email_invitations_accepted_by_not_blank_check` CHECK(`admin_email_invitations`.`accepted_by` is null or trim(`admin_email_invitations`.`accepted_by`) <> ''),
	CONSTRAINT `admin_email_invitations_acceptance_check` CHECK((`admin_email_invitations`.`accepted_at` is null and `admin_email_invitations`.`accepted_by` is null) or (`admin_email_invitations`.`accepted_at` is not null and `admin_email_invitations`.`accepted_by` is not null))
);
--> statement-breakpoint
CREATE INDEX `admin_email_invitations_invited_by_idx` ON `admin_email_invitations` (`invited_by`);--> statement-breakpoint
CREATE INDEX `admin_email_invitations_accepted_by_idx` ON `admin_email_invitations` (`accepted_by`);
