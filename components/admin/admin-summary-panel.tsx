import Link from "next/link";

import type { AdminSummary } from "@/lib/admin/summary";

export function AdminSummaryPanel({
  minimumResponseCount,
  summary,
}: {
  minimumResponseCount: number;
  summary: AdminSummary;
}) {
  const questionnaireResultsHref = summary.activeQuestionnaire
    ? `/admin?section=results&scope=all&questionnaireId=${summary.activeQuestionnaire.id}`
    : "/admin?section=questionnaires";
  const indicators = [
    {
      href: "/admin?section=centres&filter=active",
      label: "Centres actius",
      value: summary.activeCentres,
    },
    {
      href: "/admin?section=centres&filter=suspended",
      label: "Centres suspesos",
      value: summary.suspendedCentres,
    },
    {
      href: "/admin?section=centres&filter=pending",
      label: "Pendents de configuració",
      value: summary.pendingCentres,
    },
    {
      href: "/admin?section=centres&filter=without_questionnaire",
      label: "Sense qüestionari",
      value: summary.centresWithoutQuestionnaire,
    },
    {
      href: "/admin?section=centres&filter=without_responses",
      label: "Sense respostes",
      value: summary.centresWithoutResponses,
    },
    {
      href: questionnaireResultsHref,
      label: "Respostes computables",
      value: summary.computableResponses,
    },
  ];
  const alerts = [
    summary.pendingCentres > 0
      ? {
          href: "/admin?section=centres&filter=pending",
          label: `${summary.pendingCentres} centres pendents de completar la configuració`,
        }
      : null,
    summary.activeCentresWithoutQuestionnaire > 0
      ? {
          href: "/admin?section=centres&filter=active_without_questionnaire",
          label: `${summary.activeCentresWithoutQuestionnaire} centres actius sense qüestionari`,
        }
      : null,
    summary.centresWithQuestionnaireWithoutResponses > 0
      ? {
          href: "/admin?section=centres&filter=with_questionnaire_without_responses",
          label: `${summary.centresWithQuestionnaireWithoutResponses} centres amb qüestionari però sense respostes`,
        }
      : null,
    !summary.activeQuestionnaire
      ? {
          href: "/admin?section=questionnaires",
          label: "No hi ha cap qüestionari actiu",
        }
      : null,
  ].filter((alert): alert is { href: string; label: string } => alert !== null);

  return (
    <div className="space-y-12">
      <section aria-label="Indicadors generals">
        <div className="grid max-w-5xl gap-px border-y border-line bg-line sm:grid-cols-3 xl:grid-cols-6">
          {indicators.map((indicator) => (
            <Link
              className="group relative bg-[var(--color-paper)] px-4 py-4 transition hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
              href={indicator.href}
              key={indicator.label}
            >
              <LinkIndicatorIcon />
              <p className="pr-5 text-xs font-medium leading-4 text-muted">{indicator.label}</p>
              <p className="mt-1.5 text-center text-2xl font-semibold tracking-[-0.035em] text-ink">
                {indicator.value}
              </p>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          Les respostes computables només inclouen centres amb més de{" "}
          {minimumResponseCount} respostes.
        </p>
      </section>

      {alerts.length > 0 ? (
        <section aria-labelledby="admin-alerts-title" className="border-t border-line pt-9">
          <h2
            className="border-l-4 border-warning-text pl-3 text-xl font-semibold text-ink"
            id="admin-alerts-title"
          >
            Requereixen atenció
          </h2>
          <div className="mt-5 divide-y divide-warning-border overflow-hidden rounded-xl border border-warning-border bg-warning-bg">
            {alerts.map((alert) => (
              <Link
                className="flex items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-warning-text transition hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
                href={alert.href}
                key={alert.label}
              >
                <span>{alert.label}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-t border-line pt-9">
        <h2 className="border-l-4 border-action pl-3 text-xl font-semibold text-ink">
          Qüestionari actual
        </h2>

        {summary.activeQuestionnaire ? (
          <div className="mt-6 pl-4">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-action">
                  Versió {summary.activeQuestionnaire.version}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-ink">
                  {summary.activeQuestionnaire.title}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Creada el {formatDate(summary.activeQuestionnaire.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-action hover:bg-accent-soft"
                  href={`/admin?section=questionnaires&questionnaireId=${summary.activeQuestionnaire.id}`}
                >
                  Gestiona qüestionaris
                </Link>
                <Link
                  className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-hover"
                  href={`/admin?section=results&scope=all&questionnaireId=${summary.activeQuestionnaire.id}`}
                >
                  Consulta els resultats
                </Link>
              </div>
            </div>

            <dl className="mt-7 grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                  Centres que l’utilitzen
                </dt>
                <dd className="mt-2 text-2xl font-semibold text-ink">
                  {summary.activeQuestionnaire.centreCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                  Respostes computables
                </dt>
                <dd className="mt-2 text-2xl font-semibold text-ink">
                  {summary.activeQuestionnaire.computableResponses}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="mt-5 pl-4 text-sm text-muted">
            No hi ha cap qüestionari actiu.
          </p>
        )}
      </section>
    </div>
  );
}

function LinkIndicatorIcon() {
  return (
    <svg
      aria-hidden="true"
      className="absolute right-3 top-3 h-3.5 w-3.5 text-muted/60 transition group-hover:text-action"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ca-ES", { dateStyle: "long" }).format(
    new Date(value),
  );
}
