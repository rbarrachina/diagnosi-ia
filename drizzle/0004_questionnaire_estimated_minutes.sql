ALTER TABLE `questionnaires` ADD COLUMN `estimated_minutes` int NOT NULL DEFAULT 10;--> statement-breakpoint
ALTER TABLE `questionnaires` ADD CONSTRAINT `questionnaires_estimated_minutes_check` CHECK (`questionnaires`.`estimated_minutes` between 1 and 120);
