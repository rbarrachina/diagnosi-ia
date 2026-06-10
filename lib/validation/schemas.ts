import { z } from "zod";
import { PUBLIC_CODE_PATTERN } from "@/lib/crypto/public-code";

export const QUESTIONNAIRE_VERSION = "2026.2";
export const EXPECTED_ANSWER_COUNT = 20;
export const MAX_SUBMISSIONS_PER_SPACE = 300;

export const publicCodeSchema = z
  .string()
  .regex(PUBLIC_CODE_PATTERN, "El format del codi públic no és vàlid");

export const privateTokenSchema = z
  .string()
  .min(43)
  .max(256)
  .regex(/^[A-Za-z0-9_-]+$/, "El format del token privat no és vàlid");

export const answerValueSchema = z.union([z.literal(0), z.literal(1), z.literal(2)]);

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
    questionnaireVersion: z.literal(QUESTIONNAIRE_VERSION),
    answers: z.array(submissionAnswerSchema).length(EXPECTED_ANSWER_COUNT),
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

export type SubmissionAnswerInput = z.infer<typeof submissionAnswerSchema>;
export type SubmissionRequestInput = z.infer<typeof submissionRequestSchema>;
export type PrivateResultsRequestInput = z.infer<typeof privateResultsRequestSchema>;
export type OwnerResultsRequestInput = z.infer<typeof ownerResultsRequestSchema>;
