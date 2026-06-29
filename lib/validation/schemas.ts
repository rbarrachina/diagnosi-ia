import { z } from "zod";
import { PUBLIC_CODE_PATTERN } from "@/lib/crypto/public-code";

export const QUESTIONNAIRE_VERSION = "2026.2";
export const EXPECTED_ANSWER_COUNT = 20;
export const MAX_QUESTION_BLOCKS = 10;
export const MAX_QUESTIONS_PER_BLOCK = 10;
export const MAX_QUESTIONNAIRE_QUESTIONS = MAX_QUESTION_BLOCKS * MAX_QUESTIONS_PER_BLOCK;
export const MAX_SUBMISSIONS_PER_SPACE = 300;

export const questionnaireVersionSchema = z
  .string()
  .trim()
  .min(2)
  .max(24)
  .regex(
    /^[0-9]{4}[A-Za-zÀ-ÿ0-9 ._-]*$/,
    "La versió del qüestionari no és vàlida",
  );

export const publicCodeSchema = z
  .string()
  .regex(PUBLIC_CODE_PATTERN, "El format del codi públic no és vàlid");

export const privateTokenSchema = z
  .string()
  .min(43)
  .max(256)
  .regex(/^[A-Za-z0-9_-]+$/, "El format del token privat no és vàlid");

export const answerValueSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const submissionAnswerSchema = z
  .object({
    questionId: z.string().uuid(),
    value: answerValueSchema,
  })
  .strict();

export const createSpaceRequestSchema = z.object({}).strict();

export const submissionRequestSchema = z
  .object({
    publicCode: publicCodeSchema,
    questionnaireVersion: questionnaireVersionSchema,
    answers: z.array(submissionAnswerSchema).min(1).max(MAX_QUESTIONNAIRE_QUESTIONS),
  })
  .strict()
  .superRefine((payload, context) => {
    const questionIds = new Set<string>();

    for (const answer of payload.answers) {
      if (questionIds.has(answer.questionId)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate question answer",
          path: ["answers"],
        });
        return;
      }

      questionIds.add(answer.questionId);
    }
  });

export const privateResultsRequestSchema = z
  .object({
    publicCode: publicCodeSchema,
    privateToken: privateTokenSchema,
  })
  .strict();

export const ownerResultsRequestSchema = z
  .object({
    publicCode: publicCodeSchema,
  })
  .strict();

export const questionnaireIdSchema = z
  .string()
  .regex(/^[0-9]{3}$/, "L'identificador de qüestionari no és vàlid");

export const adminResultsRequestSchema = z
  .object({
    questionnaireId: questionnaireIdSchema,
  })
  .strict();

export const questionnaireTitleSchema = z.string().trim().min(1).max(200);
export const questionnaireEstimatedMinutesSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(120);
export const questionnaireBlockTitleSchema = z.string().trim().min(1).max(160);
export const questionnaireQuestionTextSchema = z.string().trim().min(1).max(600);

export const adminQuestionInputSchema = z
  .object({
    blockPosition: z.number().int().min(1).max(MAX_QUESTIONS_PER_BLOCK),
    text: questionnaireQuestionTextSchema,
  })
  .strict();

export const adminQuestionBlockInputSchema = z
  .object({
    position: z.number().int().min(1).max(MAX_QUESTION_BLOCKS),
    title: questionnaireBlockTitleSchema,
    questions: z.array(adminQuestionInputSchema).max(MAX_QUESTIONS_PER_BLOCK),
  })
  .strict()
  .superRefine((block, context) => {
    const questionPositions = new Set<number>();

    for (const question of block.questions) {
      if (questionPositions.has(question.blockPosition)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate question position inside block",
          path: ["questions"],
        });
        return;
      }

      questionPositions.add(question.blockPosition);
    }
  });

export const adminQuestionnaireBlocksSchema = z
  .array(adminQuestionBlockInputSchema)
  .max(MAX_QUESTION_BLOCKS)
  .superRefine((blocks, context) => {
    const blockPositions = new Set<number>();

    for (const block of blocks) {
      if (blockPositions.has(block.position)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate block position",
          path: ["blocks"],
        });
        return;
      }

      blockPositions.add(block.position);
    }
  });

