ALTER TABLE `app_settings` ADD CONSTRAINT `app_settings_google_login_mode_check` CHECK (`app_settings`.`setting_key` <> 'google_login_mode' or `app_settings`.`setting_value` in ('internal', 'external'));
--> statement-breakpoint
INSERT INTO `app_settings` (`setting_key`, `setting_value`) VALUES ('google_login_mode', 'internal') ON DUPLICATE KEY UPDATE `setting_value` = `setting_value`;
