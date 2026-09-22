import "server-only";

import { randomUUID } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import type {
  AdminQuestionBlockSummary,
  AdminQuestionnaireDetail,
  AdminQuestionnaireMutationResult,
  AdminQuestionnaireSummary,
  AdminQuestionSummary,
} from "@/lib/admin/types";
import type { QuestionnaireLanguageCode } from "@/lib/questionnaire/languages";
import type { ScaleValue } from "@/lib/questionnaire/scale";
import { mysqlPool } from "@/lib/db/client";
import {
  activateQuestionnaireVersionInputSchema,
  copyQuestionnaireVersionInputSchema,
  createQuestionnaireDraftInputSchema,
  createQuestionnaireVersionInputSchema,
  deleteQuestionnaireVersionInputSchema,
  questionnaireIdSchema,
  replaceQuestionnaireContentInputSchema,
  type AdminQuestionBlockInput,
  type ActivateQuestionnaireVersionInput,
  type CopyQuestionnaireVersionInput,
  type CreateQuestionnaireDraftInput,
  type CreateQuestionnaireVersionInput,
  type DeleteQuestionnaireVersionInput,
  type ReplaceQuestionnaireContentInput,
  type ReplaceQuestionnaireContentPayload,
} from "@/lib/validation/schemas";

type QuestionnaireRow = RowDataPacket & {
  id: string;
  version: string;
  title: string;
  estimated_minutes: number;
  language_code: QuestionnaireLanguageCode;
  is_active: number | boolean;
  created_at: string | Date;
};

type BlockRow = RowDataPacket & {
  id: string;
  position: number;
  title: string;
};

type QuestionRow = RowDataPacket & {
  id: string;
  block_id: string;
  position: number;
  block_position: number;
  text: string;
  randomize_options: number | boolean;
};

type OptionRow = RowDataPacket & {
  id: string;
  question_id: string;
  score: number;
  text: string;
};

type CountRow = RowDataPacket & {
  row_count: number | string;
};

type NextQuestionnaireIdRow = RowDataPacket & {
  next_id: number | string;
};

type NamedLockRow = RowDataPacket & {
  lock_result: number | null;
};

type ExistingQuestionnaireKeyRow = RowDataPacket & {
  id: string;
  version: string;
  title: string;
};

type AdminQuestionnaireOperationReason =
  | "duplicate_title"
  | "duplicate_version"
  | "not_found"
  | "unknown";

export class AdminQuestionnaireOperationError extends Error {
  readonly reason: AdminQuestionnaireOperationReason;

  constructor(
    message = "Could not manage questionnaire",
    reason: AdminQuestionnaireOperationReason = "unknown",
  ) {
    super(message);
    this.name = "AdminQuestionnaireOperationError";
    this.reason = reason;
  }
}

async function countRows(
  table: "diagnostic_spaces" | "question_blocks" | "questions" | "submissions",
  questionnaireId: string,
): Promise<number> {
  const [rows] = await mysqlPool.execute<CountRow[]>(
    `
      select count(*) as row_count
      from ${table}
      where questionnaire_id = ?
    `,
    [questionnaireId],
  );

  return Number(rows[0]?.row_count ?? 0);
}

async function buildSummary(row: QuestionnaireRow): Promise<AdminQuestionnaireSummary> {
  const [diagnosticSpaceCount, totalSubmissions, blockCount, questionCount] =
    await Promise.all([
      countRows("diagnostic_spaces", row.id),
      countRows("submissions", row.id),
      countRows("question_blocks", row.id),
      countRows("questions", row.id),
    ]);

  return {
    id: row.id,
    version: row.version,
    title: row.title,
    estimatedMinutes: Number(row.estimated_minutes),
    languageCode: row.language_code,
    isActive: toBoolean(row.is_active),
    createdAt: formatDateTime(row.created_at),
    diagnosticSpaceCount,
    totalSubmissions,
    blockCount,
    questionCount,
  };
}

