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
  questionnaire: PublicQuestionnaire;
};

export function QuestionnaireForm({ questionnaire }: QuestionnaireFormProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [submittedInCurrentSession, setSubmittedInCurrentSession] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

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
    submittedBeforeThisSession || submittedInCurrentSession;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [currentStep]);

  function blockIsComplete(block: QuestionBlock): boolean {
    return block.questions.every((question) => answers[question.id] !== undefined);
  }

  function goToNextStep() {
    setSubmitState({ status: "idle" });

    if (currentBlock && !blockIsComplete(currentBlock)) {
      setSubmitState({
        status: "error",
        message: "Cal respondre totes les preguntes d'aquest bloc abans de continuar.",
      });
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, questionnaire.blocks.length));
  }

  async function submitAnswers() {
    if (alreadySubmittedLocally) {
      setSubmitState({
        status: "error",
        message: "Aquest navegador ja ha enviat una resposta per aquest qüestionari.",
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
      <div className="rounded-md border border-line bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-ink">Gràcies</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-700">
          Les respostes s&apos;han enregistrat correctament.
        </p>
        <ProgressBar percentage={progressPercentage} />
      </div>
    );
  }

  if (alreadySubmittedLocally) {
    return (
      <div className="rounded-md border border-line bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
          Qüestionari respost
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">
          Aquest navegador ja ha enviat una resposta
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-700">
          Per preservar l’anonimat, l’aplicació no identifica les persones. Aquest
          bloqueig només evita repetir l’enviament des del mateix navegador.
        </p>
        <ProgressBar percentage={100} />
      </div>
    );
  }

  return (
    <section className="rounded-md border border-line bg-white p-6 shadow-sm">
      {currentStep === 0 ? (
        <IntroPage questionnaire={questionnaire} />
      ) : currentBlock ? (
        <BlockPage
          answers={answers}
          block={currentBlock}
          onAnswer={(questionId, value) =>
            setAnswers((currentAnswers) => ({
              ...currentAnswers,
              [questionId]: value,
            }))
          }
        />
      ) : null}

      {submitState.status === "error" ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {submitState.message}
        </p>
      ) : null}

      <div
        className={`mt-6 flex flex-col gap-3 sm:flex-row sm:items-center ${
          currentStep === 0 ? "sm:justify-end" : "sm:justify-between"
        }`}
      >
        {currentStep > 0 ? (
          <button
            className="rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-action hover:text-action disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={submitState.status === "submitting"}
            onClick={() => {
              setSubmitState({ status: "idle" });
              setCurrentStep((step) => Math.max(0, step - 1));
            }}
            type="button"
          >
            Anterior
          </button>
        ) : null}

        {isLastBlock ? (
          <button
            className="rounded-md bg-action px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5d68] disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={submitState.status === "submitting"}
            onClick={submitAnswers}
            type="button"
          >
            {submitState.status === "submitting" ? "Enviant..." : "Envia les respostes"}
          </button>
        ) : (
          <button
            className="rounded-md bg-action px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5d68]"
            onClick={goToNextStep}
            type="button"
          >
            {currentStep === 0 ? "Comença el qüestionari" : "Continua"}
          </button>
        )}
      </div>

      <ProgressBar percentage={progressPercentage} />
    </section>
  );
}

function IntroPage({ questionnaire }: { questionnaire: PublicQuestionnaire }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
        Competència digital docent en IA
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">
        Qüestionari
      </h1>
      <div className="mt-5 grid gap-4 text-sm leading-6 text-slate-700 sm:grid-cols-2">
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
          La diagnosi consta de 20 preguntes obligatòries. Cada docent l’ha de respondre una sola vegada.
        </p>
      </div>
      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-ink">Codi</dt>
          <dd className="mt-1 font-mono text-slate-700">{questionnaire.publicCode}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">Versió del qüestionari</dt>
          <dd className="mt-1 text-slate-700">{questionnaire.questionnaireVersion}</dd>
        </div>
      </dl>
    </div>
  );
}

function BlockPage({
  answers,
  block,
  onAnswer,
}: {
  answers: Record<string, AnswerValue>;
  block: QuestionBlock;
  onAnswer: (questionId: string, value: AnswerValue) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
        Bloc {block.position}
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-ink">{block.title}</h2>

      <div className="mt-6 space-y-5">
        {block.questions.map((question) => (
          <fieldset
            className="border-t border-line pt-5 first:border-t-0 first:pt-0"
            key={question.id}
          >
            <legend className="text-sm font-semibold leading-6 text-ink">
              {question.position}. {question.text}
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {SCALE_OPTIONS.map((option) => (
                <label
                  className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm text-ink transition ${option.formClasses}`}
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
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>Progrés</span>
        <span>{percentage}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-sky-200 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
