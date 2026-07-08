ALTER TABLE `app_settings` MODIFY COLUMN `setting_value` text NOT NULL;--> statement-breakpoint
INSERT INTO `app_settings` (`setting_key`, `setting_value`) VALUES
  ('communication_subject', 'Qüestionari de diagnosi sobre competència digital docent en IA'),
  ('communication_body', 'Benvolgudes i benvolguts,\n\nUs convidem a respondre el qüestionari de diagnosi sobre l''ús educatiu de la intel·ligència artificial.\n\nPodeu accedir-hi des d''aquest enllaç:\n{URL_QUESTIONARI}\n\nLes respostes són anònimes i els resultats es tractaran sempre de manera agregada.\n\nGràcies per la vostra participació.')
ON DUPLICATE KEY UPDATE `setting_value` = `setting_value`;