function mapBlocks(
  blocks: BlockRow[],
  questions: QuestionRow[],
  options: OptionRow[],
): AdminQuestionBlockSummary[] {
  const questionsByBlock = new Map<string, AdminQuestionSummary[]>();
  const optionsByQuestion = new Map<string, AdminQuestionSummary["options"]>();

  for (const option of options) {
    const questionOptions = optionsByQuestion.get(option.question_id) ?? [];
    questionOptions.push({
      id: option.id,
      score: option.score as ScaleValue,
      text: option.text,
    });
    optionsByQuestion.set(option.question_id, questionOptions);
  }

  for (const question of questions) {
    const blockQuestions = questionsByBlock.get(question.block_id) ?? [];
    blockQuestions.push({
      id: question.id,
      position: question.position,
      blockPosition: question.block_position,
      text: question.text,
      randomizeOptions: toBoolean(question.randomize_options),
      options: (optionsByQuestion.get(question.id) ?? []).sort(
        (a, b) => a.score - b.score,
      ),
    });
    questionsByBlock.set(question.block_id, blockQuestions);
  }

  return blocks.map((block) => ({
    id: block.id,
    position: block.position,
    title: block.title,
    questions: (questionsByBlock.get(block.id) ?? []).sort(
      (a, b) => a.blockPosition - b.blockPosition,
    ),
  }));
}

export async function listQuestionnaireVersions(): Promise<AdminQuestionnaireSummary[]> {
  const [rows] = await mysqlPool.execute<QuestionnaireRow[]>(
    `
      select id, version, title, estimated_minutes, language_code, is_active, created_at
      from questionnaires
      order by created_at desc
    `,
  );

  return Promise.all(rows.map(buildSummary));
}

export async function getQuestionnaireVersionDetail(
  questionnaireId: string,
): Promise<AdminQuestionnaireDetail | null> {
  const parsedQuestionnaireId = questionnaireIdSchema.parse(questionnaireId);
  const [questionnaireRows] = await mysqlPool.execute<QuestionnaireRow[]>(
    `
      select id, version, title, estimated_minutes, language_code, is_active, created_at
      from questionnaires
      where id = ?
      limit 1
    `,
    [parsedQuestionnaireId],
  );
  const [questionnaire] = questionnaireRows;

  if (!questionnaire) {
    return null;
  }

  const [
    summary,
    [blocks],
    [questions],
    [options],
  ] = await Promise.all([
    buildSummary(questionnaire),
    mysqlPool.execute<BlockRow[]>(
      `
        select id, position, title
        from question_blocks
        where questionnaire_id = ?
        order by position asc
      `,
      [parsedQuestionnaireId],
    ),
    mysqlPool.execute<QuestionRow[]>(
      `
        select id, block_id, position, block_position, text, randomize_options
        from questions
        where questionnaire_id = ?
        order by position asc
      `,
      [parsedQuestionnaireId],
    ),
    mysqlPool.execute<OptionRow[]>(
      `
        select id, question_id, score, text
        from question_options
        where questionnaire_id = ?
        order by question_id asc, score asc
      `,
      [parsedQuestionnaireId],
    ),
  ]);

  return {
    ...summary,
    blocks: mapBlocks(blocks, questions, options),
  };
}

