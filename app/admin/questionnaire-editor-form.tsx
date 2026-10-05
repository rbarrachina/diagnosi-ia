"use client";

import { InterfaceText, useInterfaceTranslator } from "@/components/i18n/interface-text";

import { useState } from "react";
import { saveQuestionnaireContentAction } from "@/app/admin/actions";
import type { AdminQuestionnaireDetail } from "@/lib/admin/types";
import {
  QUESTIONNAIRE_LANGUAGE_CODES,
  QUESTIONNAIRE_LANGUAGE_LABELS,
} from "@/lib/questionnaire/languages";
import type { ScaleValue } from "@/lib/questionnaire/scale";
import {
  MAX_CRITERIA_PER_DIMENSION,
  MAX_QUESTION_BLOCKS,
  MAX_QUESTIONNAIRE_QUESTIONS,
  MAX_QUESTIONS_PER_BLOCK,
} from "@/lib/validation/schemas";

type EditableQuestion = {
  id: string;
  text: string;
  randomizeOptions: boolean;
  options: { score: ScaleValue; text: string }[];
};

type EditableCriterion = {
  id: string;
  title: string;
  questions: EditableQuestion[];
};

type EditableBlock = { id: string; title: string; criteria: EditableCriterion[] };

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
    randomizeOptions: false,
    options: ([0, 1, 2, 3] as const).map((score) => ({ score, text: "" })),
  };
}

