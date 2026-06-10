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
  XAxis,
  YAxis,
} from "recharts";
import { SCALE_OPTIONS } from "@/lib/questionnaire/scale";
import type { AggregatedResults, BlockResult } from "@/lib/results/types";

type ResultsDashboardProps = {
  results: AggregatedResults;
  isDownloading: boolean;
  managementHref?: string;
  onDownloadPdf: () => void;
};

function formatAverage(value: number | null): string {
  return value === null ? "Sense dades" : value.toFixed(2);
}

function blockChartData(blocks: BlockResult[]) {
  return blocks.map((block) => ({
    name: `Bloc ${block.position}`,
    mitjana: block.average ?? 0,
  }));
}

function questionDistributionData(block: BlockResult) {
  return block.questions.map((question) => ({
    name: `P${question.position}`,
    [SCALE_OPTIONS[0].shortLabel]: question.distribution[0]?.percentage ?? 0,
    [SCALE_OPTIONS[1].shortLabel]: question.distribution[1]?.percentage ?? 0,
    [SCALE_OPTIONS[2].shortLabel]: question.distribution[2]?.percentage ?? 0,
  }));
}

export function ResultsDashboard({
  results,
  isDownloading,
  managementHref,
  onDownloadPdf,
}: ResultsDashboardProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
            Resultats de conjunt
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink">
            Diagnosi IA
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Codi {results.publicCode} · Qüestionari {results.questionnaireVersion}
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

      {results.lowResponseWarning ? (
        <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          Poques respostes: interpreta els resultats amb prudència.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
            Mitjana global
          </p>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {formatAverage(results.globalAverage)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Escala
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {SCALE_OPTIONS.map((option) => (
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
          Mitjana per blocs
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="h-72 min-w-0">
            <ResponsiveContainer height="100%" minWidth={0} width="100%">
              <BarChart data={blockChartData(results.blocks)}>
                <CartesianGrid stroke="#d8dee6" strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 2]} />
                <Tooltip />
                <Bar dataKey="mitjana" fill="#256f7c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-72 min-w-0">
            <ResponsiveContainer height="100%" minWidth={0} width="100%">
              <RadarChart data={blockChartData(results.blocks)}>
                <PolarGrid stroke="#d8dee6" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "#334155", fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 2]} tickCount={5} />
                <Tooltip />
                <Radar
                  dataKey="mitjana"
                  fill="#256f7c"
                  fillOpacity={0.24}
                  name="Mitjana"
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
                Mitjana {formatAverage(block.average)}
              </p>
            </div>

            <div className="mt-4 h-56 min-w-0">
              <ResponsiveContainer height="100%" minWidth={0} width="100%">
                <BarChart data={questionDistributionData(block)} layout="vertical">
                  <CartesianGrid stroke="#d8dee6" strokeDasharray="3 3" />
                  <XAxis domain={[0, 100]} type="number" unit="%" />
                  <YAxis dataKey="name" type="category" width={44} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey={SCALE_OPTIONS[0].shortLabel}
                    fill={SCALE_OPTIONS[0].color}
                    stackId="answers"
                  />
                  <Bar
                    dataKey={SCALE_OPTIONS[1].shortLabel}
                    fill={SCALE_OPTIONS[1].color}
                    stackId="answers"
                  />
                  <Bar
                    dataKey={SCALE_OPTIONS[2].shortLabel}
                    fill={SCALE_OPTIONS[2].color}
                    stackId="answers"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-slate-500">
                    <th className="py-2 pr-4">Pregunta</th>
                    <th className="py-2 pr-4">Mitjana</th>
                    {SCALE_OPTIONS.map((option) => (
                      <th className={`py-2 pr-4 ${option.headerClass}`} key={option.value}>
                        {option.shortLabel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.questions.map((question) => (
                    <tr className="border-b border-line last:border-b-0" key={question.position}>
                      <td className="py-3 pr-4 text-slate-800">
                        {question.position}. {question.text}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-ink">
                        {formatAverage(question.average)}
                      </td>
                      {question.distribution.map((bucket) => (
                        <td className="py-3 pr-4 text-slate-700" key={bucket.value}>
                          {bucket.count} ({bucket.percentage.toFixed(1)}%)
                        </td>
                      ))}
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