export async function createQuestionnaireDraft(
  input: CreateQuestionnaireDraftInput,
): Promise<AdminQuestionnaireMutationResult> {
  const payload = createQuestionnaireDraftInputSchema.parse(input);
  const connection = await mysqlPool.getConnection();
  let hasLock = false;

  try {
    await connection.beginTransaction();
    hasLock = await acquireQuestionnaireIdLock(connection);
    await assertQuestionnaireVersionAndTitleAvailable(
      connection,
      payload.version,
      payload.title,
    );
    const questionnaireId = await getNextQuestionnaireId(connection);

    await connection.execute<ResultSetHeader>(
      `
        insert into questionnaires (id, version, title, estimated_minutes, language_code, is_active)
        values (?, ?, ?, ?, ?, false)
      `,
      [
        questionnaireId,
        payload.version,
        payload.title.trim(),
        payload.estimatedMinutes,
        payload.languageCode,
      ],
    );

    const result = await getQuestionnaireMutationResult(connection, questionnaireId);
    await connection.commit();
    return result;
  } catch (error) {
    await rollbackQuietly(connection);
    throw toAdminQuestionnaireError(error);
  } finally {
    if (hasLock) {
      await releaseQuestionnaireIdLock(connection);
    }
    connection.release();
  }
}

export async function copyQuestionnaireVersion(
  input: CopyQuestionnaireVersionInput,
): Promise<AdminQuestionnaireMutationResult> {
  const payload = copyQuestionnaireVersionInputSchema.parse(input);
  return copyQuestionnaireVersionInternal({
    sourceQuestionnaireId: payload.sourceQuestionnaireId,
    version: payload.newVersion,
    title: payload.newTitle,
    estimatedMinutes: payload.estimatedMinutes,
    languageCode: payload.languageCode,
  });
}

export async function createQuestionnaireVersion(
  input: CreateQuestionnaireVersionInput,
): Promise<AdminQuestionnaireMutationResult> {
  const payload = createQuestionnaireVersionInputSchema.parse(input);

  if (payload.sourceQuestionnaireId === "blank") {
    return createQuestionnaireDraft({
      version: payload.version,
      title: payload.title,
      estimatedMinutes: payload.estimatedMinutes,
      languageCode: payload.languageCode,
    });
  }

  return copyQuestionnaireVersionInternal({
    sourceQuestionnaireId: payload.sourceQuestionnaireId,
    version: payload.version,
    title: payload.title,
    estimatedMinutes: payload.estimatedMinutes,
    languageCode: payload.languageCode,
  });
}

export async function replaceQuestionnaireContent(
  input: ReplaceQuestionnaireContentInput,
): Promise<AdminQuestionnaireMutationResult> {
  const payload = replaceQuestionnaireContentInputSchema.parse(input);
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const questionnaire = await getQuestionnaireRowForUpdate(
      connection,
      payload.questionnaireId,
    );

    const assignedSpaceCount = await countRowsForConnection(
      connection,
      "diagnostic_spaces",
      payload.questionnaireId,
    );
    const responseCount = await countRowsForConnection(
      connection,
      "submissions",
      payload.questionnaireId,
    );

    if (assignedSpaceCount > 0 && !payload.confirmAssignedEdit) {
      throw new AdminQuestionnaireOperationError(
        "Confirmed edit is required for questionnaires assigned to spaces",
      );
    }

    if (toBoolean(questionnaire.is_active) || responseCount > 0) {
      await updateTextOnlyContent(connection, payload);
    } else {
      await replaceStructuralContent(connection, payload);
    }

    const result = await getQuestionnaireMutationResult(
      connection,
      payload.questionnaireId,
    );
    await connection.commit();
    return result;
  } catch (error) {
    await rollbackQuietly(connection);
    throw toAdminQuestionnaireError(error);
  } finally {
    connection.release();
  }
}

export async function activateQuestionnaireVersion(
  input: ActivateQuestionnaireVersionInput,
): Promise<AdminQuestionnaireMutationResult> {
  const payload = activateQuestionnaireVersionInputSchema.parse(input);
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    await getQuestionnaireRowForUpdate(connection, payload.questionnaireId);
    await assertQuestionnaireCanBeActivated(connection, payload.questionnaireId);

    await connection.execute<ResultSetHeader>(
      `
        update questionnaires
        set is_active = false
        where is_active = true
          and id <> ?
      `,
      [payload.questionnaireId],
    );
    await connection.execute<ResultSetHeader>(
      `
        update questionnaires
        set is_active = true
        where id = ?
      `,
      [payload.questionnaireId],
    );

    const result = await getQuestionnaireMutationResult(
      connection,
      payload.questionnaireId,
    );
    await connection.commit();
    return result;
  } catch (error) {
    await rollbackQuietly(connection);
    throw toAdminQuestionnaireError(error);
  } finally {
    connection.release();
  }
}

