"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
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
  [key: string]: string | number;
};

function formatPercentage(value: number | null): string {
  return value === null ? "Sense dades" : `${value.toFixed(1)}%`;
}

function blockChartData(blocks: BlockResult[]) {
  return blocks.map((block) => ({
    name: `Bloc ${block.position}`,
    percentatge: block.average ?? 0,
  }));
}

function questionDistributionData(block: BlockResult) {
  return block.questions.map((question) => ({
    name: `${block.position}.${question.blockPosition}`,
    questionText: question.text,
    ...Object.fromEntries(
      ORDERED_SCALE_OPTIONS.map((option) => [
        option.shortLabel,
        question.distribution.find((bucket) => bucket.value === option.value)?.percentage ?? 0,
      ]),
    ),
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
          {option.shortLabel}
        </li>
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
    <div className="max-w-sm border border-line bg-white px-3 py-2 shadow-sm">
      <p className="text-sm font-semibold leading-5 text-ink">
        {question.name}. {question.questionText}
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {ORDERED_SCALE_OPTIONS.map((option) => (
          <li className="flex justify-between gap-4" key={option.value}>
            <span style={{ color: option.color }}>{option.label}</span>
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
  eyebrow = "Resultats de conjunt",
  results,
  isDownloading,
  managementHref,
  metadataText,
  noticeText,
  onDownloadPdf,
  title = "Diagnosi IA",
}: ResultsDashboardProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {metadataText ??
              `${results.scopeLabel ?? `Codi ${results.publicCode}`} · Qüestionari ${results.questionnaireVersion}`}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="rounded-md bg-action px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5d68] disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isDownloading}
            onClick={onDownloadPdf}
            type="button"
          >
            {isDownloading ? "Generant PDF..." : "Descarrega l'informe PDF"}
          </button>
          {managementHref ? (
            <a
              className="rounded-md bg-action px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1f5d68]"
              href={managementHref}
            >
              Torna a la gestió
            </a>
          ) : null}
        </div>
      </div>

      {noticeText ? (
        <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950">
          {noticeText}
        </div>
      ) : null}

      {results.lowResponseWarning ? (
        <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          Poques respostes: interpreta els resultats amb prudència.
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
          <div className="rounded-md border border-line bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Centres
            </p>
            <p className="mt-2 text-3xl font-semibold text-ink">
              {results.diagnosticSpaceCount}
            </p>
          </div>
        ) : null}
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Respostes
          </p>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {results.totalSubmissions}
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Percentatge global
          </p>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {formatPercentage(results.globalAverage)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Escala
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {ORDERED_SCALE_OPTIONS.map((option) => (
              <span className="mr-3 inline-flex items-center gap-1" key={option.value}>
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                {option.value} {option.shortLabel}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="text-center text-lg font-semibold text-ink">
          Percentatge per blocs
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="h-72 min-w-0">
            <ResponsiveContainer
              height="100%"
              initialDimension={CHART_INITIAL_DIMENSION}
              minWidth={0}
              width="100%"
            >
              <BarChart data={blockChartData(results.blocks)}>
                <CartesianGrid stroke="#d8dee6" strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip />
                <Bar dataKey="percentatge" fill="#256f7c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-72 min-w-0">
            <ResponsiveContainer
              height="100%"
              initialDimension={CHART_INITIAL_DIMENSION}
              minWidth={0}
              width="100%"
            >
              <RadarChart data={blockChartData(results.blocks)}>
                <PolarGrid stroke="#d8dee6" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "#334155", fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={5} />
                <Tooltip />
                <Radar
                  dataKey="percentatge"
                  fill="#256f7c"
                  fillOpacity={0.24}
                  name="Percentatge"
                  stroke="#256f7c"
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 border-t border-line pt-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
          {results.blocks.map((block) => (
            <div className="flex gap-2" key={block.position}>
              <dt className="shrink-0 font-semibold text-ink">Bloc {block.position}</dt>
              <dd>{block.title}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Interpretació breu</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">{results.interpretation}</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Fortaleses</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {results.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-md border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Marge de millora</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {results.improvementAreas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 space-y-6">
        {results.blocks.map((block) => (
          <section
            className="rounded-md border border-line bg-white p-5 shadow-sm"
            key={block.position}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-lg font-semibold text-ink">
                {block.position}. {block.title}
              </h2>
              <p className="text-sm font-semibold text-slate-700">
                Percentatge {formatPercentage(block.average)}
              </p>
            </div>

            <div className="mt-4 h-56 min-w-0">
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
                  <Tooltip content={QuestionDistributionTooltip} />
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
                <colgroup>
                  <col />
                  <col className="w-[110px]" />
                  {Array.from({ length: 4 }, (_, index) => (
                    <col className="w-[100px]" key={index} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-slate-500">
                    <th className="py-2 pr-4">Pregunta</th>
                    <th className="whitespace-nowrap py-2 pr-4">Percentatge</th>
                    {ORDERED_SCALE_OPTIONS.map((option) => (
                      <th
                        className={`whitespace-nowrap py-2 pr-4 ${option.headerClass}`}
                        key={option.value}
                      >
                        {option.shortLabel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.questions.map((question) => (
                    <tr className="border-b border-line last:border-b-0" key={question.position}>
                      <td className="py-3 pr-4 text-slate-800">
                        {block.position}.{question.blockPosition}. {question.text}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 font-semibold text-ink">
                        {formatPercentage(question.average)}
                      </td>
                      {ORDERED_SCALE_OPTIONS.map((option) => {
                        const bucket = distributionForOption(question, option.value);

                        return (
                          <td className="whitespace-nowrap py-3 pr-4 text-slate-700" key={option.value}>
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
