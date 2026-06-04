"use client";

import { useEffect, useRef, useState } from "react";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import { readPrivateTokenFromLocation } from "@/lib/results/private-token-session";
import type { AggregatedResults } from "@/lib/results/types";

type ResultsClientProps = {
  publicCode: string;
};

type ResultsState =
  | { status: "loading" }
  | { status: "ready"; results: AggregatedResults }
  | { status: "error"; message: string };

export function ResultsClient({ publicCode }: ResultsClientProps) {
  const [state, setState] = useState<ResultsState>({ status: "loading" });
  const [isDownloading, setIsDownloading] = useState(false);
  const privateTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadResults() {
      const privateToken = readPrivateTokenFromLocation(
        publicCode,
        window.location,
        window.history,
        window.sessionStorage,
      );
      privateTokenRef.current = privateToken;

      if (!privateToken) {
        if (isMounted) {
          setState({
            status: "error",
            message: "L'enllaç privat no inclou cap token de resultats.",
          });
        }
        return;
      }

      try {
        const response = await fetch("/api/results", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            publicCode,
            privateToken,
          }),
        });

        if (!response.ok) {
          throw new Error("Results request failed");
        }

        const results = (await response.json()) as AggregatedResults;

        if (isMounted) {
          setState({ status: "ready", results });
        }
      } catch {
        if (isMounted) {
          setState({
            status: "error",
            message: "No s'han pogut carregar els resultats de conjunt.",
          });
        }
      }
    }

    void loadResults();

    return () => {
      isMounted = false;
    };
  }, [publicCode]);

  async function handleDownloadPdf() {
    const privateToken = privateTokenRef.current;

    if (!privateToken) {
      setState({
        status: "error",
        message: "No hi ha cap token privat vàlid per generar l'informe.",
      });
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicCode,
          privateToken,
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
    } catch {
      setState({
        status: "error",
        message: "No s'ha pogut descarregar l'informe PDF.",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  if (state.status === "loading") {
    return (
      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <p className="rounded-md border border-line bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          Carregant resultats de conjunt...
        </p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-5 text-red-900">
          <h1 className="text-xl font-semibold">No es poden mostrar els resultats</h1>
          <p className="mt-2 text-sm leading-6">{state.message}</p>
        </div>
      </section>
    );
  }

  return (
    <ResultsDashboard
      isDownloading={isDownloading}
      onDownloadPdf={handleDownloadPdf}
      results={state.results}
    />
  );
}
