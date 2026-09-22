"use client";

import { useState } from "react";
import type { CentreProfile } from "@/lib/centres/types";
import { useLanguageSettings, useTranslations } from "@/components/i18n/language-settings-provider";

export function CentreCard({
  initialCentre,
  embedded = false,
  hideHeading = false,
}: {
  initialCentre: CentreProfile;
  embedded?: boolean;
  hideHeading?: boolean;
}) {
  const messages = useTranslations();
  const { language } = useLanguageSettings();
  const copy = messages.centre;
  const [centre, setCentre] = useState(initialCentre);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/centres/refresh", { method: "POST" });
      const payload = (await response.json()) as {
        centre?: CentreProfile;
        error?: string;
      };

      if (!response.ok || !payload.centre) {
        throw new Error(payload.error ?? copy.reloadError);
      }

      setCentre(payload.centre);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : copy.reloadError,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={
        embedded
          ? "mt-3 text-left text-ink"
          : "mb-4 rounded-md border border-line bg-surface p-5 text-left shadow-sm"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {hideHeading ? (
          <p className="text-lg font-semibold text-ink">
            {centre.displayName}
          </p>
        ) : (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
              {copy.profile}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-ink">{centre.displayName}</h2>
          </div>
        )}
        <button
          className={embedded ? "rounded-full border border-line px-3 py-2 text-xs font-semibold text-muted transition hover:border-action hover:text-action disabled:opacity-50" : "rounded-md border border-line px-3 py-2 text-xs font-semibold text-muted transition hover:border-action hover:text-action disabled:text-muted"}
          disabled={loading}
          onClick={refresh}
          type="button"
        >
          {loading ? copy.reloading : copy.reload}
        </button>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
        <CentreField emptyLabel={messages.common.noData} label={copy.code} value={centre.officialCode} />
        <CentreField emptyLabel={messages.common.noData} label={copy.municipality} value={centre.municipality} />
        <CentreField emptyLabel={messages.common.noData} label={copy.territorialArea} value={centre.territorialArea} />
        <CentreField emptyLabel={messages.common.noData} label={copy.educationalService} value={centre.educationalService} />
        <CentreField emptyLabel={messages.common.noData} label={copy.centreEmail} value={centre.email} />
        <CentreField emptyLabel={messages.common.noData} label={copy.googleAccountName} value={centre.accountDisplayName} />
      </dl>

      <div className="mt-4 space-y-1 text-xs leading-5 text-muted">
        <p>
          {copy.lastSuccess}: {formatDate(centre.lastSuccessAt, language, copy.notAvailableYet)}
        </p>
        <p>{copy.lastAttempt}: {formatDate(centre.lastAttemptAt, language, copy.notAvailableYet)}</p>
        {centre.sourceStatus === "not_found" ? (
          <p className="font-semibold text-warning-text">
            {copy.notFound}
          </p>
        ) : null}
        {centre.sourceStatus === "unavailable" ? (
          <p className="font-semibold text-warning-text">
            {copy.unavailable}
          </p>
        ) : null}
        <p>
          {copy.sources}
        </p>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function CentreField({
  label,
  value,
  emptyLabel,
}: {
  label: string;
  value: string | null;
  emptyLabel: string;
}) {
  return (
    <div>
      <dt className="font-semibold text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{value ?? emptyLabel}</dd>
    </div>
  );
}

function formatDate(value: string | null, language: string, emptyLabel: string): string {
  if (!value) {
    return emptyLabel;
  }

  const locales: Record<string, string> = { CA: "ca-ES", ES: "es-ES", EU: "eu-ES", GL: "gl-ES", OC: "oc-ES" };
  return new Intl.DateTimeFormat(locales[language] ?? "ca-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
