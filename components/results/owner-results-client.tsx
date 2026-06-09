"use client";

import { useState } from "react";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import type { AggregatedResults } from "@/lib/results/types";

type OwnerResultsClientProps = {
  initialSharedResultsUrl: string | null;
  publicCode: string;
  results: AggregatedResults;
};

export function OwnerResultsClient({
  initialSharedResultsUrl,
  publicCode,
  results,
}: OwnerResultsClientProps) {
  const [sharedResultsUrl, setSharedResultsUrl] = useState(initialSharedResultsUrl);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopySharedUrl() {
    if (!sharedResultsUrl) {
      return;
    }

    await navigator.clipboard.writeText(sharedResultsUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function handleRegenerateSharedUrl() {
    setIsRegenerating(true);

    try {
      const response = await fetch(`/api/spaces/${publicCode}/results-token`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Regenerate token failed");
      }

      const data = (await response.json()) as { sharedResultsUrl: string };
      setSharedResultsUrl(data.sharedResultsUrl);
    } finally {
      setIsRegenerating(false);
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
    <>
      <section className="mx-auto w-full max-w-5xl px-6 pt-8">
        <div className="rounded-md border border-line bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
                Resultats del creador
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-ink">{publicCode}</h1>
            </div>
            <a className="text-sm font-semibold text-action" href="/crear">
              Torna a la gestió
            </a>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-ink">
              Enllaç privat compartit
            </span>
            <div className="mt-2 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink"
                readOnly
                value={sharedResultsUrl ?? "Cal regenerar l’enllaç privat."}
              />
              <button
                className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-action hover:text-action disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={!sharedResultsUrl}
                onClick={handleCopySharedUrl}
                type="button"
              >
                {copied ? "Copiat" : "Copia"}
              </button>
            </div>
          </label>

          <button
            className="mt-4 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-action hover:text-action disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={isRegenerating}
            onClick={handleRegenerateSharedUrl}
            type="button"
          >
            {isRegenerating ? "Regenerant..." : "Regenerar enllaç privat"}
          </button>
        </div>
      </section>

      <ResultsDashboard
        isDownloading={isDownloading}
        onDownloadPdf={handleDownloadPdf}
        results={results}
      />
    </>
  );
}