export async function deleteQuestionnaireVersion(
  input: DeleteQuestionnaireVersionInput,
): Promise<void> {
  const payload = deleteQuestionnaireVersionInputSchema.parse(input);
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const questionnaire = await getQuestionnaireRowForUpdate(
      connection,
      payload.questionnaireId,
    );

    if (toBoolean(questionnaire.is_active)) {
      throw new AdminQuestionnaireOperationError(
        "Active questionnaire versions cannot be deleted",
      );
    }

    await connection.execute<ResultSetHeader>(
      "delete from answers where questionnaire_id = ?",
      [payload.questionnaireId],
    );
    await connection.execute<ResultSetHeader>(
      "delete from submissions where questionnaire_id = ?",
      [payload.questionnaireId],
    );
    await connection.execute<ResultSetHeader>(
      "delete from diagnostic_spaces where questionnaire_id = ?",
      [payload.questionnaireId],
    );
    await connection.execute<ResultSetHeader>(
      "delete from questions where questionnaire_id = ?",
      [payload.questionnaireId],
    );
    await connection.execute<ResultSetHeader>(
      "delete from question_blocks where questionnaire_id = ?",
      [payload.questionnaireId],
    );
    await connection.execute<ResultSetHeader>(
      "delete from questionnaires where id = ?",
      [payload.questionnaireId],
    );

    await connection.commit();
  } catch (error) {
    await rollbackQuietly(connection);
    throw toAdminQuestionnaireError(error);
  } finally {
    connection.release();
  }
}

async function copyQuestionnaireVersionInternal(input: {
  sourceQuestionnaireId: string;
  version: string;
  title: string;
  estimatedMinutes: number;
  languageCode: QuestionnaireLanguageCode;
}): Promise<AdminQuestionnaireMutationResult> {
  const connection = await mysqlPool.getConnection();
  let hasLock = false;

  try {
    await connection.beginTransaction();
    await getQuestionnaireRowForUpdate(connection, input.sourceQuestionnaireId);
    hasLock = await acquireQuestionnaireIdLock(connection);
    await assertQuestionnaireVersionAndTitleAvailable(
      connection,
      input.version,
      input.title,
    );
    const questionnaireId = await getNextQuestionnaireId(connection);

    await connection.execute<ResultSetHeader>(
      `
        insert into questionnaires (id, version, title, estimated_minutes, language_code, is_active)
        values (?, ?, ?, ?, ?, false)
      `,
      [
        questionnaireId,
        input.version,
        input.title.trim(),
        input.estimatedMinutes,
        input.languageCode,
      ],
    );

    const [blocks] = await connection.execute<BlockRow[]>(
      `
        select id, position, title
        from question_blocks
        where questionnaire_id = ?
        order by position asc
      `,
      [input.sourceQuestionnaireId],
    );
    const [questions] = await connection.execute<QuestionRow[]>(
      `
        select id, block_id, position, block_position, text, randomize_options
        from questions
        where questionnaire_id = ?
        order by position asc
      `,
      [input.sourceQuestionnaireId],
    );
    const [options] = await connection.execute<OptionRow[]>(
      `
        select id, question_id, score, text
        from question_options
        where questionnaire_id = ?
        order by question_id asc, score asc
      `,
      [input.sourceQuestionnaireId],
    );

    for (const block of blocks) {
      await connection.execute<ResultSetHeader>(
        `
          insert into question_blocks (id, questionnaire_id, position, title)
          values (?, ?, ?, ?)
        `,
        [block.id, questionnaireId, block.position, block.title],
      );
    }

    for (const question of questions) {
      const newQuestionId = randomUUID();
      await connection.execute<ResultSetHeader>(
        `
          insert into questions (
            id,
            questionnaire_id,
            block_id,
            position,
            block_position,
            text,
            scale_min,
            scale_max,
            randomize_options
          )
          values (?, ?, ?, ?, ?, ?, 0, 3, ?)
        `,
        [
          newQuestionId,
          questionnaireId,
          question.block_id,
          question.position,
          question.block_position,
          question.text,
          toBoolean(question.randomize_options),
        ],
      );

      for (const option of options.filter((item) => item.question_id === question.id)) {
        await connection.execute<ResultSetHeader>(
          `
            insert into question_options
              (id, questionnaire_id, question_id, score, text)
            values (?, ?, ?, ?, ?)
          `,
          [randomUUID(), questionnaireId, newQuestionId, option.score, option.text],
        );
      }
    }

    const result = await getQuestionnaireMutationResult(connection, questionnaireId);
    await connection.commit();
    return result;
  } catch (error) {
    await rollbackQuietly(connection);
    throw toAdminQuestionnaireError(error);
  } finally {
    if (hasLock) {
      await releaseQuestionnaireIdLock(connection);
    }
    connection.release();
  }
}

