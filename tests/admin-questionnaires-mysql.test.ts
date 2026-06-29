import { beforeEach, describe, expect, it, vi } from "vitest";

type QuestionnaireRow = {
  id: string;
  version: string;
  title: string;
  estimated_minutes: number;
  is_active: number;
  created_at: string;
};

type BlockRow = {
  id: string;
  questionnaire_id: string;
  position: number;
  title: string;
};

type QuestionRow = {
  id: string;
  questionnaire_id: string;
  block_id: string;
  position: number;
  block_position: number;
  text: string;
};

type ExecuteCall = {
  query: string;
  values: unknown[];
};

type ConnectionMock = {
  beginTransaction: ReturnType<typeof vi.fn>;
  commit: ReturnType<typeof vi.fn>;
  rollback: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  calls: ExecuteCall[];
};

let questionnaires: QuestionnaireRow[];
let blocks: BlockRow[];
let questions: QuestionRow[];
let diagnosticSpaceCounts: Record<string, number>;
let submissionCounts: Record<string, number>;
let connection: ConnectionMock;

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db/client", () => ({
  mysqlPool: {
    execute: vi.fn(async () => {
      throw new Error("Unexpected pool query in questionnaire mutation test");
    }),
    getConnection: vi.fn(async () => connection),
  },
}));

const {
  activateQuestionnaireVersion,
  createQuestionnaireVersion,
  deleteQuestionnaireVersion,
  replaceQuestionnaireContent,
  AdminQuestionnaireOperationError,
} = await import("@/lib/admin/questionnaires");

