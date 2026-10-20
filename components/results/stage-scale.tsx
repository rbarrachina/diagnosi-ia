import { InterfaceText } from "@/components/i18n/interface-text";

const stages = [
  { id: "basic", label: "etapaBasica" },
  { id: "intermediate", label: "etapaIntermedia" },
  { id: "advanced", label: "etapaAvancada" },
] as const;

type StageId = (typeof stages)[number]["id"];

export function stageForScore(score: number): StageId {
  if (score <= 100 / 3) return "basic";
  if (score <= 200 / 3) return "intermediate";
  return "advanced";
}

export function StageScale({ score, stage }: { score: number; stage: StageId }) {
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