async function acquireQuestionnaireIdLock(connection: PoolConnection): Promise<boolean> {
  const [rows] = await connection.execute<NamedLockRow[]>(
    "select get_lock('diagnosi_ia_questionnaire_id', 10) as lock_result",
  );

  if (rows[0]?.lock_result !== 1) {
    throw new AdminQuestionnaireOperationError(
      "Could not acquire questionnaire id lock",
    );
  }

  return true;
}

async function releaseQuestionnaireIdLock(connection: PoolConnection): Promise<void> {
  try {
    await connection.execute(
      "select release_lock('diagnosi_ia_questionnaire_id') as released",
    );
  } catch {
    // The connection is being released anyway; callers already handle the main error.
  }
}

async function getNextQuestionnaireId(connection: PoolConnection): Promise<string> {
  const [rows] = await connection.execute<NextQuestionnaireIdRow[]>(
    `
      select coalesce(max(cast(id as unsigned)), 0) + 1 as next_id
      from questionnaires
    `,
  );
  const nextId = Number(rows[0]?.next_id ?? 1);

  if (!Number.isInteger(nextId) || nextId < 1 || nextId > 999) {
    throw new AdminQuestionnaireOperationError("Invalid next questionnaire id");
  }

  return String(nextId).padStart(3, "0");
}

async function assertQuestionnaireVersionAndTitleAvailable(
  connection: PoolConnection,
  version: string,
  title: string,
): Promise<void> {
  const normalizedTitle = title.trim().toLowerCase();
  const [rows] = await connection.execute<ExistingQuestionnaireKeyRow[]>(
    `
      select id, version, title
      from questionnaires
      where version = ?
         or lower(trim(title)) = ?
      limit 1
      for update
    `,
    [version, normalizedTitle],
  );
  const [existingQuestionnaire] = rows;

  if (!existingQuestionnaire) {
    return;
  }

  if (existingQuestionnaire.version === version) {
    throw new AdminQuestionnaireOperationError(
      "Questionnaire version already exists",
      "duplicate_version",
    );
  }

  throw new AdminQuestionnaireOperationError(
    "Questionnaire title already exists",
    "duplicate_title",
  );
}

async function getQuestionnaireRowForUpdate(
  connection: PoolConnection,
  questionnaireId: string,
): Promise<QuestionnaireRow> {
  const [rows] = await connection.execute<QuestionnaireRow[]>(
    `
      select id, version, title, estimated_minutes, language_code, is_active, created_at
      from questionnaires
      where id = ?
      limit 1
      for update
    `,
    [questionnaireId],
  );
  const [questionnaire] = rows;

  if (!questionnaire) {
    throw new AdminQuestionnaireOperationError("Questionnaire not found", "not_found");
  }

  return questionnaire;
}

