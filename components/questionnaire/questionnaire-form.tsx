"use client";

import { InterfaceText, useInterfaceTranslator } from "@/components/i18n/interface-text";

import { useEffect, useMemo, useRef, useState } from "react";
import { SCALE_OPTIONS } from "@/lib/questionnaire/scale";
import type {
  PublicQuestionnaire,
  QuestionBlock,
  QuestionOption,
} from "@/lib/questionnaire/types";

type AnswerValue = string;

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "submitted" }
  | { status: "error"; message: string; reauthenticate?: boolean };

type QuestionnaireFormProps = {
  alreadySubmitted?: boolean;
  appearance?: "default" | "workspace";
  questionnaire: PublicQuestionnaire;
  mode?: "response" | "readOnly";
};

export function QuestionnaireForm({
  alreadySubmitted: alreadySubmittedByAccount = false,
  appearance = "default",
  questionnaire,
  mode = "response",
}: QuestionnaireFormProps) {
  const t = useInterfaceTranslator();
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [missingQuestionIds, setMissingQuestionIds] = useState<string[]>([]);
  const isReadOnly = mode === "readOnly";
  const isWorkspaceAppearance = appearance === "workspace";

  const questions = useMemo(
    () => questionnaire.blocks.flatMap((block) => block.questions),
    [questionnaire.blocks],
  );
  const [optionOrder, setOptionOrder] = useState<Record<string, QuestionOption[]>>(
    () => orderedOptionsFor(questions),
  );
  const hasPreparedOptionOrder = useRef(false);
  const submissionSaved = useRef(false);

  const totalPages = questionnaire.blocks.length + 1;
  const progressPercentage =
    submitState.status === "submitted"
      ? 100
      : Math.round((currentStep / totalPages) * 100);
  const currentBlock = currentStep > 0 ? questionnaire.blocks[currentStep - 1] : null;
  const isLastBlock = currentStep === questionnaire.blocks.length;
  const alreadySubmitted = !isReadOnly && alreadySubmittedByAccount;
  const hasPendingAnswers =
    !isReadOnly &&
    submitState.status !== "submitted" &&
    Object.keys(answers).length > 0;

  useEffect(() => {
    if (!hasPendingAnswers) return;

    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (submissionSaved.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasPendingAnswers]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (currentStep > 0 || submitState.status === "submitted") {
      document.getElementById("questionnaire-step-heading")?.focus();
    }
  }, [currentStep, submitState.status]);

  function focusQuestion(questionId: string) {
    window.requestAnimationFrame(() => {
      document.getElementById(`question-${questionId}-option`)?.focus();
    });
  }

  function blockIsComplete(block: QuestionBlock): boolean {
    return block.questions.every((question) => answers[question.id] !== undefined);
  }

  function goToNextStep() {
    setSubmitState({ status: "idle" });

    if (!isReadOnly && currentStep === 0 && alreadySubmitted) {
      setSubmitState({
        status: "error",
        message: t("aquestUsuariJaHaRespostLEnquesta"),
      });
      return;
    }

    if (!isReadOnly && currentStep === 0 && !hasPreparedOptionOrder.current) {
      setOptionOrder(randomizedOptionsFor(questions));
      hasPreparedOptionOrder.current = true;
    }

    if (!isReadOnly && currentBlock && !blockIsComplete(currentBlock)) {
      const missingIds = currentBlock.questions
        .filter((question) => answers[question.id] === undefined)
        .map((question) => question.id);
      setMissingQuestionIds(missingIds);
      if (missingIds[0]) focusQuestion(missingIds[0]);
      setSubmitState({
        status: "error",
        message: t("faltenRespostesEnAquestBlocRevisaLesPreguntesIndicades"),
      });
      return;
    }

    setMissingQuestionIds([]);
    setCurrentStep((step) => Math.min(step + 1, questionnaire.blocks.length));
  }

  async function submitAnswers() {
    if (alreadySubmitted) {
      setSubmitState({
        status: "error",
        message: t("aquestUsuariJaHaRespostLEnquesta"),
      });
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      const missingIds = questions
        .filter((question) => answers[question.id] === undefined)
        .map((question) => question.id);
      const firstMissing = missingIds[0];
      const targetBlockIndex = questionnaire.blocks.findIndex((block) =>
        block.questions.some((question) => question.id === firstMissing),
      );
      setMissingQuestionIds(missingIds);
      if (targetBlockIndex >= 0) setCurrentStep(targetBlockIndex + 1);
      if (firstMissing) focusQuestion(firstMissing);
      setSubmitState({
        status: "error",
        message: t("faltenRespostesRevisaLesPreguntesIndicadesAbansDEnviar"),
      });
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicCode: questionnaire.publicCode,
          questionnaireVersion: questionnaire.questionnaireVersion,
          answers: questions.map((question) => ({
            questionId: question.id,
            optionId: answers[question.id],
          })),
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (response.status === 401) {
          setSubmitState({
            status: "error",
            message: t("laSessioHaCaducatTornaAIniciarSessioEnUnaPestanya"),
            reauthenticate: true,
          });
          return;
        }
        throw new Error(
          errorPayload?.error ?? t("noSHanPogutDesarLesRespostes"),
        );
      }

      submissionSaved.current = true;
      // Reload server-rendered results after saving, without reusing prefetched data.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/docent/resultats/${questionnaire.publicCode}`);
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error
          ? error.message
          : t("noSHanPogutDesarLesRespostesTornaHoAProvar"),
      });
    }
  }

  if (submitState.status === "submitted") {
    return (
      <div className="questionnaire-panel p-8 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action">
          <InterfaceText messageKey="questionariCompletat" />
        </p>
        <h1
          className="mt-4 text-3xl font-bold tracking-[-0.035em] text-ink"
          id="questionnaire-step-heading"
          tabIndex={-1}
        ><InterfaceText messageKey="gracies" /></h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted sm:text-base">
          <InterfaceText messageKey="lesRespostesSHanEnregistratCorrectament" />
        </p>
        <ProgressBar percentage={progressPercentage} />
      </div>
    );
  }

  return (
    <section
      className={
        isWorkspaceAppearance
          ? "border-y border-line py-6 sm:py-8"
          : "questionnaire-panel p-6 sm:p-8 lg:p-10"
      }
    >
      {currentStep === 0 ? (
        <IntroPage
          alreadySubmitted={alreadySubmitted}
          isReadOnly={isReadOnly}
          onStart={goToNextStep}
          questionCount={questions.length}
          questionnaire={questionnaire}
        />
      ) : currentBlock ? (
        <BlockPage
          answers={answers}
          block={currentBlock}
          missingQuestionIds={missingQuestionIds}
          optionOrder={optionOrder}
          isReadOnly={isReadOnly}
          onAnswer={(questionId, value) => {
            setAnswers((currentAnswers) => ({
              ...currentAnswers,
              [questionId]: value,
            }));
            if (missingQuestionIds.includes(questionId)) {
              const remaining = missingQuestionIds.filter((id) => id !== questionId);
              setMissingQuestionIds(remaining);
              if (remaining.length === 0) setSubmitState({ status: "idle" });
            }
          }}
        />
      ) : null}

      {submitState.status === "error" ? (
        <div
          className="mt-6 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text"
          role="alert"
        >
          {submitState.message}
          {missingQuestionIds.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1">
              {missingQuestionIds.map((questionId) => {
                const question = questions.find((item) => item.id === questionId);
                const block = questionnaire.blocks.find((item) =>
                  item.questions.some((itemQuestion) => itemQuestion.id === questionId),
                );
                if (!question || !block) return null;
                const questionCopy = splitQuestionCopy(question.text);
                return (
                  <li key={questionId}>
                    <button
                      className="text-left font-semibold underline underline-offset-2"
                      onClick={() => {
                        setCurrentStep(block.position);
                        focusQuestion(questionId);
                      }}
                      type="button"
                    >
                      <InterfaceText messageKey="pregunta" />{" "}{block.position}.{question.blockPosition}: {questionCopy.prompt}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {submitState.reauthenticate ? (
            <a
              className="ml-1 font-semibold underline underline-offset-2"
              href={`/auth/login?next=${encodeURIComponent(`/q/${questionnaire.publicCode}`)}`}
              rel="noreferrer"
              target="_blank"
            ><InterfaceText messageKey="tornaAAutenticarTe" /></a>
          ) : null}
        </div>
      ) : null}

      {currentStep > 0 ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-muted transition hover:border-action hover:text-action disabled:cursor-not-allowed disabled:text-muted"
            disabled={submitState.status === "submitting"}
            onClick={() => {
              setSubmitState({ status: "idle" });
              setMissingQuestionIds([]);
              setCurrentStep((step) => Math.max(0, step - 1));
            }}
            type="button"
          ><InterfaceText messageKey="anterior" /></button>

          {isReadOnly && isLastBlock ? (
            <button
              className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-muted transition hover:border-action hover:text-action"
              onClick={() => {
                setSubmitState({ status: "idle" });
                setCurrentStep(0);
              }}
              type="button"
            ><InterfaceText messageKey="tornaALInici" /></button>
          ) : isLastBlock ? (
            <button
              className="rounded-xl bg-action px-6 py-3 text-sm font-semibold text-action-contrast shadow-[0_12px_32px_var(--app-action-shadow)] transition hover:-translate-y-0.5 hover:bg-action-hover disabled:cursor-not-allowed disabled:bg-muted"
              disabled={submitState.status === "submitting"}
              onClick={submitAnswers}
              type="button"
            >
              {submitState.status === "submitting" ? t("enviant") : t("enviaLesRespostes")}
            </button>
          ) : (
            <button
              className="rounded-xl bg-action px-6 py-3 text-sm font-semibold text-action-contrast shadow-[0_12px_32px_var(--app-action-shadow)] transition hover:-translate-y-0.5 hover:bg-action-hover"
              onClick={goToNextStep}
              type="button"
            ><InterfaceText messageKey="continua" /></button>
          )}
        </div>
      ) : null}

      <ProgressBar percentage={progressPercentage} />
    </section>
  );
}

function IntroPage({
  alreadySubmitted,
  isReadOnly,
  onStart,
  questionCount,
  questionnaire,
}: {
  alreadySubmitted: boolean;
  isReadOnly: boolean;
  onStart: () => void;
  questionCount: number;
  questionnaire: PublicQuestionnaire;
}) {
  const t = useInterfaceTranslator();
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action sm:text-sm">
        {questionnaire.centreName}
      </p>
      <h1
        className="mt-4 text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl"
        id="questionnaire-step-heading"
        tabIndex={-1}
      >
        {isReadOnly ? t("previsualitzacioDelQuestionari") : t("questionari")}
      </h1>
      {isReadOnly ? (
        <p className="mt-4 rounded-md border border-info-border bg-info-bg px-4 py-3 text-sm font-semibold leading-6 text-info-text">
          <InterfaceText messageKey="aquestaPantallaNomesServeixPerVisualitzarElQuestionariNoEsPot" />
        </p>
      ) : null}
      <div className="mt-7 grid gap-x-8 gap-y-5 text-sm leading-6 text-muted sm:grid-cols-2 sm:text-base sm:leading-7">
        <p><InterfaceText messageKey="lObjectiuEsConeixerElGrauDUsEducatiuDeLa" /></p>
        <p><InterfaceText messageKey="noDemanemElNomElCorreuNomesEsConservaDurantLa" /></p>
        <p><InterfaceText messageKey="elCentreILAdministracioNomesPodenConsultarResultatsAgregatsNo" /></p>
        <p>
          <InterfaceText messageKey="laDiagnosiConstaDeCountPreguntesObligatoriesCadaDocentLHa" values={{ count: questionCount }} />
        </p>
      </div>
      <div className="mt-8 grid gap-5 border-t border-line pt-7 sm:grid-cols-2 sm:items-start">
        <dl className="space-y-2 text-sm leading-6 text-muted">
          <div className="flex items-center gap-2">
            <dt className="flex items-center gap-2 font-semibold text-ink">
              <span aria-hidden="true">📋</span><InterfaceText messageKey="versioDelQuestionari" /></dt>
            <dd>{questionnaire.questionnaireVersion}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="flex items-center gap-2 font-semibold text-ink">
              <span aria-hidden="true">⏱️</span><InterfaceText messageKey="tempsEstimat" /></dt>
            <dd>{questionnaire.estimatedMinutes}{" "}<InterfaceText messageKey="minuts" /></dd>
          </div>
        </dl>
        <div className="flex flex-col gap-3 sm:items-end">
          {alreadySubmitted ? (
            <p
              className="max-w-md text-sm font-semibold leading-5 text-warning-text sm:text-right"
              role="status"
            >
              <span aria-hidden="true">✅</span>{" "}<InterfaceText messageKey="aquestUsuariJaHaRespostLEnquestaINoLaPot" /></p>
          ) : null}
          <button
            className="rounded-xl bg-action px-6 py-3 text-sm font-semibold text-action-contrast shadow-[0_12px_32px_var(--app-action-shadow)] transition hover:-translate-y-0.5 hover:bg-action-hover disabled:cursor-not-allowed disabled:bg-muted"
            disabled={alreadySubmitted}
            onClick={onStart}
            type="button"
          >
            {isReadOnly ? t("veureBlocs") : t("comencaElQuestionari")}
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockPage({
  answers,
  block,
  missingQuestionIds,
  isReadOnly,
  optionOrder,
  onAnswer,
}: {
  answers: Record<string, AnswerValue>;
  block: QuestionBlock;
  missingQuestionIds: string[];
  isReadOnly: boolean;
  optionOrder: Record<string, QuestionOption[]>;
  onAnswer: (questionId: string, value: AnswerValue) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action sm:text-sm">
        <InterfaceText messageKey="bloc" />{" "}{block.position}
      </p>
      <h2
        className="mt-4 text-2xl font-bold tracking-[-0.03em] text-ink sm:text-3xl"
        id="questionnaire-step-heading"
        tabIndex={-1}
      >
        {block.title}
      </h2>

      <div className="mt-8 space-y-8">
        {block.questions.map((question) => {
          const questionCopy = splitQuestionCopy(question.text);
          const questionNumber = `${block.position}.${question.blockPosition}.`;
          const questionIsMissing = missingQuestionIds.includes(question.id);
          const errorId = `question-${question.id}-error`;

          return (
          <fieldset
            aria-describedby={questionIsMissing ? errorId : undefined}
            aria-invalid={questionIsMissing || undefined}
            className="questionnaire-question"
            key={question.id}
          >
            <legend className="w-full text-ink">
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-action sm:text-sm">
                {questionNumber}
                {questionCopy.description
                  ? ` ${questionCopy.description}`
                  : null}
              </span>
              <span className="mt-2 block text-base font-semibold leading-7 sm:text-lg">
                {questionCopy.prompt}
              </span>
            </legend>
            {questionIsMissing ? (
              <p className="mt-2 text-sm font-semibold text-danger-text" id={errorId}>
                <InterfaceText messageKey="calRespondreAquestaPregunta" />
              </p>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(optionOrder[question.id] ?? question.options).map((option, optionIndex) => {
                const scaleOption = SCALE_OPTIONS.find(
                  (candidate) => candidate.value === option.score,
                );
                const visualClasses = question.randomizeOptions
                  ? "questionnaire-random-option"
                  : scaleOption?.formClasses ?? "border-line bg-surface";
                const accentClass = question.randomizeOptions
                  ? "accent-[var(--app-action)]"
                  : scaleOption?.accentClass ?? "accent-[var(--app-action)]";

                return (
                isReadOnly ? (
                  <div
                    className={`flex min-h-14 items-center rounded-xl border px-4 py-3 text-sm text-ink ${visualClasses}`}
                    key={option.id}
                  >
                    {option.text}
                  </div>
                ) : (
                  <label
                    className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm text-ink transition ${visualClasses}`}
                    key={option.id}
                  >
                    <input
                      checked={answers[question.id] === option.id}
                      className={`h-4 w-4 ${accentClass}`}
                      id={optionIndex === 0 ? `question-${question.id}-option` : undefined}
                      name={question.id}
                      onChange={() => onAnswer(question.id, option.id)}
                      type="radio"
                      value={option.id}
                    />
                    <span>{option.text}</span>
                  </label>
                )
                );
              })}
            </div>
          </fieldset>
          );
        })}
      </div>
    </div>
  );
}

function orderedOptionsFor(
  questions: PublicQuestionnaire["blocks"][number]["questions"],
): Record<string, QuestionOption[]> {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      question.options.slice().sort((a, b) => a.score - b.score),
    ]),
  );
}

function randomizedOptionsFor(
  questions: PublicQuestionnaire["blocks"][number]["questions"],
): Record<string, QuestionOption[]> {
  return Object.fromEntries(
    questions.map((question) => {
      const options = question.options.slice().sort((a, b) => a.score - b.score);

      if (question.randomizeOptions) {
        for (let index = options.length - 1; index > 0; index -= 1) {
          const randomValue = new Uint32Array(1);
          window.crypto.getRandomValues(randomValue);
          const targetIndex = randomValue[0] % (index + 1);
          [options[index], options[targetIndex]] = [options[targetIndex], options[index]];
        }
      }

      return [question.id, options];
    }),
  );
}

function splitQuestionCopy(text: string): {
  description: string | null;
  prompt: string;
} {
  const separatorIndex = text.indexOf(":");

  if (separatorIndex <= 0) {
    return { description: null, prompt: text };
  }

  const description = text.slice(0, separatorIndex).trim();
  const prompt = text.slice(separatorIndex + 1).trim();

  if (!description || !prompt) {
    return { description: null, prompt: text };
  }

  return { description, prompt };
}

function ProgressBar({ percentage }: { percentage: number }) {
  const t = useInterfaceTranslator();
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-xs font-semibold text-muted">
        <span><InterfaceText messageKey="progres" /></span>
        <span>{percentage}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-accent-soft shadow-inner">
        <div
          aria-label={t("progresDelQuestionari")}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={percentage}
          className="h-full rounded-full bg-action transition-all"
          role="progressbar"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
