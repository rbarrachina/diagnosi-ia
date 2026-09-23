"use client";

import { useState } from "react";
import { useTranslations } from "@/components/i18n/language-settings-provider";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import type { AggregatedResults } from "@/lib/results/types";

type OwnerResultsClientProps = {
  publicCode: string;
  results: AggregatedResults;
  sharedResultsUrl: string | null;
};

export function OwnerResultsClient({
  publicCode,
  results,
  sharedResultsUrl: initialSharedResultsUrl,
}: OwnerResultsClientProps) {
  const messages = useTranslations();
  const copy = messages.centre;
  const [isDownloading, setIsDownloading] = useState(false);
  const [sharedResultsUrl, setSharedResultsUrl] = useState(initialSharedResultsUrl);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function copySharedResultsUrl() {
    if (!sharedResultsUrl) return;

    try {
      await navigator.clipboard.writeText(sharedResultsUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setActionError(copy.copyError);
    }
  }

  async function regenerateSharedLink() {
    if (!window.confirm(copy.regenerateConfirm)) return;

    setRegenerating(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/spaces/${publicCode}/results-token`, {
        method: "POST",
      });

      if (!response.ok) throw new Error(copy.regenerateError);

      const data = (await response.json()) as { sharedResultsUrl: string };
      setSharedResultsUrl(data.sharedResultsUrl);
      setCopied(false);
    } catch {
      setActionError(copy.regenerateError);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleDownloadPdf() {
    setIsDownloading(true);

    try {
      const response = await fetch("/api/reports/pdf/owner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicCode,
        }),
      });

      if (!response.ok) {
        throw new Error("PDF request failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `diagnosi-ia-${publicCode.toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <ResultsDashboard
      integrated
      introContent={(
        <section
          aria-labelledby="results-link-heading"
          className="mt-6 rounded-2xl border border-line bg-surface-soft p-5 shadow-[0_12px_32px_rgb(34_73_118_/_0.06)] sm:p-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-ink" id="results-link-heading">
              {copy.shareResults}
            </h2>
            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted">
              {messages.common.optional}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted">{copy.shareResultsHelp}</p>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <label className="min-w-0 flex-1">
              <span className="sr-only">{copy.privateResultsLink}</span>
              <input
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none"
                readOnly
                value={sharedResultsUrl ?? copy.regenerateRequired}
              />
            </label>
            <button
              className={`rounded-full border px-5 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                copied
                  ? "border-success-border bg-success-bg text-success-text"
                  : "border-line bg-surface text-muted hover:border-action hover:text-action"
              }`}
              disabled={!sharedResultsUrl}
              onClick={copySharedResultsUrl}
              type="button"
            >
              {copied ? `✓ ${messages.common.copied}` : messages.common.copy}
            </button>
            <button
              className="rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold text-muted transition hover:border-action hover:text-action disabled:cursor-not-allowed disabled:opacity-50"
              disabled={regenerating}
              onClick={regenerateSharedLink}
              type="button"
            >
              {regenerating ? copy.regenerating : copy.regenerate}
            </button>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">{copy.encryptedLinkHelp}</p>
          {actionError ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {actionError}
            </p>
          ) : null}
          <p aria-live="polite" className="sr-only">
            {copied ? copy.privateCopied : ""}
          </p>
        </section>
      )}
      isDownloading={isDownloading}
      onDownloadPdf={handleDownloadPdf}
      results={results}
    />
  );
}
