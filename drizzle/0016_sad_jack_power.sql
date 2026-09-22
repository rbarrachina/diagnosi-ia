ALTER TABLE `questionnaires` ADD `language_code` varchar(2) DEFAULT 'ca' NOT NULL;
--> statement-breakpoint
ALTER TABLE `questionnaires` ADD CONSTRAINT `questionnaires_language_code_check` CHECK (`questionnaires`.`language_code` in ('ca', 'es', 'eu', 'gl', 'oc'));
--> statement-breakpoint
ALTER TABLE `questions` ADD `randomize_options` boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE `question_options` (
	`id` char(36) NOT NULL,
	`questionnaire_id` char(3) NOT NULL,
	`question_id` char(36) NOT NULL,
	`score` tinyint NOT NULL,
	`text` varchar(300) NOT NULL,
	CONSTRAINT `question_options_id` PRIMARY KEY(`id`),
	CONSTRAINT `question_options_id_question_unique` UNIQUE(`id`,`question_id`,`questionnaire_id`),
	CONSTRAINT `question_options_question_score_key` UNIQUE(`question_id`,`score`),
	CONSTRAINT `question_options_score_check` CHECK (`question_options`.`score` in (0, 1, 2, 3)),
	CONSTRAINT `question_options_text_not_blank_check` CHECK (trim(`question_options`.`text`) <> '')
);
--> statement-breakpoint
ALTER TABLE `question_options` ADD CONSTRAINT `question_options_question_questionnaire_fk` FOREIGN KEY (`question_id`,`questionnaire_id`) REFERENCES `questions`(`id`,`questionnaire_id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `question_options_questionnaire_id_idx` ON `question_options` (`questionnaire_id`);
--> statement-breakpoint
CREATE INDEX `question_options_question_id_idx` ON `question_options` (`question_id`);
--> statement-breakpoint
INSERT INTO `question_options` (`id`, `questionnaire_id`, `question_id`, `score`, `text`)
SELECT UUID(), `questionnaire_id`, `id`, 0, 'Gens / No ho faig' FROM `questions`;
--> statement-breakpoint
INSERT INTO `question_options` (`id`, `questionnaire_id`, `question_id`, `score`, `text`)
SELECT UUID(), `questionnaire_id`, `id`, 1, 'Una mica / Ocasionalment' FROM `questions`;
--> statement-breakpoint
INSERT INTO `question_options` (`id`, `questionnaire_id`, `question_id`, `score`, `text`)
SELECT UUID(), `questionnaire_id`, `id`, 2, 'Bastant / Habitualment' FROM `questions`;
--> statement-breakpoint
INSERT INTO `question_options` (`id`, `questionnaire_id`, `question_id`, `score`, `text`)
SELECT UUID(), `questionnaire_id`, `id`, 3, 'Molt / Soc un referent al centre' FROM `questions`;
--> statement-breakpoint
ALTER TABLE `answers` ADD `option_id` char(36);
--> statement-breakpoint
UPDATE `answers`
INNER JOIN `question_options`
  ON `question_options`.`questionnaire_id` = `answers`.`questionnaire_id`
 AND `question_options`.`question_id` = `answers`.`question_id`
 AND `question_options`.`score` = `answers`.`value`
SET `answers`.`option_id` = `question_options`.`id`;
--> statement-breakpoint
ALTER TABLE `answers` MODIFY COLUMN `option_id` char(36) NOT NULL;
--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_option_question_questionnaire_fk` FOREIGN KEY (`option_id`,`question_id`,`questionnaire_id`) REFERENCES `question_options`(`id`,`question_id`,`questionnaire_id`) ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `answers_option_id_idx` ON `answers` (`option_id`);
