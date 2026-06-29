"use client";

import { useState } from "react";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import type { AggregatedResults } from "@/lib/results/types";

type AdminResultsClientProps = {
  minimumResponseCount: number;
  questionnaireId: string;
  results: AggregatedResults;
};

function downloadFilename(results: AggregatedResults): string {
  return `diagnosi-ia-resultats-${results.questionnaireVersion
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.pdf`;
}

export function AdminResultsClient({
  minimumResponseCount,
  questionnaireId,
  results,
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
        body: JSON.stringify({
          questionnaireId,
        }),
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
      isDownloading={isDownloading}
      metadataText={`Enquestes amb més de ${minimumResponseCount} respostes · Qüestionari ${results.questionnaireVersion}`}
      noticeText={`Només es computen les enquestes amb més de ${minimumResponseCount} respostes. Les enquestes amb ${minimumResponseCount} respostes o menys no s'inclouen en aquests resultats globals.`}
      onDownloadPdf={handleDownloadPdf}
      results={results}
      title="Resultats globals"
    />
  );
}
