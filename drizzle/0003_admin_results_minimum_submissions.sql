ALTER TABLE `app_settings` ADD CONSTRAINT `app_settings_admin_results_minimum_submissions_check` CHECK (`app_settings`.`setting_key` <> 'admin_results_minimum_submissions' or (`app_settings`.`setting_value` regexp '^[0-9]+$' and cast(`app_settings`.`setting_value` as unsigned) between 0 and 10));
--> statement-breakpoint
INSERT INTO `app_settings` (`setting_key`, `setting_value`) VALUES ('admin_results_minimum_submissions', '0') ON DUPLICATE KEY UPDATE `setting_value` = `setting_value`;
