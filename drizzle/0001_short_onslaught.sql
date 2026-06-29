CREATE TABLE `app_settings` (
	`setting_key` varchar(64) NOT NULL,
	`setting_value` varchar(64) NOT NULL,
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `app_settings_setting_key` PRIMARY KEY(`setting_key`),
	CONSTRAINT `app_settings_setting_key_not_blank_check` CHECK(trim(`app_settings`.`setting_key`) <> ''),
	CONSTRAINT `app_settings_setting_value_not_blank_check` CHECK(trim(`app_settings`.`setting_value`) <> ''),
	CONSTRAINT `app_settings_responsible_access_mode_check` CHECK(`app_settings`.`setting_key` <> 'responsible_access_mode' or `app_settings`.`setting_value` in ('all_xtec', 'centre_xtec'))
);
--> statement-breakpoint
INSERT INTO `app_settings` (`setting_key`, `setting_value`) VALUES ('responsible_access_mode', 'all_xtec');
--> statement-breakpoint
ALTER TABLE `questions` DROP CHECK `questions_scale_max_check`;
--> statement-breakpoint
ALTER TABLE `questions` MODIFY `scale_max` tinyint NOT NULL DEFAULT 3;
--> statement-breakpoint
UPDATE `questions` SET `scale_min` = 0, `scale_max` = 3 WHERE `scale_min` <> 0 OR `scale_max` <> 3;
--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_scale_max_check` CHECK (`scale_max` = 3);
--> statement-breakpoint
ALTER TABLE `answers` DROP CHECK `answers_value_check`;
--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_value_check` CHECK (`value` in (0, 1, 2, 3));
--> statement-breakpoint
