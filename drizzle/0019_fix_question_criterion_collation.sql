ALTER TABLE `questions` DROP FOREIGN KEY `questions_criterion_fk`;
--> statement-breakpoint
ALTER TABLE `questions`
  MODIFY `criterion_id` char(2)
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
--> statement-breakpoint
ALTER TABLE `questions`
  ADD CONSTRAINT `questions_criterion_fk`
  FOREIGN KEY (`criterion_id`, `block_id`, `questionnaire_id`)
  REFERENCES `question_criteria` (`id`, `dimension_id`, `questionnaire_id`)
  ON DELETE RESTRICT ON UPDATE NO ACTION;
