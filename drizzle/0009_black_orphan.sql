ALTER TABLE `centre_accounts` DROP CONSTRAINT `centre_accounts_email_format_check`;--> statement-breakpoint
ALTER TABLE `centres` DROP CONSTRAINT `centres_email_format_check`;--> statement-breakpoint
ALTER TABLE `centre_accounts` ADD CONSTRAINT `centre_accounts_email_format_check` CHECK (`centre_accounts`.`email` regexp '^[^@[:space:]]+@xtec\.cat$');--> statement-breakpoint
ALTER TABLE `centres` ADD CONSTRAINT `centres_email_format_check` CHECK (`centres`.`email` regexp '^[^@[:space:]]+@xtec\.cat$');