function initialBlocks(detail: AdminQuestionnaireDetail): EditableBlock[] {
  return detail.blocks
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((block) => ({
      id: block.id,
      title: block.title,
      criteria: block.criteria.map((criterion) => ({
        id: criterion.id,
        title: criterion.title,
        questions: criterion.questions.slice().sort((a, b) => a.criterionPosition - b.criterionPosition).map((question) => ({
          id: question.id,
          text: question.text,
          randomizeOptions: question.randomizeOptions,
          options: question.options.map((option) => ({ score: option.score, text: option.text })),
        })),
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
  const t = useInterfaceTranslator();
  const [title, setTitle] = useState(detail.title);
  const [estimatedMinutes, setEstimatedMinutes] = useState(detail.estimatedMinutes);
  const [languageCode, setLanguageCode] = useState(detail.languageCode);
  const [blocks, setBlocks] = useState(() => initialBlocks(detail));
  const [hasAcceptedLockedEdit, setHasAcceptedLockedEdit] = useState(false);
  const isEditingLockedVersion = isLocked && hasAcceptedLockedEdit;
  const isFormDisabled = isLocked && !hasAcceptedLockedEdit;
  const hasResponses = detail.totalSubmissions > 0;
  const canChangeStructure = !isFormDisabled && !hasResponses && !detail.isActive;
  const structureLockedMessage = detail.isActive
    ? t("aquestaVersioEsActivaNomesPotsCorregirTitolsITextos")
    : "";
  const questionCount = blocks.reduce(
    (total, dimension) => total + dimension.criteria.reduce(
      (criteriaTotal, criterion) => criteriaTotal + criterion.questions.length,
      0,
    ),
    0,
  );

  function confirmLockedEdit() {
    const accepted = window.confirm(
      t("aquestQuestionariJaTeValue0EspaisIValue1RespostesEditarLo", { value0: detail.diagnosticSpaceCount, value1: detail.totalSubmissions }),
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
        criteria: [{ id: newId("criterion"), title: "", questions: [defaultQuestion()] }],
      },
    ]);
  }

  function addCriterion(blockIndex: number) {
    setBlocks((current) => current.map((block, index) =>
      index === blockIndex && block.criteria.length < MAX_CRITERIA_PER_DIMENSION
        ? { ...block, criteria: [...block.criteria, { id: newId("criterion"), title: "", questions: [defaultQuestion()] }] }
        : block,
    ));
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

  function removeCriterion(blockIndex: number, criterionIndex: number) {
    setBlocks((current) => current.map((block, index) => index === blockIndex
      ? { ...block, criteria: block.criteria.filter((_, itemIndex) => itemIndex !== criterionIndex) }
      : block,
    ));
  }

  function updateCriterionTitle(blockIndex: number, criterionIndex: number, title: string) {
    setBlocks((current) => current.map((block, index) => index === blockIndex
      ? { ...block, criteria: block.criteria.map((criterion, itemIndex) => itemIndex === criterionIndex ? { ...criterion, title } : criterion) }
      : block,
    ));
  }

  function addQuestion(blockIndex: number, criterionIndex: number) {
    setBlocks((current) =>
      current.map((block, index) =>
        index === blockIndex && questionCount < MAX_QUESTIONNAIRE_QUESTIONS
          ? {
              ...block,
              criteria: block.criteria.map((criterion, currentCriterionIndex) =>
                currentCriterionIndex === criterionIndex && criterion.questions.length < MAX_QUESTIONS_PER_BLOCK
                  ? { ...criterion, questions: [...criterion.questions, defaultQuestion()] }
                  : criterion,
              ),
            }
          : block,
      ),
    );
  }

  function removeQuestion(blockIndex: number, criterionIndex: number, questionIndex: number) {
    setBlocks((current) =>
      current.map((block, index) =>
        index === blockIndex
          ? {
              ...block,
              criteria: block.criteria.map((criterion, currentCriterionIndex) => currentCriterionIndex === criterionIndex
                ? { ...criterion, questions: criterion.questions.filter((_, currentQuestionIndex) => currentQuestionIndex !== questionIndex) }
                : criterion),
            }
          : block,
      ),
    );
  }

  function updateQuestionText(
    blockIndex: number,
    criterionIndex: number,
    questionIndex: number,
    nextText: string,
  ) {
    setBlocks((current) =>
      current.map((block, index) =>
        index === blockIndex
          ? {
              ...block,
              criteria: block.criteria.map((criterion, currentCriterionIndex) => currentCriterionIndex === criterionIndex
                ? { ...criterion, questions: criterion.questions.map((question, currentQuestionIndex) => currentQuestionIndex === questionIndex ? { ...question, text: nextText } : question) }
                : criterion),
            }
          : block,
      ),
    );
  }

  function updateQuestionRandomization(
    blockIndex: number,
    criterionIndex: number,
    questionIndex: number,
    randomizeOptions: boolean,
  ) {
    setBlocks((current) =>
      current.map((block, index) =>
        index === blockIndex
          ? {
              ...block,
              criteria: block.criteria.map((criterion, currentCriterionIndex) => currentCriterionIndex === criterionIndex
                ? { ...criterion, questions: criterion.questions.map((question, currentQuestionIndex) => currentQuestionIndex === questionIndex ? { ...question, randomizeOptions } : question) }
                : criterion),
            }
          : block,
      ),
    );
  }

  function updateOptionText(
    blockIndex: number,
    criterionIndex: number,
    questionIndex: number,
    score: ScaleValue,
    text: string,
  ) {
    setBlocks((current) =>
      current.map((block, index) =>
        index === blockIndex
          ? {
              ...block,
              criteria: block.criteria.map((criterion, currentCriterionIndex) => currentCriterionIndex === criterionIndex
                ? { ...criterion, questions: criterion.questions.map((question, currentQuestionIndex) => currentQuestionIndex === questionIndex
                  ? { ...question, options: question.options.map((option) => option.score === score ? { ...option, text } : option) }
                  : question) }
                : criterion),
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
              <InterfaceText messageKey="aquestaVersioJaTeSpacesEspaisIResponsesRespostes" values={{ spaces: detail.diagnosticSpaceCount, responses: detail.totalSubmissions }} />{" "}{hasResponses
                ? t("potsCorregirTitolsITextosPeroNoCanviarLEstructuraAmb")
                : t("value0AcceptaLAvisPerEditarLa", { value0: structureLockedMessage })}
            </p>
            {!hasAcceptedLockedEdit ? (
              <button
                className="rounded-md border border-warning-border bg-surface px-4 py-2 text-sm font-semibold text-warning-text hover:bg-warning-bg"
                onClick={confirmLockedEdit}
                type="button"
              ><InterfaceText messageKey="editar" /></button>
            ) : (
              <span className="rounded bg-warning-bg px-2 py-1 text-xs font-semibold text-warning-text">
                <InterfaceText messageKey="edicioConfirmada" />
              </span>
            )}
          </div>
        </div>
      ) : null}
      <label className="block text-sm font-medium text-muted"><InterfaceText messageKey="titol" />{" "}<input
          className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm disabled:bg-accent-soft"
          disabled={isFormDisabled}
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          required
          value={title}
        />
      </label>
      <label className="block text-sm font-medium text-muted">
        <InterfaceText messageKey="idiomaDelQuestionariIDelsInformes" />{" "}<select
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm disabled:bg-accent-soft sm:w-64"
          disabled={isFormDisabled || hasResponses || detail.isActive}
          name="languageCode"
          onChange={(event) =>
            setLanguageCode(event.target.value as typeof languageCode)
          }
          value={languageCode}
        >
          {QUESTIONNAIRE_LANGUAGE_CODES.map((code) => (
            <option key={code} value={code}>
              {QUESTIONNAIRE_LANGUAGE_LABELS[code]}
            </option>
          ))}
        </select>
        {(hasResponses || detail.isActive) && !isFormDisabled ? (
          <input name="languageCode" type="hidden" value={languageCode} />
        ) : null}
      </label>
      <label className="block text-sm font-medium text-muted">
        <InterfaceText messageKey="minutsPerRespondreLa" />{" "}<input
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
                  <InterfaceText messageKey="dimensio" />{" "}{blockPosition}
                </legend>
                {canChangeStructure ? (
                  <button
                    className="rounded-md border border-danger-border px-3 py-1.5 text-xs font-semibold text-danger-text hover:bg-danger-bg"
                    onClick={() => removeBlock(blockIndex)}
                    type="button"
                  ><InterfaceText messageKey="eliminaDimensio" /></button>
                ) : null}
              </div>
              <label className="block text-sm font-medium text-muted">
                <InterfaceText messageKey="titolDeLaDimensio" />{" "}<input
                  className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm disabled:bg-accent-soft"
                  name={`block-${blockPosition}-title`}
                  onChange={(event) => updateBlockTitle(blockIndex, event.target.value)}
                  required
                  value={block.title}
                />
              </label>
              <div className="mt-4 space-y-4">
                {block.criteria.map((criterion, criterionIndex) => {
                  const criterionPosition = criterionIndex + 1;
                  return <fieldset className="rounded-md border border-line p-4" disabled={isFormDisabled} key={criterion.id}>
                    <input name={`dimension-${blockPosition}-criterionPosition`} type="hidden" value={criterionPosition} />
                    <div className="flex items-center justify-between gap-3">
                      <legend className="text-sm font-semibold text-ink"><InterfaceText messageKey="criteri" /> {blockPosition}.{criterionPosition}</legend>
                      {canChangeStructure ? <button className="rounded-md border border-danger-border px-3 py-1.5 text-xs font-semibold text-danger-text" onClick={() => removeCriterion(blockIndex, criterionIndex)} type="button"><InterfaceText messageKey="eliminaCriteri" /></button> : null}
                    </div>
                    <label className="mt-2 block text-sm font-medium text-muted"><InterfaceText messageKey="titolDelCriteri" /><input className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm disabled:bg-accent-soft" name={`dimension-${blockPosition}-criterion-${criterionPosition}-title`} onChange={(event) => updateCriterionTitle(blockIndex, criterionIndex, event.target.value)} required value={criterion.title} /></label>
                    <div className="mt-4 grid gap-4">
                      {criterion.questions.map((question, questionIndex) => {
                        const questionPosition = questionIndex + 1;
                        const questionKey = `dimension-${blockPosition}-criterion-${criterionPosition}-question-${questionPosition}`;
                        return <div className="grid gap-2" key={question.id}>
                          <input name={`dimension-${blockPosition}-criterion-${criterionPosition}-questionPosition`} type="hidden" value={questionPosition} />
                          <label className="block text-sm font-medium text-muted"><InterfaceText messageKey="pregunta" /> {blockPosition}.{criterionPosition}.{questionPosition}<textarea className="mt-1 min-h-20 w-full rounded-md border border-line px-3 py-2 text-sm leading-6 disabled:bg-accent-soft" name={questionKey} onChange={(event) => updateQuestionText(blockIndex, criterionIndex, questionIndex, event.target.value)} required value={question.text} /></label>
                          <div className="grid gap-2 rounded-md border border-line bg-canvas/40 p-3 sm:grid-cols-2">{question.options.slice().sort((a, b) => a.score - b.score).map((option) => <label className="block text-xs font-medium text-muted" key={option.score}><InterfaceText messageKey="resposta" /> {option.score + 1} · {option.score} <InterfaceText messageKey="punts" /><input className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm disabled:bg-accent-soft" maxLength={300} name={`${questionKey}-option-${option.score}`} onChange={(event) => updateOptionText(blockIndex, criterionIndex, questionIndex, option.score, event.target.value)} required value={option.text} /></label>)}</div>
                          <label className="flex items-start gap-2 text-sm text-muted"><input checked={question.randomizeOptions} className="mt-0.5 h-4 w-4" disabled={!canChangeStructure} name={`${questionKey}-randomize`} onChange={(event) => updateQuestionRandomization(blockIndex, criterionIndex, questionIndex, event.target.checked)} type="checkbox" value="yes" /><InterfaceText messageKey="mostraLesRespostesEnUnOrdreAleatoriIAmbColorsNeutres" /></label>
                          {question.randomizeOptions && !canChangeStructure ? <input name={`${questionKey}-randomize`} type="hidden" value="yes" /> : null}
                          {canChangeStructure ? <button className="w-fit rounded-md border border-danger-border px-3 py-1.5 text-xs font-semibold text-danger-text" onClick={() => removeQuestion(blockIndex, criterionIndex, questionIndex)} type="button"><InterfaceText messageKey="eliminaPregunta" /></button> : null}
                        </div>;
                      })}
                    </div>
                    {canChangeStructure && criterion.questions.length < MAX_QUESTIONS_PER_BLOCK && questionCount < MAX_QUESTIONNAIRE_QUESTIONS ? <button className="mt-4 rounded-md border border-action px-3 py-1.5 text-xs font-semibold text-action" onClick={() => addQuestion(blockIndex, criterionIndex)} type="button"><InterfaceText messageKey="afegeixPregunta" /></button> : null}
                  </fieldset>;
                })}
              </div>
              {canChangeStructure && block.criteria.length < MAX_CRITERIA_PER_DIMENSION && questionCount < MAX_QUESTIONNAIRE_QUESTIONS ? <button className="mt-4 rounded-md border border-action px-3 py-1.5 text-xs font-semibold text-action" onClick={() => addCriterion(blockIndex)} type="button"><InterfaceText messageKey="afegeixCriteri" /></button> : null}
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
        {canChangeStructure && blocks.length < MAX_QUESTION_BLOCKS && questionCount < MAX_QUESTIONNAIRE_QUESTIONS ? (
          <button
            className="rounded-md border border-action px-4 py-2 text-sm font-semibold text-action hover:bg-accent-soft"
            onClick={addBlock}
            type="button"
          ><InterfaceText messageKey="afegeixDimensio" /></button>
        ) : null}
        <button
          className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-action-contrast hover:bg-action-hover disabled:bg-muted"
          disabled={isFormDisabled}
          type="submit"
        ><InterfaceText messageKey="desaDimensionsCriterisIPreguntes" /></button>
        {isFormDisabled ? (
          <p className="text-sm text-muted">
            <InterfaceText messageKey="premEditarIAcceptaLAvisPerModificarAquestaVersio" />
          </p>
        ) : null}
      </div>
    </form>
  );
}
