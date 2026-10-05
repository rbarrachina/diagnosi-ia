"use client";

import { useState } from "react";
import { InterfaceText } from "@/components/i18n/interface-text";
import type { ParticipantBlockResult } from "@/lib/participants/types";
import { getBlockStage } from "@/lib/participants/block-stage";

const stages = [
  { id: "basic", label: "etapaBasica" },
  { id: "intermediate", label: "etapaIntermedia" },
  { id: "advanced", label: "etapaAvancada" },
] as const;

type StageId = (typeof stages)[number]["id"];

function stageForScore(score: number): StageId {
  if (score < 100 / 3) return "basic";
  if (score < 200 / 3) return "intermediate";
  return "advanced";
}

function StageScale({ score, stage }: { score: number; stage: StageId }) {
  return (
    <>
      <div aria-hidden="true" className="grid grid-cols-3 pt-5 text-center text-xs sm:text-sm">
        {stages.map((item) => (
          <span className={item.id === stage ? "font-bold text-ink" : "text-muted"} key={item.id}>
            <InterfaceText messageKey={item.label} />
          </span>
        ))}
      </div>
      <div aria-hidden="true" className="relative mx-2 mt-3 pb-3">
        <div className="participant-stage-gradient h-4 rounded-full" />
        <span
          className="absolute top-3 h-0 w-0 -translate-x-1/2 border-x-[9px] border-b-[13px] border-x-transparent border-b-ink"
          style={{ left: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
    </>
  );
}

export function ParticipantDimensionResults({ blocks }: { blocks: ParticipantBlockResult[] }) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const selectedBlock = blocks.find((block) => block.position === selectedPosition) ?? null;

  return (
    <>
      <div className="mt-6 grid scroll-mt-8 gap-4 md:grid-cols-2 lg:grid-cols-3" id="resum-per-blocs">
        {blocks.map((block) => {
          const { position, stage } = getBlockStage(block);
          return (
            <button
              aria-pressed={selectedPosition === block.position}
              className={`flex h-full flex-col rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                selectedPosition === block.position
                  ? "border-action bg-accent-soft shadow-md ring-2 ring-action/30"
                  : "border-line bg-surface hover:border-action"
              }`}
              key={block.position}
              onClick={() => setSelectedPosition((current) => current === block.position ? null : block.position)}
              type="button"
            >
              <span className="font-semibold text-ink"><InterfaceText messageKey="dimensio" /> {block.position}. {block.title}</span>
              <span className="sr-only">
                <InterfaceText messageKey="posicioOrientativa" />: <InterfaceText messageKey={stages.find((item) => item.id === stage)!.label} />, {Math.round(position)}/100
              </span>
              <StageScale score={position} stage={stage} />
            </button>
          );
        })}
      </div>
      {selectedBlock ? (
        <section aria-live="polite" className="mt-5 rounded-2xl border border-action/30 bg-accent-soft/50 p-5">
          <h2 className="font-semibold text-ink">
            <InterfaceText messageKey="dimensio" /> {selectedBlock.position}. {selectedBlock.title} · <InterfaceText messageKey="criteris" />
          </h2>
          <div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-3">
            {[...new Map(selectedBlock.questions.map((question) => [question.criterionPosition, question])).values()].map((question) => {
              const criterionQuestions = selectedBlock.questions.filter(
                (item) => item.criterionPosition === question.criterionPosition,
              );
              const score = criterionQuestions.length === 0
                ? 0
                : criterionQuestions.reduce((total, item) => total + item.value, 0) / (criterionQuestions.length * 3) * 100;
              const stage = stageForScore(score);
              return (
                <article
                  className="w-72 shrink-0 snap-start rounded-xl border border-line bg-surface p-4"
                  key={question.criterionPosition}
                >
                  <h3 className="min-h-12 text-sm font-semibold text-ink">
                    <InterfaceText messageKey="criteri" /> {selectedBlock.position}.{question.criterionPosition} · {question.criterionTitle}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-muted">{score.toFixed(1)}%</p>
                  <StageScale score={score} stage={stage} />
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