async function getQuestionnaireMutationResult(
  connection: PoolConnection,
  questionnaireId: string,
): Promise<AdminQuestionnaireMutationResult> {
  const [rows] = await connection.execute<QuestionnaireRow[]>(
    `
      select id, version, title, estimated_minutes, language_code, is_active, created_at
      from questionnaires
      where id = ?
      limit 1
    `,
    [questionnaireId],
  );
  const [questionnaire] = rows;

  if (!questionnaire) {
    throw new AdminQuestionnaireOperationError("Questionnaire not found");
  }

  return {
    id: questionnaire.id,
    version: questionnaire.version,
    title: questionnaire.title,
    estimatedMinutes: Number(questionnaire.estimated_minutes),
    languageCode: questionnaire.language_code,
    isActive: toBoolean(questionnaire.is_active),
  };
}

async function countRowsForConnection(
  connection: PoolConnection,
  table: "diagnostic_spaces" | "question_blocks" | "questions" | "submissions",
  questionnaireId: string,
): Promise<number> {
  const [rows] = await connection.execute<CountRow[]>(
    `
      select count(*) as row_count
      from ${table}
      where questionnaire_id = ?
    `,
    [questionnaireId],
  );

  return Number(rows[0]?.row_count ?? 0);
}

async function replaceStructuralContent(
  connection: PoolConnection,
  payload: ReplaceQuestionnaireContentPayload,
): Promise<void> {
  await connection.execute<ResultSetHeader>(
    "update questionnaires set title = ?, estimated_minutes = ?, language_code = ? where id = ?",
    [
      payload.title.trim(),
      payload.estimatedMinutes,
      payload.languageCode,
      payload.questionnaireId,
    ],
  );
  await connection.execute<ResultSetHeader>(
    "delete from questions where questionnaire_id = ?",
    [payload.questionnaireId],
  );
  await connection.execute<ResultSetHeader>(
    "delete from question_blocks where questionnaire_id = ?",
    [payload.questionnaireId],
  );

  for (const block of sortBlocks(payload.blocks)) {
    const blockId = formatBlockId(block.position);
    await connection.execute<ResultSetHeader>(
      `
        insert into question_blocks (id, questionnaire_id, position, title)
        values (?, ?, ?, ?)
      `,
      [blockId, payload.questionnaireId, block.position, block.title.trim()],
    );

    for (const question of sortQuestions(block.questions)) {
      const questionId = randomUUID();
      await connection.execute<ResultSetHeader>(
        `
          insert into questions (
            id,
            questionnaire_id,
            block_id,
            position,
            block_position,
            text,
            scale_min,
            scale_max,
            randomize_options
          )
          values (?, ?, ?, ?, ?, ?, 0, 3, ?)
        `,
        [
          questionId,
          payload.questionnaireId,
          blockId,
          getQuestionPosition(block.position, question.blockPosition),
          question.blockPosition,
          question.text.trim(),
          question.randomizeOptions,
        ],
      );

      for (const option of question.options.slice().sort((a, b) => a.score - b.score)) {
        await connection.execute<ResultSetHeader>(
          `
            insert into question_options
              (id, questionnaire_id, question_id, score, text)
            values (?, ?, ?, ?, ?)
          `,
          [
            randomUUID(),
            payload.questionnaireId,
            questionId,
            option.score,
            option.text.trim(),
          ],
        );
      }
    }
  }
}

