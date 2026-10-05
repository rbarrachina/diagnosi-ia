"use client";
import type { InterfaceTranslator } from "@/lib/i18n/interface-messages";

import { InterfaceText, useInterfaceTranslator } from "@/components/i18n/interface-text";

import { useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import { SCALE_OPTIONS } from "@/lib/questionnaire/scale";
import type {
  AggregatedResults,
  BlockResult,
  DistributionBucket,
  QuestionResult,
} from "@/lib/results/types";

const ORDERED_SCALE_OPTIONS = [...SCALE_OPTIONS].sort(
  (a, b) => a.value - b.value,
);

// Recharts starts its responsive containers at -1 × -1 while waiting for the
// first ResizeObserver measurement. Supplying a valid initial size prevents
// that transient state from producing a development-console warning.
const CHART_INITIAL_DIMENSION = { height: 1, width: 1 } as const;

type ResultsDashboardProps = {
  integrated?: boolean;
  introContent?: ReactNode;
  results: AggregatedResults;
  eyebrow?: string;
  isDownloading: boolean;
  managementHref?: string;
  metadataText?: string;
  noticeText?: string;
  onDownloadPdf: () => void;
  title?: string;
};

type QuestionDistributionChartDatum = {
  name: string;
  questionText: string;
  optionLabels: Record<number, string>;
  [key: string]: string | number | Record<number, string>;
};

function formatPercentage(value: number | null, t: InterfaceTranslator): string {
  return value === null ? t("senseDades") : `${value.toFixed(1)}%`;
}

function blockChartData(blocks: BlockResult[]) {
  return blocks.map((block) => ({
    name: block.title,
    percentatge: block.average ?? 0,
    position: block.position,
  }));
}

function wrapTickLabel(label: string, maxLength: number): string[] {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function WrappedDimensionTick({ payload, x, y, textAnchor, fill, maxLength, fontSize, centerVertically = false }: {
  payload: { value?: unknown };
  x: number | string;
  y: number | string;
  textAnchor: "start" | "middle" | "end" | "inherit";
  fill?: string;
  maxLength: number;
  fontSize?: number;
  centerVertically?: boolean;
}) {
  const lines = wrapTickLabel(String(payload.value ?? ""), maxLength);
  const lineHeight = 11;
  const firstLineOffset = centerVertically ? -((lines.length - 1) * lineHeight) / 2 : 0;

  return (
    <text
      fill={fill ?? "#475569"}
      fontSize={fontSize ?? 11}
      textAnchor={textAnchor}
      x={x}
      y={y}
    >
      {lines.map((line, index) => (
        <tspan dy={index === 0 ? firstLineOffset : lineHeight} key={index} x={x}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function criterionChartData(position: number, average: number | null, t: InterfaceTranslator) {
  return [{
    name: t("criteri"),
    percentatge: average ?? 0,
    position,
  }];
}

function blockStageLabel(value: number, t: InterfaceTranslator): string {
  if (value < 100 / 3) return t("etapaBasica");
  if (value < 200 / 3) return t("etapaIntermedia");
  return t("etapaAvancada");
}

function blockStageFill(value: number): string {
  if (value < 100 / 3) return "#fca5a5";
  if (value < 200 / 3) return "#fde68a";
  return "#86efac";
}

function blockStageTextClass(value: number | null): string {
  if (value === null) return "text-muted";
  if (value < 100 / 3) return "text-red-700 dark:text-red-300";
  if (value < 200 / 3) return "text-amber-700 dark:text-amber-300";
  return "text-green-700 dark:text-green-300";
}

function questionDistributionData(block: BlockResult) {
  return block.questions.map((question) => ({
    name: `${block.position}.${question.blockPosition}`,
    questionText: question.text,
    optionLabels: Object.fromEntries(
      question.distribution.map((bucket) => [bucket.value, bucket.label]),
    ),
    ...Object.fromEntries(
      ORDERED_SCALE_OPTIONS.map((option) => [
        option.shortLabel,
        question.distribution.find((bucket) => bucket.value === option.value)?.percentage ?? 0,
      ]),
    ),
  }));
}

function blockScoreDistributionData(block: BlockResult) {
  return block.scoreDistribution.map((bucket) => ({
    position: bucket.startPercentage + 100 / 18,
    range: `${bucket.startPercentage.toFixed(1)}–${(bucket.startPercentage + 100 / 9).toFixed(1)}%`,
    count: bucket.count,
  }));
}

function formatTooltipPercentage(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function distributionForOption(
  question: QuestionResult,
  value: DistributionBucket["value"],
) {
  return (
    question.distribution.find((bucket) => bucket.value === value) ?? {
      count: 0,
      label: "",
      percentage: 0,
      value,
    }
  );
}

function OrderedScaleLegend() {
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2 text-sm">
      {ORDERED_SCALE_OPTIONS.map((option) => (
        <li
          className="inline-flex items-center gap-1.5"
          key={option.value}
          style={{ color: option.color }}
        >
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5"
            style={{ backgroundColor: option.color }}
          />
          {option.value}{" "}<InterfaceText messageKey="punts" /></li>
      ))}
    </ul>
  );
}

function QuestionDistributionTooltip({
  active,
  payload,
}: TooltipContentProps) {
  const question = payload[0]?.payload as QuestionDistributionChartDatum | undefined;

  if (!active || !question) {
    return null;
  }

  return (
    <div
      className="relative z-50 max-w-sm border border-line px-3 py-2 shadow-lg"
      style={{
        backgroundColor: "var(--app-surface-strong, var(--color-surface))",
        opacity: 1,
      }}
    >
      <p className="text-sm font-semibold leading-5 text-ink">
        {question.name}. {question.questionText}
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {ORDERED_SCALE_OPTIONS.map((option) => (
          <li className="flex justify-between gap-4" key={option.value}>
            <span style={{ color: option.color }}>
              {option.value} · {question.optionLabels[option.value]}
            </span>
            <span className="font-semibold text-ink">
              {formatTooltipPercentage(Number(question[option.shortLabel] ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ResultsDashboard({
  integrated = false,
  introContent,
  eyebrow,
  results,
  isDownloading,
  managementHref,
  metadataText,
  noticeText,
  onDownloadPdf,
  title = "Diagnosi IA",
}: ResultsDashboardProps) {
  const t = useInterfaceTranslator();
  const [selectedBlockPosition, setSelectedBlockPosition] = useState<number | null>(null);
  const selectedBlock = results.blocks.find(
    (block) => block.position === selectedBlockPosition,
  ) ?? null;

  function selectBlock(position: number) {
    setSelectedBlockPosition((current) => current === position ? null : position);
  }

  return (
    <section
      className={`mx-auto w-full max-w-6xl ${
        integrated ? "px-0 py-0" : "px-6 py-10"
      }`}
    >
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
            {eyebrow ?? t("resultatsDeConjunt")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {metadataText ??
              t("scopeQuestionariVersion", { scope: results.scopeLabel ?? t("codiCode", { code: results.publicCode }), version: results.questionnaireVersion })}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="rounded-md bg-action px-4 py-3 text-sm font-semibold text-action-contrast transition hover:bg-action-hover disabled:cursor-not-allowed disabled:bg-muted"
            disabled={isDownloading}
            onClick={onDownloadPdf}
            type="button"
          >
            {isDownloading ? t("generantPdf") : t("descarregaLInformePdf")}
          </button>
          {managementHref ? (
            <a
              className="rounded-md bg-action px-4 py-3 text-center text-sm font-semibold text-action-contrast transition hover:bg-action-hover"
              href={managementHref}
            ><InterfaceText messageKey="tornaALaGestio" /></a>
          ) : null}
        </div>
      </div>

      {introContent}

      {noticeText ? (
        <div className="mt-6 rounded-md border border-info-border bg-info-bg px-4 py-3 text-sm leading-6 text-info-text">
          {noticeText}
        </div>
      ) : null}

      {results.lowResponseWarning ? (
        <div className="mt-6 rounded-md border border-warning-border bg-warning-bg px-4 py-3 text-sm leading-6 text-warning-text">
          <InterfaceText messageKey="poquesRespostesInterpretaElsResultatsAmbPrudencia" />
        </div>
      ) : null}

      <div
        className={`mt-6 grid gap-4 ${
          results.diagnosticSpaceCount === undefined
            ? "sm:grid-cols-3"
            : "sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {results.diagnosticSpaceCount !== undefined ? (
          <div className="rounded-md border border-line bg-surface p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              <InterfaceText messageKey="centres" />
            </p>
            <p className="mt-2 text-3xl font-semibold text-ink">
              {results.diagnosticSpaceCount}
            </p>
          </div>
        ) : null}
        <div className="rounded-md border border-line bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            <InterfaceText messageKey="respostes" />
          </p>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {results.totalSubmissions}
          </p>
        </div>
        <div className="rounded-md border border-line bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            <InterfaceText messageKey="cdDocentEnIa" />
          </p>
          <p className={`mt-2 text-3xl font-bold ${blockStageTextClass(results.globalAverage)}`}>
            {results.globalAverage === null
              ? t("senseDades")
              : blockStageLabel(results.globalAverage, t)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-surface p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            <InterfaceText messageKey="escala" />
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {ORDERED_SCALE_OPTIONS.map((option) => (
              <span className="mr-3 inline-flex items-center gap-1" key={option.value}>
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                {option.value}{" "}<InterfaceText messageKey="punts" /></span>
            ))}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-center text-lg font-semibold text-ink">
          <InterfaceText messageKey="percentatgePerBlocs" />
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div aria-hidden="true" className="h-72 min-w-0">
            <ResponsiveContainer
              height="100%"
              initialDimension={CHART_INITIAL_DIMENSION}
              minWidth={0}
              width="100%"
            >
              <BarChart
                accessibilityLayer={false}
                data={blockChartData(results.blocks)}
              >
                <defs>
                  <linearGradient id="blockBarGradient" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="42%" stopColor="#facc15" />
                    <stop offset="58%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <ReferenceArea
                  y1={0}
                  y2={100}
                  fill="url(#blockBarGradient)"
                  fillOpacity={0.65}
                  stroke="none"
                />
                <CartesianGrid vertical={false} stroke="#d8dee6" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  height={78}
                  interval={0}
                  tickMargin={8}
                  tick={(props) => <WrappedDimensionTick {...props} maxLength={11} fontSize={10} />}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[100 / 6, 50, 250 / 3]}
                  tickFormatter={(value: number) => blockStageLabel(value, t)}
                  tickLine={false}
                  width={110}
                />
                <ReferenceLine y={100 / 3} stroke="#94a3b8" strokeDasharray="2 4" strokeWidth={1} />
                <ReferenceLine y={200 / 3} stroke="#94a3b8" strokeDasharray="2 4" strokeWidth={1} />
                <Bar
                  activeBar={false}
                  barSize={44}
                  dataKey="percentatge"
                  fill="transparent"
                  onClick={(_entry, index) => {
                    const block = results.blocks[index];
                    if (block) selectBlock(block.position);
                  }}
                  radius={[4, 4, 0, 0]}
                >
                  {results.blocks.map((block) => (
                    <Cell
                      key={block.position}
                      cursor="pointer"
                      fill={selectedBlockPosition === block.position
                        ? "var(--app-action)"
                        : blockStageFill(block.average ?? 0)}
                      fillOpacity={selectedBlockPosition === block.position ? 0.9 : 0.3}
                      stroke={selectedBlockPosition === block.position
                        ? "var(--app-action-hover)"
                        : "#111827"}
                      strokeWidth={selectedBlockPosition === block.position ? 3 : 2}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div aria-hidden="true" className="h-72 min-w-0">
            <ResponsiveContainer
              height="100%"
              initialDimension={CHART_INITIAL_DIMENSION}
              minWidth={0}
              width="100%"
            >
              <RadarChart
                data={blockChartData(results.blocks)}
                margin={{ top: 28, right: 72, bottom: 28, left: 72 }}
              >
                <defs>
                  <radialGradient id="blockRadarGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="48%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </radialGradient>
                </defs>
                <PolarGrid
                  fill="url(#blockRadarGradient)"
                  fillOpacity={0.68}
                  stroke="#d8dee6"
                />
                <PolarAngleAxis
                  dataKey="name"
                  tick={(props) => <WrappedDimensionTick {...props} maxLength={18} fontSize={11} centerVertically />}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} tickLine={false} axisLine={false} />
                <Radar
                  activeDot={false}
                  dataKey="percentatge"
                  fill="transparent"
                  fillOpacity={0}
                  name={t("percentatge")}
                  stroke="#111827"
                  strokeWidth={3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-5 grid gap-3 border-t border-line pt-4 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
          {results.blocks.map((block) => (
            <button
              aria-pressed={selectedBlockPosition === block.position}
              className={`flex gap-2 rounded-md border px-2 py-1 text-left transition ${
                selectedBlockPosition === block.position
                  ? "border-action bg-info-bg text-info-text"
                  : "border-transparent hover:bg-accent-soft"
              }`}
              key={block.position}
              onClick={() => selectBlock(block.position)}
              type="button"
            >
              <span className="shrink-0 font-semibold text-ink">
                <InterfaceText messageKey="dimensio" />{" "}{block.position}
              </span>
              <span>{block.title}</span>
            </button>
          ))}
        </div>
        {selectedBlock ? (
          <section aria-live="polite" className="mt-5 border-t border-line pt-4">
            <h3 className="text-base font-semibold text-ink">
              <InterfaceText messageKey="dimensio" />{" "}{selectedBlock.position} · {selectedBlock.title} — <InterfaceText messageKey="criteris" />
            </h3>
            <div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-3">
              {selectedBlock.criteria.map((criterion) => (
                <article
                  className="w-72 shrink-0 snap-start rounded-md border border-info-border bg-info-bg/40 p-4"
                  key={criterion.position}
                >
                  <h4 className="min-h-12 text-sm font-semibold text-ink">
                    <InterfaceText messageKey="criteri" /> {selectedBlock.position}.{criterion.position} · {criterion.title}
                  </h4>
                  <p className={`mt-2 text-sm font-semibold ${blockStageTextClass(criterion.average)}`}>
                    <InterfaceText messageKey="percentatge" />{" "}{formatPercentage(criterion.average, t)}
                  </p>
                  <div aria-hidden="true" className="mt-3 h-52 min-w-0">
                    <ResponsiveContainer
                      height="100%"
                      initialDimension={CHART_INITIAL_DIMENSION}
                      minWidth={0}
                      width="100%"
                    >
                      <BarChart data={criterionChartData(criterion.position, criterion.average, t)}>
                        <CartesianGrid vertical={false} stroke="#d8dee6" strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={false} tickLine={false} />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[100 / 6, 50, 250 / 3]}
                          tickFormatter={(value: number) => blockStageLabel(value, t)}
                          tickLine={false}
                          width={88}
                        />
                        <ReferenceLine y={100 / 3} stroke="#94a3b8" strokeDasharray="2 4" strokeWidth={1} />
                        <ReferenceLine y={200 / 3} stroke="#94a3b8" strokeDasharray="2 4" strokeWidth={1} />
                        <Bar
                          activeBar={false}
                          barSize={40}
                          dataKey="percentatge"
                          fill={blockStageFill(criterion.average ?? 0)}
                          fillOpacity={0.72}
                          radius={[4, 4, 0, 0]}
                          stroke="#111827"
                          strokeWidth={2}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="mt-6 rounded-md border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink"><InterfaceText messageKey="interpretacioBreu" /></h2>
        <p className="mt-3 text-sm leading-6 text-muted">{results.interpretation}</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-line bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink"><InterfaceText messageKey="fortaleses" /></h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
            {results.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-md border border-line bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink"><InterfaceText messageKey="margeDeMillora" /></h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
            {results.improvementAreas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 space-y-6">
        {results.blocks.map((block) => (
          <section
            className="rounded-md border border-line bg-surface p-5 shadow-sm"
            key={block.position}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-lg font-semibold text-ink">
                {block.position}. {block.title}
              </h2>
              <p className="text-sm font-semibold text-muted">
                <InterfaceText messageKey="percentatge" />{" "}{formatPercentage(block.average, t)}
              </p>
            </div>

            <h3 className="mt-4 text-sm font-semibold text-ink">
              <InterfaceText messageKey="distribucioPuntuacionsPerBloc" />
            </h3>
            <div aria-hidden="true" className="mt-2 h-48 min-w-0">
              <ResponsiveContainer
                height="100%"
                initialDimension={CHART_INITIAL_DIMENSION}
                minWidth={0}
                width="100%"
              >
                <BarChart data={blockScoreDistributionData(block)} margin={{ bottom: 8 }}>
                  <defs>
                    <linearGradient
                      id={`blockScoreGradient-${block.position}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="42%" stopColor="#facc15" />
                      <stop offset="58%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                  <ReferenceArea
                    x1={0}
                    x2={100}
                    fill={`url(#blockScoreGradient-${block.position})`}
                    fillOpacity={0.68}
                    stroke="none"
                    zIndex={-100}
                  />
                  <CartesianGrid vertical={false} stroke="#d8dee6" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="position"
                    domain={[0, 100]}
                    interval={0}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value: number) => {
                      const start = Math.floor(value / (100 / 9)) * (100 / 9);
                      return `${start.toFixed(0)}–${(start + 100 / 9).toFixed(0)}`;
                    }}
                    ticks={Array.from({ length: 9 }, (_, index) => (index + 0.5) * (100 / 9))}
                    type="number"
                  />
                  <YAxis allowDecimals={false} tickLine={false} width={28} />
                  <Tooltip
                    cursor={false}
                    formatter={(value) => [value, t("docents")]}
                    labelFormatter={(_, payload) => String(payload[0]?.payload.range ?? "")}
                  />
                  <ReferenceLine x={100 / 3} stroke="#64748b" strokeDasharray="2 4" />
                  <ReferenceLine x={200 / 3} stroke="#64748b" strokeDasharray="2 4" />
                  <Bar
                    activeBar={false}
                    barSize={24}
                    dataKey="count"
                    fill="transparent"
                  >
                    {block.scoreDistribution.map((bucket) => (
                      <Cell
                        key={bucket.startPercentage}
                        fill="transparent"
                        stroke="#111827"
                        strokeWidth={2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div aria-hidden="true" className="mt-4 h-56 min-w-0">
              <ResponsiveContainer
                height="100%"
                initialDimension={CHART_INITIAL_DIMENSION}
                minWidth={0}
                width="100%"
              >
                <BarChart data={questionDistributionData(block)} layout="vertical">
                  <CartesianGrid stroke="#d8dee6" strokeDasharray="3 3" />
                  <XAxis domain={[0, 100]} type="number" unit="%" />
                  <YAxis dataKey="name" interval={0} type="category" width={44} />
                  <Tooltip
                    content={QuestionDistributionTooltip}
                    wrapperStyle={{ zIndex: 50 }}
                  />
                  <Legend content={<OrderedScaleLegend />} />
                  {ORDERED_SCALE_OPTIONS.map((option) => (
                    <Bar
                      dataKey={option.shortLabel}
                      fill={option.color}
                      key={option.value}
                      stackId="answers"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[900px] table-fixed border-collapse text-left text-sm">
                <caption className="sr-only">
                  <InterfaceText messageKey="resultatsAgregatsDelBloc" />{" "}{block.position}: {block.title}
                </caption>
                <colgroup>
                  <col />
                  <col className="w-[110px]" />
                  {Array.from({ length: 4 }, (_, index) => (
                    <col className="w-[100px]" key={index} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
                    <th className="py-2 pr-4" scope="col"><InterfaceText messageKey="pregunta" /></th>
                    <th className="whitespace-nowrap py-2 pr-4" scope="col">
                      <InterfaceText messageKey="percentatge" />
                    </th>
                    {ORDERED_SCALE_OPTIONS.map((option) => (
                      <th
                        className={`whitespace-nowrap py-2 pr-4 ${option.headerClass}`}
                        key={option.value}
                        scope="col"
                      >
                        {option.value}{" "}<InterfaceText messageKey="punts" /></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.questions.map((question) => (
                    <tr className="border-b border-line last:border-b-0" key={question.position}>
                      <td className="py-3 pr-4 text-muted">
                        {block.position}.{question.criterionPosition}.{question.criterionQuestionPosition}. {question.criterionTitle} — {question.text}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 font-semibold text-ink">
                        {formatPercentage(question.average, t)}
                      </td>
                      {ORDERED_SCALE_OPTIONS.map((option) => {
                        const bucket = distributionForOption(question, option.value);

                        return (
                          <td className="whitespace-nowrap py-3 pr-4 text-muted" key={option.value}>
                            {bucket.count} ({bucket.percentage.toFixed(1)}%)
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
