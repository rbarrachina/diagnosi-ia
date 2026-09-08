"use client";

import { useState } from "react";
import { saveQuestionnaireContentAction } from "@/app/admin/actions";
import type { AdminQuestionnaireDetail } from "@/lib/admin/types";
import {
  MAX_QUESTION_BLOCKS,
  MAX_QUESTIONS_PER_BLOCK,
} from "@/lib/validation/schemas";

type EditableQuestion = {
  id: string;
  text: string;
};

type EditableBlock = {
  id: string;
  title: string;
  questions: EditableQuestion[];
};

type EditorFeedback = {
  message: string;
  tone: "error" | "success";
};

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function defaultQuestion(): EditableQuestion {
  return {
    id: newId("question"),
    text: "",
  };
}

function initialBlocks(detail: AdminQuestionnaireDetail): EditableBlock[] {
  return detail.blocks
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((block) => ({
      id: block.id,
      title: block.title,
      questions: block.questions
        .slice()
        .sort((a, b) => a.blockPosition - b.blockPosition)
        .map((question) => ({
          id: question.id,
          text: question.text,
        })),
    }));
}

export function QuestionnaireEditorForm({
  detail,
  feedback,
  isLocked,
}: {
  detail: AdminQuestionnaireDetail;
  feedback?: EditorFeedback | null;
  isLocked: boolean;
}) {
  const [title, setTitle] = useState(detail.title);
  const [estimatedMinutes, setEstimatedMinutes] = useState(detail.estimatedMinutes);
  const [blocks, setBlocks] = useState(() => initialBlocks(detail));
  const [hasAcceptedLockedEdit, setHasAcceptedLockedEdit] = useState(false);
  const isEditingLockedVersion = isLocked && hasAcceptedLockedEdit;
  const isFormDisabled = isLocked && !hasAcceptedLockedEdit;
  const hasResponses = detail.totalSubmissions > 0;
  const canChangeStructure = !isFormDisabled && !hasResponses && !detail.isActive;
  const structureLockedMessage = detail.isActive
    ? " Aquesta versió és activa: només pots corregir títols i textos."
    : "";

  function confirmLockedEdit() {
    const accepted = window.confirm(
      `Aquest qüestionari ja té ${detail.diagnosticSpaceCount} espais i ${detail.totalSubmissions} respostes. Editar-lo pot canviar el formulari compartit i la interpretació dels resultats. Vols continuar?`,
    );

    if (accepted) {
      setHasAcceptedLockedEdit(true);
    }
  }

  function addBlock() {
    setBlocks((current) => [
      ...current,
      {
        id: newId("block"),
        title: "",
        questions: [defaultQuestion()],
      },
    ]);
  }

  function removeBlock(blockIndex: number) {
    setBlocks((current) => current.filter((_, index) => index !== blockIndex));
  }

  function updateBlockTitle(blockIndex: number, nextTitle: string) {
    setBlocks((current) =>
      current.map((block, index) =>
        index === blockIndex ? { ...block, title: nextTitle } : block,
      ),
    );
  }

  function addQuestion(blockIndex: number) {
    setBlocks((current) =>
      current.map((block, index) =>
        index === blockIndex && block.questions.length < MAX_QUESTIONS_PER_BLOCK
          ? {
              ...block,
              questions: [
                ...block.questions,
                defaultQuestion(),
              ],
            }
          : block,
      ),
    );
  }

  function removeQuestion(blockIndex: number, questionIndex: number) {
    setBlocks((current) =>
      current.map((block, index) =>
        index === blockIndex
          ? {
              ...block,
              questions: block.questions.filter((_, currentQuestionIndex) =>
                currentQuestionIndex !== questionIndex
              ),
            }
          : block,
      ),
    );
  }

  function updateQuestionText(
    blockIndex: number,
    questionIndex: number,
    nextText: string,
  ) {
    setBlocks((current) =>
      current.map((block, index) =>
        index === blockIndex
          ? {
              ...block,
              questions: block.questions.map((question, currentQuestionIndex) =>
                currentQuestionIndex === questionIndex
                  ? { ...question, text: nextText }
                  : question,
              ),
            }
          : block,
      ),
    );
  }

  return (
    <form action={saveQuestionnaireContentAction} className="mt-5 space-y-6">
      <input name="questionnaireId" type="hidden" value={detail.id} />
      <input
        name="confirmAssignedEdit"
        type="hidden"
        value={isEditingLockedVersion ? "yes" : "no"}
      />
      {isLocked ? (
        <div className="rounded-md border border-warning-border bg-warning-bg p-4 text-sm text-warning-text">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Aquesta versió ja té {detail.diagnosticSpaceCount} espais i{" "}
              {detail.totalSubmissions} respostes.
              {hasResponses
                ? " Pots corregir títols i textos, però no canviar l'estructura amb respostes existents."
                : `${structureLockedMessage} Accepta l'avís per editar-la.`}
            </p>
            {!hasAcceptedLockedEdit ? (
              <button
                className="rounded-md border border-warning-border bg-surface px-4 py-2 text-sm font-semibold text-warning-text hover:bg-warning-bg"
                onClick={confirmLockedEdit}
                type="button"
              >
                Editar
              </button>
            ) : (
              <span className="rounded bg-warning-bg px-2 py-1 text-xs font-semibold text-warning-text">
                Edició confirmada
              </span>
            )}
          </div>
        </div>
      ) : null}
      <label className="block text-sm font-medium text-muted">
        Títol
        <input
          className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm disabled:bg-accent-soft"
          disabled={isFormDisabled}
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          required
          value={title}
        />
      </label>
      <label className="block text-sm font-medium text-muted">
        Minuts per respondre-la
        <input
          className="mt-1 w-28 rounded-md border border-line px-3 py-2 text-sm disabled:bg-accent-soft"
          disabled={isFormDisabled}
          max={120}
          min={1}
          name="estimatedMinutes"
          onChange={(event) => setEstimatedMinutes(Number(event.target.value))}
          required
          type="number"
          value={estimatedMinutes}
        />
      </label>

      <div className="space-y-5">
        {blocks.map((block, blockIndex) => {
          const blockPosition = blockIndex + 1;

          return (
            <fieldset
              className="rounded-md border border-line p-4"
              disabled={isFormDisabled}
              key={block.id}
            >
              <input name="blockPosition" type="hidden" value={blockPosition} />
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <legend className="px-1 text-sm font-semibold text-ink">
                  Bloc {blockPosition}
                </legend>
                {canChangeStructure ? (
                  <button
                    className="rounded-md border border-danger-border px-3 py-1.5 text-xs font-semibold text-danger-text hover:bg-danger-bg"
                    onClick={() => removeBlock(blockIndex)}
                    type="button"
                  >
                    Elimina bloc
                  </button>
                ) : null}
              </div>
              <label className="block text-sm font-medium text-muted">
                Títol del bloc
                <input
                  className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm disabled:bg-accent-soft"
                  name={`block-${blockPosition}-title`}
                  onChange={(event) => updateBlockTitle(blockIndex, event.target.value)}
                  required
                  value={block.title}
                />
              </label>
              <div className="mt-4 grid gap-3">
                {block.questions.map((question, questionIndex) => {
                  const questionPosition = questionIndex + 1;

                  return (
                    <div className="grid gap-2" key={question.id}>
                      <input
                        name={`block-${blockPosition}-questionPosition`}
                        type="hidden"
                        value={questionPosition}
                      />
                      <label className="block text-sm font-medium text-muted">
                        Pregunta {blockPosition}.{questionPosition}
                        <textarea
                          className="mt-1 min-h-20 w-full rounded-md border border-line px-3 py-2 text-sm leading-6 disabled:bg-accent-soft"
                          name={`block-${blockPosition}-question-${questionPosition}`}
                          onChange={(event) =>
                            updateQuestionText(
                              blockIndex,
                              questionIndex,
                              event.target.value,
                            )
                          }
                          required
                          value={question.text}
                        />
                      </label>
                      {canChangeStructure ? (
                        <div>
                          <button
                            className="rounded-md border border-danger-border px-3 py-1.5 text-xs font-semibold text-danger-text hover:bg-danger-bg"
                            onClick={() => removeQuestion(blockIndex, questionIndex)}
                            type="button"
                          >
                            Elimina pregunta
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {canChangeStructure && block.questions.length < MAX_QUESTIONS_PER_BLOCK ? (
                <button
                  className="mt-4 rounded-md border border-action px-3 py-1.5 text-xs font-semibold text-action hover:bg-accent-soft"
                  onClick={() => addQuestion(blockIndex)}
                  type="button"
                >
                  Afegeix pregunta
                </button>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      {feedback ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-medium ${
            feedback.tone === "success"
              ? "border-success-border bg-success-bg text-success-text"
              : "border-danger-border bg-danger-bg text-danger-text"
          }`}
          id="questionnaire-editor-feedback"
        >
          {feedback.message}
        </div>
      ) : (
        <span className="sr-only" id="questionnaire-editor-feedback" />
      )}

      <div className="flex flex-wrap items-center gap-3">
        {canChangeStructure && blocks.length < MAX_QUESTION_BLOCKS ? (
          <button
            className="rounded-md border border-action px-4 py-2 text-sm font-semibold text-action hover:bg-accent-soft"
            onClick={addBlock}
            type="button"
          >
            Afegeix bloc
          </button>
        ) : null}
        <button
          className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-action-contrast hover:bg-action-hover disabled:bg-muted"
          disabled={isFormDisabled}
          type="submit"
        >
          Desa blocs i preguntes
        </button>
        {isFormDisabled ? (
          <p className="text-sm text-muted">
            Prem Editar i accepta l&apos;avís per modificar aquesta versió.
          </p>
        ) : null}
      </div>
    </form>
  );
}
