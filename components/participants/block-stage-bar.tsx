import { InterfaceText } from "@/components/i18n/interface-text";
import { getBlockStage, type BlockStage } from "@/lib/participants/block-stage";
import type { ParticipantBlockResult } from "@/lib/participants/types";

const stages: { id: BlockStage; label: "etapaBasica" | "etapaIntermedia" | "etapaAvancada" }[] = [
  { id: "basic", label: "etapaBasica" },
  { id: "intermediate", label: "etapaIntermedia" },
  { id: "advanced", label: "etapaAvancada" },
];

export function BlockStageBar({ block }: { block: ParticipantBlockResult }) {
  const { position, stage } = getBlockStage(block);
  const activeLabel = stages.find((item) => item.id === stage)!.label;

  return (
    <a className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition hover:border-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" href={`#bloc-${block.position}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-semibold text-ink">{block.position}. {block.title}</h3>
        <span className="text-sm font-semibold text-action"><InterfaceText messageKey={activeLabel} /> · {Math.round(position)}/100</span>
      </div>
      <div className="mt-auto grid grid-cols-3 pt-5 text-center text-xs sm:text-sm">
        {stages.map((item) => (
          <span className={item.id === stage ? "font-bold text-ink" : "text-muted"} key={item.id}>
            <InterfaceText messageKey={item.label} />
          </span>
        ))}
      </div>
      <div className="relative mx-2 mt-3 pb-3" aria-hidden="true">
        <div className="h-4 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500" />
        <span className="absolute top-3 h-0 w-0 -translate-x-1/2 border-x-[9px] border-b-[13px] border-x-transparent border-b-ink" style={{ left: `${position}%` }} />
      </div>
    </a>
  );
}
