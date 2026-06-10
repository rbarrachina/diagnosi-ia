"use client";

import { useState } from "react";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import type { AggregatedResults } from "@/lib/results/types";

type OwnerResultsClientProps = {
  publicCode: string;
  results: AggregatedResults;
};

export function OwnerResultsClient({
  publicCode,
  results,
}: OwnerResultsClientProps) {
  const [isDownloading, setIsDownloading] = useState(false);

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
      isDownloading={isDownloading}
      managementHref="/crear"
      onDownloadPdf={handleDownloadPdf}
      results={results}
    />
  );
}
