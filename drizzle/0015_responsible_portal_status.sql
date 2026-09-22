ALTER TABLE `app_settings` ADD CONSTRAINT `app_settings_responsible_portal_status_check` CHECK (`app_settings`.`setting_key` <> 'responsible_portal_status' or `app_settings`.`setting_value` in ('closed', 'open'));
--> statement-breakpoint
INSERT INTO `app_settings` (`setting_key`, `setting_value`)
VALUES ('responsible_portal_status', 'closed')
ON DUPLICATE KEY UPDATE `setting_value` = `setting_value`;