async function updateTextOnlyContent(
  connection: PoolConnection,
  payload: ReplaceQuestionnaireContentPayload,
): Promise<void> {
  await assertStructureMatchesExisting(connection, payload);
  const questionnaire = await getQuestionnaireRowForUpdate(
    connection,
    payload.questionnaireId,
  );

  if (questionnaire.language_code !== payload.languageCode) {
    throw new AdminQuestionnaireOperationError(
      "Questionnaire language cannot be changed after responses or activation",
    );
  }
  await connection.execute<ResultSetHeader>(
    "update questionnaires set title = ?, estimated_minutes = ? where id = ?",
    [
      payload.title.trim(),
      payload.estimatedMinutes,
      payload.questionnaireId,
    ],
  );

  for (const block of sortBlocks(payload.blocks)) {
    await connection.execute<ResultSetHeader>(
      `
        update question_blocks
        set title = ?
        where questionnaire_id = ?
          and position = ?
      `,
      [block.title.trim(), payload.questionnaireId, block.position],
    );

    for (const question of sortQuestions(block.questions)) {
      await connection.execute<ResultSetHeader>(
        `
          update questions
          join question_blocks
            on question_blocks.questionnaire_id = questions.questionnaire_id
           and question_blocks.id = questions.block_id
          set questions.text = ?
          where questions.questionnaire_id = ?
            and question_blocks.position = ?
            and questions.block_position = ?
        `,
        [
          question.text.trim(),
          payload.questionnaireId,
          block.position,
          question.blockPosition,
        ],
      );

      for (const option of question.options) {
        await connection.execute<ResultSetHeader>(
          `
            update question_options
            inner join questions
              on questions.id = question_options.question_id
             and questions.questionnaire_id = question_options.questionnaire_id
            inner join question_blocks
              on question_blocks.id = questions.block_id
             and question_blocks.questionnaire_id = questions.questionnaire_id
            set question_options.text = ?
            where question_options.questionnaire_id = ?
              and question_blocks.position = ?
              and questions.block_position = ?
              and question_options.score = ?
          `,
          [
            option.text.trim(),
            payload.questionnaireId,
            block.position,
            question.blockPosition,
            option.score,
          ],
        );
      }
    }
  }
}

async function assertStructureMatchesExisting(
  connection: PoolConnection,
  payload: ReplaceQuestionnaireContentPayload,
): Promise<void> {
  const [blocks] = await connection.execute<BlockRow[]>(
    `
      select id, position, title
      from question_blocks
      where questionnaire_id = ?
      order by position asc
    `,
    [payload.questionnaireId],
  );
  const [questions] = await connection.execute<QuestionRow[]>(
    `
      select questions.id, questions.block_id, questions.position, questions.block_position, questions.text, questions.randomize_options
      from questions
      join question_blocks
        on question_blocks.questionnaire_id = questions.questionnaire_id
       and question_blocks.id = questions.block_id
      where questions.questionnaire_id = ?
      order by question_blocks.position asc, questions.block_position asc
    `,
    [payload.questionnaireId],
  );

  const expectedBlockPositions = blocks.map((block) => block.position).sort(compareNumbers);
  const requestedBlockPositions = payload.blocks
    .map((block) => block.position)
    .sort(compareNumbers);

  if (!sameNumberList(expectedBlockPositions, requestedBlockPositions)) {
    throw new AdminQuestionnaireOperationError(
      "Questionnaire structure cannot be changed after responses or activation",
    );
  }

  const blockPositionById = new Map(blocks.map((block) => [block.id, block.position]));
  const expectedQuestionPositions = questions
    .map((question) => {
      const blockPosition = blockPositionById.get(question.block_id);
      return `${blockPosition}:${question.block_position}`;
    })
    .sort();
  const requestedQuestionPositions = payload.blocks
    .flatMap((block) =>
      block.questions.map((question) => `${block.position}:${question.blockPosition}`),
    )
    .sort();

  if (!sameStringList(expectedQuestionPositions, requestedQuestionPositions)) {
    throw new AdminQuestionnaireOperationError(
      "Questionnaire structure cannot be changed after responses or activation",
    );
  }

  const existingRandomizationByPosition = new Map(
    questions.map((question) => {
      const blockPosition = blockPositionById.get(question.block_id);
      return [
        `${blockPosition}:${question.block_position}`,
        toBoolean(question.randomize_options),
      ];
    }),
  );

  for (const block of payload.blocks) {
    for (const question of block.questions) {
      if (
        existingRandomizationByPosition.get(
          `${block.position}:${question.blockPosition}`,
        ) !== question.randomizeOptions
      ) {
        throw new AdminQuestionnaireOperationError(
          "Answer randomization cannot be changed after responses or activation",
        );
      }
    }
  }
}

