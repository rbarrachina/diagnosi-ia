CREATE TABLE `question_criteria` (
	`id` char(2) NOT NULL,
	`questionnaire_id` char(3) NOT NULL,
	`dimension_id` char(2) NOT NULL,
	`position` int NOT NULL,
	`title` varchar(255) NOT NULL,
	CONSTRAINT `question_criteria_pkey` PRIMARY KEY(`id`,`dimension_id`,`questionnaire_id`),
	CONSTRAINT `question_criteria_dimension_position_key` UNIQUE(`questionnaire_id`,`dimension_id`,`position`),
	CONSTRAINT `question_criteria_id_format_check` CHECK(`question_criteria`.`id` regexp '^[0-9]{2}$'),
	CONSTRAINT `question_criteria_position_check` CHECK(`question_criteria`.`position` between 1 and 10),
	CONSTRAINT `question_criteria_title_not_blank_check` CHECK(trim(`question_criteria`.`title`) <> '')
);
--> statement-breakpoint
ALTER TABLE `questions` ADD `criterion_id` char(2);--> statement-breakpoint
ALTER TABLE `questions` ADD `criterion_position` int;--> statement-breakpoint
INSERT INTO `question_criteria` (`id`, `questionnaire_id`, `dimension_id`, `position`, `title`)
SELECT '01', `questionnaire_id`, `id`, 1, 'Criteri general'
FROM `question_blocks`;--> statement-breakpoint
UPDATE `questions`
SET `criterion_id` = '01', `criterion_position` = `block_position`;--> statement-breakpoint
ALTER TABLE `questions` MODIFY `criterion_id` char(2) NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` MODIFY `criterion_position` int NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_criterion_position_key` UNIQUE(`questionnaire_id`,`block_id`,`criterion_id`,`criterion_position`);--> statement-breakpoint
ALTER TABLE `question_criteria` ADD CONSTRAINT `question_criteria_dimension_fk` FOREIGN KEY (`dimension_id`,`questionnaire_id`) REFERENCES `question_blocks`(`id`,`questionnaire_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `question_criteria_questionnaire_id_idx` ON `question_criteria` (`questionnaire_id`);--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_criterion_position_check` CHECK (`questions`.`criterion_position` between 1 and 10);--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_criterion_fk` FOREIGN KEY (`criterion_id`,`block_id`,`questionnaire_id`) REFERENCES `question_criteria`(`id`,`dimension_id`,`questionnaire_id`) ON DELETE restrict ON UPDATE no action;