export const createQuestionnaireDraftInputSchema = z
  .object({
    version: questionnaireVersionSchema,
    title: questionnaireTitleSchema,
    estimatedMinutes: questionnaireEstimatedMinutesSchema,
  })
  .strict();

export const copyQuestionnaireVersionInputSchema = z
  .object({
    sourceQuestionnaireId: questionnaireIdSchema,
    newVersion: questionnaireVersionSchema,
    newTitle: questionnaireTitleSchema,
    estimatedMinutes: questionnaireEstimatedMinutesSchema,
  })
  .strict();

export const createQuestionnaireVersionInputSchema = z
  .object({
    sourceQuestionnaireId: z.union([questionnaireIdSchema, z.literal("blank")]),
    version: questionnaireVersionSchema,
    title: questionnaireTitleSchema,
    estimatedMinutes: questionnaireEstimatedMinutesSchema,
  })
  .strict();

export const replaceQuestionnaireContentInputSchema = z
  .object({
    questionnaireId: questionnaireIdSchema,
    title: questionnaireTitleSchema,
    estimatedMinutes: questionnaireEstimatedMinutesSchema,
    blocks: adminQuestionnaireBlocksSchema,
    confirmAssignedEdit: z.boolean().default(false),
  })
  .strict();

export const activateQuestionnaireVersionInputSchema = z
  .object({
    questionnaireId: questionnaireIdSchema,
  })
  .strict();

export const deleteQuestionnaireVersionInputSchema = z
  .object({
    questionnaireId: questionnaireIdSchema,
  })
  .strict();

export const adminUserInputSchema = z
  .object({
    userId: z.string().uuid(),
  })
  .strict();

export const adminUserSearchQuerySchema = z.string().trim().min(2).max(80);

export const setAdminUserActiveInputSchema = z
  .object({
    userId: z.string().uuid(),
    isActive: z.boolean(),
  })
  .strict();

export const responsibleAccessModeSchema = z.enum(["all_xtec", "centre_xtec"]);
export const adminResultsMinimumSubmissionsSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(10);

export type SubmissionAnswerInput = z.infer<typeof submissionAnswerSchema>;
export type SubmissionRequestInput = z.infer<typeof submissionRequestSchema>;
export type PrivateResultsRequestInput = z.infer<typeof privateResultsRequestSchema>;
export type OwnerResultsRequestInput = z.infer<typeof ownerResultsRequestSchema>;
export type AdminQuestionInput = z.infer<typeof adminQuestionInputSchema>;
export type AdminQuestionBlockInput = z.infer<typeof adminQuestionBlockInputSchema>;
export type CreateQuestionnaireDraftInput = z.infer<
  typeof createQuestionnaireDraftInputSchema
>;
export type CopyQuestionnaireVersionInput = z.infer<
  typeof copyQuestionnaireVersionInputSchema
>;
export type CreateQuestionnaireVersionInput = z.infer<
  typeof createQuestionnaireVersionInputSchema
>;
export type ReplaceQuestionnaireContentInput = z.infer<
  typeof replaceQuestionnaireContentInputSchema
>;
export type ActivateQuestionnaireVersionInput = z.infer<
  typeof activateQuestionnaireVersionInputSchema
>;
export type DeleteQuestionnaireVersionInput = z.infer<
  typeof deleteQuestionnaireVersionInputSchema
>;
export type AdminUserInput = z.infer<typeof adminUserInputSchema>;
export type AdminUserSearchQuery = z.infer<typeof adminUserSearchQuerySchema>;
export type SetAdminUserActiveInput = z.infer<typeof setAdminUserActiveInputSchema>;
export type ResponsibleAccessModeInput = z.infer<typeof responsibleAccessModeSchema>;
export type AdminResultsMinimumSubmissionsInput = z.infer<
  typeof adminResultsMinimumSubmissionsSchema
>;
