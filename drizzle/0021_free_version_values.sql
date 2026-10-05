ALTER TABLE `questionnaires` DROP CONSTRAINT `questionnaires_version_format_check`;--> statement-breakpoint
ALTER TABLE `questionnaires` ADD CONSTRAINT `questionnaires_version_not_blank_check` CHECK (trim(`questionnaires`.`version`) <> '');
