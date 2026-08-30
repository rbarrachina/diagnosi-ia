"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { SCALE_OPTIONS, type ScaleValue } from "@/lib/questionnaire/scale";
import type { PublicQuestionnaire, QuestionBlock } from "@/lib/questionnaire/types";
import {
  hasLocalSubmission,
  markLocalSubmission,
} from "@/lib/submissions/local-submission-lock";

type AnswerValue = ScaleValue;

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "submitted" }
  | { status: "error"; message: string };

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
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submittedInCurrentSession, setSubmittedInCurrentSession] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const isReadOnly = mode === "readOnly";
  const isWorkspaceAppearance = appearance === "workspace";

  const questions = useMemo(
    () => questionnaire.blocks.flatMap((block) => block.questions),
    [questionnaire.blocks],
  );

  const totalPages = questionnaire.blocks.length + 1;
  const progressPercentage =
    submitState.status === "submitted"
      ? 100
      : Math.round((currentStep / totalPages) * 100);
  const currentBlock = currentStep > 0 ? questionnaire.blocks[currentStep - 1] : null;
  const isLastBlock = currentStep === questionnaire.blocks.length;
  const submittedBeforeThisSession = useSyncExternalStore(
    () => () => undefined,
    () => {
      try {
        return hasLocalSubmission(questionnaire.publicCode, window.localStorage);
      } catch {
        return false;
      }
    },
    () => false,
  );
  const alreadySubmittedLocally =
    !isReadOnly && (submittedBeforeThisSession || submittedInCurrentSession);
  const alreadySubmitted =
    !isReadOnly && (alreadySubmittedByAccount || alreadySubmittedLocally);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [currentStep]);

  function blockIsComplete(block: QuestionBlock): boolean {
    return block.questions.every((question) => answers[question.id] !== undefined);
  }

  function goToNextStep() {
    setSubmitState({ status: "idle" });

    if (!isReadOnly && currentStep === 0 && alreadySubmitted) {
      setSubmitState({
        status: "error",
        message: "Aquest usuari ja ha respost l'enquesta.",
      });
      return;
    }

    if (!isReadOnly && currentBlock && !blockIsComplete(currentBlock)) {
      setSubmitState({
        status: "error",
        message: "Cal respondre totes les preguntes d'aquest bloc abans de continuar.",
      });
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, questionnaire.blocks.length));
  }

  async function submitAnswers() {
    if (alreadySubmitted) {
      setSubmitState({
        status: "error",
        message: "Aquest usuari ja ha respost l'enquesta.",
      });
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      setSubmitState({
        status: "error",
        message: "Cal respondre totes les preguntes abans d'enviar.",
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
            value: answers[question.id],
          })),
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorPayload?.error ?? "No s'han pogut desar les respostes.",
        );
      }

      try {
        markLocalSubmission(questionnaire.publicCode, window.localStorage);
        setSubmittedInCurrentSession(true);
      } catch {
        // If browser storage is unavailable, the anonymous submission still counts.
      }

      setSubmitState({ status: "submitted" });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error
          ? error.message
          : "No s'han pogut desar les respostes. Torna-ho a provar.",
      });
    }
  }

  if (submitState.status === "submitted") {
    return (
      <div className="questionnaire-panel p-8 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action">
          Qüestionari completat
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-ink">Gràcies</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted sm:text-base">
          Les respostes s&apos;han enregistrat correctament.
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
          isReadOnly={isReadOnly}
          onAnswer={(questionId, value) =>
            setAnswers((currentAnswers) => ({
              ...currentAnswers,
              [questionId]: value,
            }))
          }
        />
      ) : null}

      {submitState.status === "error" ? (
        <p className="mt-6 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
          {submitState.message}
        </p>
      ) : null}

      {currentStep > 0 ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-muted transition hover:border-action hover:text-action disabled:cursor-not-allowed disabled:text-muted"
            disabled={submitState.status === "submitting"}
            onClick={() => {
              setSubmitState({ status: "idle" });
              setCurrentStep((step) => Math.max(0, step - 1));
            }}
            type="button"
          >
            Anterior
          </button>

          {isReadOnly && isLastBlock ? (
            <button
              className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-muted transition hover:border-action hover:text-action"
              onClick={() => {
                setSubmitState({ status: "idle" });
                setCurrentStep(0);
              }}
              type="button"
            >
              Torna a l&apos;inici
            </button>
          ) : isLastBlock ? (
            <button
              className="rounded-xl bg-action px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_var(--app-action-shadow)] transition hover:-translate-y-0.5 hover:bg-action-hover disabled:cursor-not-allowed disabled:bg-muted"
              disabled={submitState.status === "submitting"}
              onClick={submitAnswers}
              type="button"
            >
              {submitState.status === "submitting" ? "Enviant..." : "Envia les respostes"}
            </button>
          ) : (
            <button
              className="rounded-xl bg-action px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_var(--app-action-shadow)] transition hover:-translate-y-0.5 hover:bg-action-hover"
              onClick={goToNextStep}
              type="button"
            >
              Continua
            </button>
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
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action sm:text-sm">
        {questionnaire.centreName}
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-ink sm:text-4xl">
        {isReadOnly ? "Previsualització del qüestionari" : "Qüestionari"}
      </h1>
      {isReadOnly ? (
        <p className="mt-4 rounded-md border border-info-border bg-info-bg px-4 py-3 text-sm font-semibold leading-6 text-info-text">
          Aquesta pantalla només serveix per visualitzar el qüestionari. No es
          pot respondre, no es desa cap resposta i no compta com una participació.
        </p>
      ) : null}
      <div className="mt-7 grid gap-x-8 gap-y-5 text-sm leading-6 text-muted sm:grid-cols-2 sm:text-base sm:leading-7">
        <p>
          L&apos;objectiu és conèixer el grau d&apos;ús educatiu de la IA al
          centre a partir de dades de conjunt.
        </p>
        <p>
          Les respostes són anònimes, no es recullen dades personals i no es
          mostraran respostes individuals.
        </p>
        <p>
          El formulari no demana noms, correus, comptes d&apos;usuari,
          identificadors personals ni respostes obertes.
        </p>
        <p>
          La diagnosi consta de {questionCount} preguntes obligatòries. Cada
          docent l’ha de respondre una sola vegada.
        </p>
      </div>
      <div className="mt-8 grid gap-5 border-t border-line pt-7 sm:grid-cols-2 sm:items-start">
        <dl className="space-y-2 text-sm leading-6 text-muted">
          <div className="flex items-center gap-2">
            <dt className="flex items-center gap-2 font-semibold text-ink">
              <span aria-hidden="true">📋</span>
              Versió del qüestionari:
            </dt>
            <dd>{questionnaire.questionnaireVersion}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="flex items-center gap-2 font-semibold text-ink">
              <span aria-hidden="true">⏱️</span>
              Temps estimat:
            </dt>
            <dd>{questionnaire.estimatedMinutes} minuts</dd>
          </div>
        </dl>
        <div className="flex flex-col gap-3 sm:items-end">
          {alreadySubmitted ? (
            <p
              className="max-w-md text-sm font-semibold leading-5 text-warning-text sm:text-right"
              role="status"
            >
              <span aria-hidden="true">✅</span>{" "}
              Aquest usuari ja ha respost l&apos;enquesta i no la pot tornar a fer.
            </p>
          ) : null}
          <button
            className="rounded-xl bg-action px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_var(--app-action-shadow)] transition hover:-translate-y-0.5 hover:bg-action-hover disabled:cursor-not-allowed disabled:bg-muted"
            disabled={alreadySubmitted}
            onClick={onStart}
            type="button"
          >
            {isReadOnly ? "Veure blocs" : "Comença el qüestionari"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockPage({
  answers,
  block,
  isReadOnly,
  onAnswer,
}: {
  answers: Record<string, AnswerValue>;
  block: QuestionBlock;
  isReadOnly: boolean;
  onAnswer: (questionId: string, value: AnswerValue) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action sm:text-sm">
        Bloc {block.position}
      </p>
      <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-ink sm:text-3xl">
        {block.title}
      </h2>

      <div className="mt-8 space-y-8">
        {block.questions.map((question) => {
          const questionCopy = splitQuestionCopy(question.text);
          const questionNumber = `${block.position}.${question.blockPosition}.`;

          return (
          <fieldset className="questionnaire-question" key={question.id}>
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
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {SCALE_OPTIONS.map((option) => (
                isReadOnly ? (
                  <div
                    className={`flex min-h-14 items-center rounded-xl border px-4 py-3 text-sm text-ink ${option.formClasses}`}
                    key={option.value}
                  >
                    {option.label}
                  </div>
                ) : (
                  <label
                    className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm text-ink transition ${option.formClasses}`}
                    key={option.value}
                  >
                    <input
                      checked={answers[question.id] === option.value}
                      className={`h-4 w-4 ${option.accentClass}`}
                      name={question.id}
                      onChange={() => onAnswer(question.id, option.value)}
                      type="radio"
                      value={option.value}
                    />
                    <span>{option.label}</span>
                  </label>
                )
              ))}
            </div>
          </fieldset>
          );
        })}
      </div>
    </div>
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
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-xs font-semibold text-muted">
        <span>Progrés</span>
        <span>{percentage}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-accent-soft shadow-inner">
        <div
          className="h-full rounded-full bg-action transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
