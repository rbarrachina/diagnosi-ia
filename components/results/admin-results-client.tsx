"use client";

import { useState } from "react";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import type { AggregatedResults } from "@/lib/results/types";
import type { AdminResultsScopeInput } from "@/lib/validation/schemas";

type AdminResultsClientProps = {
  centreId: string | null;
  minimumResponseCount: number;
  questionnaireId: string;
  results: AggregatedResults;
  scope: AdminResultsScopeInput;
};

function downloadFilename(results: AggregatedResults): string {
  const scope = (results.scopeLabel ?? "global")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const version = results.questionnaireVersion
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `diagnosi-ia-resultats-${scope}-${version}.pdf`;
}

export function AdminResultsClient({
  centreId,
  minimumResponseCount,
  questionnaireId,
  results,
  scope,
}: AdminResultsClientProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownloadPdf() {
    setIsDownloading(true);

    try {
      const response = await fetch("/api/admin/results/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          scope === "centre" && centreId
            ? { centreId, questionnaireId, scope }
            : { questionnaireId, scope: "all" },
        ),
      });

      if (!response.ok) {
        throw new Error("PDF request failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFilename(results);
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
      eyebrow="Resultats d'administració"
      integrated
      isDownloading={isDownloading}
      metadataText={`${results.scopeLabel} · Qüestionari ${results.questionnaireVersion}`}
      noticeText={`Només es computen els centres amb més de ${minimumResponseCount} respostes. Els centres amb ${minimumResponseCount} respostes o menys no s'inclouen en aquests resultats.`}
      onDownloadPdf={handleDownloadPdf}
      results={results}
      title={scope === "centre" ? "Resultats del centre" : "Resultats globals"}
    />
  );
}