async function assertQuestionnaireCanBeActivated(
  connection: PoolConnection,
  questionnaireId: string,
): Promise<void> {
  const blockCount = await countRowsForConnection(
    connection,
    "question_blocks",
    questionnaireId,
  );
  const questionCount = await countRowsForConnection(connection, "questions", questionnaireId);
  const [invalidQuestionRows] = await connection.execute<CountRow[]>(
    `
      select count(*) as row_count
      from questions
      where questions.questionnaire_id = ?
        and (
          questions.scale_min <> 0
          or questions.scale_max <> 3
          or (
            select count(*)
            from question_options
            where question_options.questionnaire_id = questions.questionnaire_id
              and question_options.question_id = questions.id
          ) <> 4
          or (
            select count(distinct question_options.score)
            from question_options
            where question_options.questionnaire_id = questions.questionnaire_id
              and question_options.question_id = questions.id
          ) <> 4
        )
    `,
    [questionnaireId],
  );
  const invalidQuestionCount = Number(invalidQuestionRows[0]?.row_count ?? 0);

  if (
    blockCount < 1 ||
    blockCount > 10 ||
    questionCount < blockCount ||
    questionCount > 100 ||
    invalidQuestionCount !== 0
  ) {
    throw new AdminQuestionnaireOperationError(
      "Questionnaire version is not complete",
    );
  }
}

function formatBlockId(position: number): string {
  return String(position).padStart(2, "0");
}

function getQuestionPosition(blockPosition: number, questionBlockPosition: number): number {
  return (blockPosition - 1) * 10 + questionBlockPosition;
}

function sortBlocks(blocks: AdminQuestionBlockInput[]): AdminQuestionBlockInput[] {
  return blocks.slice().sort((a, b) => a.position - b.position);
}

function sortQuestions(
  questions: AdminQuestionBlockInput["questions"],
): AdminQuestionBlockInput["questions"] {
  return questions.slice().sort((a, b) => a.blockPosition - b.blockPosition);
}

function compareNumbers(a: number, b: number): number {
  return a - b;
}

function sameNumberList(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameStringList(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

async function rollbackQuietly(connection: PoolConnection): Promise<void> {
  try {
    await connection.rollback();
  } catch {
    // Preserve the original mutation error.
  }
}

function toAdminQuestionnaireError(error: unknown): AdminQuestionnaireOperationError {
  if (error instanceof AdminQuestionnaireOperationError) {
    return error;
  }

  if (isDuplicateMySqlError(error)) {
    const message = `${error.message ?? ""} ${error.sqlMessage ?? ""}`;

    if (message.includes("questionnaires_version_key")) {
      return new AdminQuestionnaireOperationError(
        "Questionnaire version already exists",
        "duplicate_version",
      );
    }

    if (message.includes("questionnaires_title_unique_idx")) {
      return new AdminQuestionnaireOperationError(
        "Questionnaire title already exists",
        "duplicate_title",
      );
    }
  }

  return new AdminQuestionnaireOperationError();
}

function isDuplicateMySqlError(
  error: unknown,
): error is { code?: string; message?: string; sqlMessage?: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  );
}

function toBoolean(value: number | boolean): boolean {
  return value === true || value === 1;
}

function formatDateTime(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}
