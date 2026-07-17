"use client";

import { useState } from "react";
import type { CentreProfile } from "@/lib/centres/types";

export function CentreCard({ initialCentre }: { initialCentre: CentreProfile }) {
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
        throw new Error(payload.error ?? "No s'han pogut recarregar les dades.");
      }

      setCentre(payload.centre);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "No s'han pogut recarregar les dades.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-4 rounded-md border border-line bg-white p-5 text-left shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
            Fitxa del centre
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">{centre.displayName}</h2>
        </div>
        <button
          className="rounded-md border border-line px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-action hover:text-action disabled:text-slate-400"
          disabled={loading}
          onClick={refresh}
          type="button"
        >
          {loading ? "Recarregant..." : "Recarrega les dades"}
        </button>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <CentreField label="Codi" value={centre.officialCode} />
        <CentreField label="Municipi" value={centre.municipality} />
        <CentreField label="Àrea territorial" value={centre.territorialArea} />
        <CentreField label="Servei educatiu" value={centre.educationalService} />
        <CentreField label="Correu del centre" value={centre.email} />
        <CentreField label="Nom del compte Google" value={centre.accountDisplayName} />
      </dl>

      <div className="mt-4 space-y-1 text-xs leading-5 text-slate-600">
        <p>
          Darrera actualització correcta: {formatDate(centre.lastSuccessAt)}
        </p>
        <p>Darrer intent de consulta: {formatDate(centre.lastAttemptAt)}</p>
        {centre.sourceStatus === "not_found" ? (
          <p className="font-semibold text-amber-800">
            Centre no trobat a Dades Obertes.
          </p>
        ) : null}
        {centre.sourceStatus === "unavailable" ? (
          <p className="font-semibold text-amber-800">
            No hi ha dades disponibles en aquest moment.
          </p>
        ) : null}
        <p>
          Fonts: Departament d’Educació — Dades Obertes de Catalunya i Relació
          pública de Serveis Educatius de Zona.
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

function CentreField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="font-semibold text-slate-600">{label}</dt>
      <dd className="mt-0.5 text-ink">{value ?? "No hi ha dades"}</dd>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Encara no disponible";
  }

  return new Intl.DateTimeFormat("ca-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