describe("MySQL admin questionnaire mutations", () => {
  beforeEach(() => {
    questionnaires = [
      questionnaire("001", "2026.1", "Versio antiga", 0),
      questionnaire("002", "2026.2", "Versio activa", 1),
    ];
    blocks = [
      block("01", "002", 1, "Bloc 1"),
      block("02", "002", 2, "Bloc 2"),
    ];
    questions = [
      question("question-1", "002", "01", 1, 1, "Pregunta 1"),
      question("question-2", "002", "02", 11, 1, "Pregunta 2"),
    ];
    diagnosticSpaceCounts = { "002": 1 };
    submissionCounts = { "002": 1 };
    connection = createConnectionMock();
  });

  it("creates a blank inactive questionnaire version with the next three-digit id", async () => {
    const result = await createQuestionnaireVersion({
      sourceQuestionnaireId: "blank",
      version: "2026.3",
      title: " Nova versio ",
      estimatedMinutes: 10,
    });

    expect(result).toEqual({
      id: "003",
      version: "2026.3",
      title: "Nova versio",
      estimatedMinutes: 10,
      isActive: false,
    });
    expect(connection.beginTransaction).toHaveBeenCalledOnce();
    expect(connection.commit).toHaveBeenCalledOnce();
    expect(connection.calls.some((call) => call.query.includes("get_lock"))).toBe(true);
  });

  it("reports duplicate questionnaire versions and titles distinctly", async () => {
    await expect(
      createQuestionnaireVersion({
        sourceQuestionnaireId: "blank",
        version: "2026.2",
        title: "Una altra versio",
        estimatedMinutes: 10,
      }),
    ).rejects.toMatchObject({
      reason: "duplicate_version",
    });

    await expect(
      createQuestionnaireVersion({
        sourceQuestionnaireId: "blank",
        version: "2026.3",
        title: "  versio activa ",
        estimatedMinutes: 10,
      }),
    ).rejects.toMatchObject({
      reason: "duplicate_title",
    });
  });

  it("copies questionnaire content using new question ids", async () => {
    const result = await createQuestionnaireVersion({
      sourceQuestionnaireId: "002",
      version: "2026.3",
      title: "Copia 2026.2",
      estimatedMinutes: 15,
    });

    expect(result.id).toBe("003");
    expect(result.estimatedMinutes).toBe(15);
    expect(blocks.filter((row) => row.questionnaire_id === "003")).toHaveLength(2);
    const copiedQuestions = questions.filter((row) => row.questionnaire_id === "003");

    expect(copiedQuestions).toHaveLength(2);
    expect(copiedQuestions.map((row) => row.id)).not.toEqual(["question-1", "question-2"]);
    expect(copiedQuestions.map((row) => row.text)).toEqual(["Pregunta 1", "Pregunta 2"]);
  });

  it("replaces draft structure when the version is inactive and has no responses", async () => {
    questionnaires.push(questionnaire("003", "2026.3", "Esborrany", 0));
    blocks.push(block("01", "003", 1, "Bloc vell"));
    questions.push(question("old-question", "003", "01", 1, 1, "Pregunta vella"));

    await replaceQuestionnaireContent({
      questionnaireId: "003",
      title: "Esborrany revisat",
      estimatedMinutes: 12,
      confirmAssignedEdit: false,
      blocks: [
        {
          position: 1,
          title: "Bloc nou",
          questions: [
            { blockPosition: 1, text: "Pregunta nova 1" },
            { blockPosition: 2, text: "Pregunta nova 2" },
          ],
        },
      ],
    });

    expect(questionnaires.find((row) => row.id === "003")?.title).toBe(
      "Esborrany revisat",
    );
    expect(questionnaires.find((row) => row.id === "003")?.estimated_minutes).toBe(12);
    expect(blocks.filter((row) => row.questionnaire_id === "003")).toEqual([
      expect.objectContaining({ id: "01", title: "Bloc nou" }),
    ]);
    expect(questions.filter((row) => row.questionnaire_id === "003")).toHaveLength(2);
    expect(questions.some((row) => row.id === "old-question")).toBe(false);
  });

  it("allows only text corrections for active or answered versions", async () => {
    await replaceQuestionnaireContent({
      questionnaireId: "002",
      title: "Versio activa corregida",
      estimatedMinutes: 14,
      confirmAssignedEdit: true,
      blocks: [
        {
          position: 1,
          title: "Bloc 1 corregit",
          questions: [{ blockPosition: 1, text: "Pregunta 1 corregida" }],
        },
        {
          position: 2,
          title: "Bloc 2",
          questions: [{ blockPosition: 1, text: "Pregunta 2" }],
        },
      ],
    });

    expect(questionnaires.find((row) => row.id === "002")?.title).toBe(
      "Versio activa corregida",
    );
    expect(questionnaires.find((row) => row.id === "002")?.estimated_minutes).toBe(14);
    expect(blocks.find((row) => row.questionnaire_id === "002" && row.position === 1)?.title)
      .toBe("Bloc 1 corregit");
    expect(questions.find((row) => row.id === "question-1")?.text).toBe(
      "Pregunta 1 corregida",
    );

    await expect(
      replaceQuestionnaireContent({
        questionnaireId: "002",
        title: "Canvi estructural",
        estimatedMinutes: 14,
        confirmAssignedEdit: true,
        blocks: [
          {
            position: 1,
            title: "Bloc 1",
            questions: [{ blockPosition: 1, text: "Pregunta 1" }],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(AdminQuestionnaireOperationError);
  });

  it("activates a complete version without updating existing diagnostic spaces", async () => {
    questionnaires.push(questionnaire("003", "2026.3", "Completa", 0));
    blocks.push(block("01", "003", 1, "Bloc 1"));
    questions.push(question("question-3", "003", "01", 1, 1, "Pregunta 3"));

    const result = await activateQuestionnaireVersion({ questionnaireId: "003" });

    expect(result.isActive).toBe(true);
    expect(questionnaires.find((row) => row.id === "002")?.is_active).toBe(0);
    expect(questionnaires.find((row) => row.id === "003")?.is_active).toBe(1);
    expect(
      connection.calls.some((call) => call.query.includes("update diagnostic_spaces")),
    ).toBe(false);
  });

  it("deletes only inactive questionnaire versions and dependent anonymous rows", async () => {
    questionnaires.push(questionnaire("003", "2026.3", "Per eliminar", 0));
    blocks.push(block("01", "003", 1, "Bloc 1"));
    questions.push(question("question-3", "003", "01", 1, 1, "Pregunta 3"));
    diagnosticSpaceCounts["003"] = 1;
    submissionCounts["003"] = 1;

    await deleteQuestionnaireVersion({ questionnaireId: "003" });

    expect(questionnaires.some((row) => row.id === "003")).toBe(false);
    expect(blocks.some((row) => row.questionnaire_id === "003")).toBe(false);
    expect(questions.some((row) => row.questionnaire_id === "003")).toBe(false);
    expect(diagnosticSpaceCounts["003"]).toBe(0);
    expect(submissionCounts["003"]).toBe(0);

    await expect(deleteQuestionnaireVersion({ questionnaireId: "002" })).rejects.toBeInstanceOf(
      AdminQuestionnaireOperationError,
    );
  });
});

function questionnaire(
  id: string,
  version: string,
  title: string,
  isActive: number,
  estimatedMinutes = 10,
): QuestionnaireRow {
  return {
    id,
    version,
    title,
    estimated_minutes: estimatedMinutes,
    is_active: isActive,
    created_at: "2026-06-15 10:00:00.000",
  };
}

function block(
  id: string,
  questionnaireId: string,
  position: number,
  title: string,
): BlockRow {
  return {
    id,
    questionnaire_id: questionnaireId,
    position,
    title,
  };
}

function question(
  id: string,
  questionnaireId: string,
  blockId: string,
  position: number,
  blockPosition: number,
  text: string,
): QuestionRow {
  return {
    id,
    questionnaire_id: questionnaireId,
    block_id: blockId,
    position,
    block_position: blockPosition,
    text,
  };
}

function createConnectionMock(): ConnectionMock {
  const calls: ExecuteCall[] = [];

  return {
    calls,
    beginTransaction: vi.fn(async () => undefined),
    commit: vi.fn(async () => undefined),
    rollback: vi.fn(async () => undefined),
    release: vi.fn(() => undefined),
    execute: vi.fn(async (query: string, values: unknown[] = []) => {
      const normalizedQuery = query.toLowerCase();
      calls.push({ query: normalizedQuery, values });

      if (normalizedQuery.includes("get_lock")) {
        return [[{ lock_result: 1 }]];
      }

      if (normalizedQuery.includes("release_lock")) {
        return [[{ released: 1 }]];
      }

      if (normalizedQuery.includes("coalesce(max(cast(id as unsigned))")) {
        const maxId = questionnaires.reduce(
          (currentMax, row) => Math.max(currentMax, Number(row.id)),
          0,
        );
        return [[{ next_id: maxId + 1 }]];
      }

      if (
        normalizedQuery.includes("from questionnaires") &&
        normalizedQuery.includes("where version =")
      ) {
        const requestedVersion = String(values[0]);
        const requestedTitle = String(values[1]).toLowerCase();
        return [
          questionnaires.filter(
            (row) =>
              row.version === requestedVersion ||
              row.title.trim().toLowerCase() === requestedTitle,
          ).slice(0, 1),
        ];
      }

      if (normalizedQuery.includes("insert into questionnaires")) {
        questionnaires.push(
          questionnaire(
            String(values[0]),
            String(values[1]),
            String(values[2]),
            0,
            Number(values[3]),
          ),
        );
        return [{ affectedRows: 1 }];
      }

      if (
        normalizedQuery.includes("select id, version, title, estimated_minutes, is_active, created_at") &&
        normalizedQuery.includes("from questionnaires")
      ) {
        return [[questionnaires.find((row) => row.id === values[0])].filter(Boolean)];
      }

      if (
        normalizedQuery.includes("select id, position, title") &&
        normalizedQuery.includes("from question_blocks")
      ) {
        return [
          blocks
            .filter((row) => row.questionnaire_id === values[0])
            .sort((a, b) => a.position - b.position),
        ];
      }

      if (
        normalizedQuery.trimStart().startsWith("select") &&
        normalizedQuery.includes("from questions") &&
        !normalizedQuery.includes("count(*)")
      ) {
        return [
          questions
            .filter((row) => row.questionnaire_id === values[0])
            .sort((a, b) => a.position - b.position),
        ];
      }

      if (normalizedQuery.includes("insert into question_blocks")) {
        blocks.push(block(String(values[0]), String(values[1]), Number(values[2]), String(values[3])));
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("insert into questions")) {
        questions.push(
          question(
            String(values[0]),
            String(values[1]),
            String(values[2]),
            Number(values[3]),
            Number(values[4]),
            String(values[5]),
          ),
        );
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("select count(*) as row_count")) {
        return [[{ row_count: getCountForQuery(normalizedQuery, String(values[0])) }]];
      }

      if (normalizedQuery.includes("update questionnaires") && normalizedQuery.includes("set title")) {
        const target = questionnaires.find((row) => row.id === values[2]);
        if (target) {
          target.title = String(values[0]);
          target.estimated_minutes = Number(values[1]);
        }
        return [{ affectedRows: target ? 1 : 0 }];
      }

      if (normalizedQuery.includes("update questionnaires") && normalizedQuery.includes("set is_active = false")) {
        for (const row of questionnaires) {
          if (row.id !== values[0] && row.is_active === 1) {
            row.is_active = 0;
          }
        }
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("update questionnaires") && normalizedQuery.includes("set is_active = true")) {
        const target = questionnaires.find((row) => row.id === values[0]);
        if (target) {
          target.is_active = 1;
        }
        return [{ affectedRows: target ? 1 : 0 }];
      }

      if (normalizedQuery.includes("update question_blocks")) {
        const target = blocks.find(
          (row) => row.questionnaire_id === values[1] && row.position === values[2],
        );
        if (target) {
          target.title = String(values[0]);
        }
        return [{ affectedRows: target ? 1 : 0 }];
      }

      if (normalizedQuery.includes("update questions")) {
        const blockRow = blocks.find(
          (row) => row.questionnaire_id === values[1] && row.position === values[2],
        );
        const target = questions.find(
          (row) =>
            row.questionnaire_id === values[1] &&
            row.block_id === blockRow?.id &&
            row.block_position === values[3],
        );
        if (target) {
          target.text = String(values[0]);
        }
        return [{ affectedRows: target ? 1 : 0 }];
      }

      if (normalizedQuery.includes("delete from answers")) {
        return [{ affectedRows: 0 }];
      }

      if (normalizedQuery.includes("delete from submissions")) {
        submissionCounts[String(values[0])] = 0;
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("delete from diagnostic_spaces")) {
        diagnosticSpaceCounts[String(values[0])] = 0;
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("delete from questions")) {
        questions = questions.filter((row) => row.questionnaire_id !== values[0]);
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("delete from question_blocks")) {
        blocks = blocks.filter((row) => row.questionnaire_id !== values[0]);
        return [{ affectedRows: 1 }];
      }

      if (normalizedQuery.includes("delete from questionnaires")) {
        questionnaires = questionnaires.filter((row) => row.id !== values[0]);
        return [{ affectedRows: 1 }];
      }

      throw new Error(`Unexpected query: ${query}`);
    }),
  };
}

function getCountForQuery(query: string, questionnaireId: string): number {
  if (query.includes("from diagnostic_spaces")) {
    return diagnosticSpaceCounts[questionnaireId] ?? 0;
  }

  if (query.includes("from submissions")) {
    return submissionCounts[questionnaireId] ?? 0;
  }

  if (query.includes("invalid_blocks")) {
    return blocks.filter((row) => {
      if (row.questionnaire_id !== questionnaireId) {
        return false;
      }

      const blockQuestionCount = questions.filter(
        (questionRow) =>
          questionRow.questionnaire_id === questionnaireId &&
          questionRow.block_id === row.id,
      ).length;
      return blockQuestionCount < 1 || blockQuestionCount > 10;
    }).length;
  }

  if (query.includes("from question_blocks")) {
    return blocks.filter((row) => row.questionnaire_id === questionnaireId).length;
  }

  if (query.includes("from questions")) {
    return questions.filter((row) => row.questionnaire_id === questionnaireId).length;
  }

  return 0;
}
