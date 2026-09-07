ALTER TABLE `centres` DROP CONSTRAINT `centres_email_policy_check`;--> statement-breakpoint
UPDATE `centres` SET `allow_xtec` = false WHERE `custom_domain` is not null;--> statement-breakpoint
ALTER TABLE `centres` ADD CONSTRAINT `centres_email_policy_check` CHECK (`centres`.`email_policy_configured_at` is null or (`centres`.`allow_xtec` = true and `centres`.`custom_domain` is null) or (`centres`.`allow_xtec` = false and `centres`.`custom_domain` is not null));
