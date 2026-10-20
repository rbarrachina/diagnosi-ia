"use client";

import { useState } from "react";
import { InterfaceText } from "@/components/i18n/interface-text";
import type { ParticipantBlockResult } from "@/lib/participants/types";
import { getBlockStage } from "@/lib/participants/block-stage";

import { StageScale, stageForScore } from "@/components/results/stage-scale";

export function ParticipantDimensionResults({ blocks }: { blocks: ParticipantBlockResult[] }) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(() => blocks[0]?.position ?? null);
  const selectedBlock = blocks.find((block) => block.position === selectedPosition) ?? null;

  return (
    <>
      <div className="mt-6 grid scroll-mt-8 gap-4 md:grid-cols-2 xl:grid-cols-4" id="resum-per-blocs">
        {blocks.map((block) => {
          const { position, stage } = getBlockStage(block);
          return (
            <button
              aria-expanded={selectedPosition === block.position}
              className={`flex h-full min-w-0 flex-col rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                selectedPosition === block.position
                  ? "border-action bg-accent-soft shadow-md ring-2 ring-action/30"
                  : "border-line bg-surface hover:border-action hover:bg-accent-soft/50"
              }`}
              key={block.position}
              onClick={() => setSelectedPosition((current) => current === block.position ? null : block.position)}
              type="button"
            >
              <span className="mb-1 min-h-12 break-words font-semibold text-ink"><InterfaceText messageKey="dimensio" /> {block.position}. {block.title}</span>
              <span className="sr-only">
                <InterfaceText messageKey="posicioOrientativa" />: <InterfaceText messageKey={stage === "basic" ? "etapaBasica" : stage === "intermediate" ? "etapaIntermedia" : "etapaAvancada"} />, {Math.round(position)}/100
              </span>
              <div className="mt-auto">
                <StageScale score={position} stage={stage} />
              </div>
            </button>
          );
        })}
      </div>
      {selectedBlock ? (
        <section aria-live="polite" className="mx-auto mt-5 w-fit min-w-0 max-w-[min(100%,64rem)] rounded-2xl border border-action/30 bg-accent-soft p-5">
          <h2 className="w-0 min-w-full break-words font-semibold text-ink">
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
