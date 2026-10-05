ALTER TABLE `questionnaires` DROP CONSTRAINT `questionnaires_version_format_check`;--> statement-breakpoint
ALTER TABLE `questionnaires` ADD CONSTRAINT `questionnaires_version_format_check` CHECK (`questionnaires`.`version` regexp '^[0-9]{4}[[:alnum:] ._-]*$');
