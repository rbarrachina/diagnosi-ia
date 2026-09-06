"use client";

import { useState } from "react";

import type { AdminCentreOption } from "@/lib/admin/types";
import type { AdminResultsScopeInput } from "@/lib/validation/schemas";

type AdminResultsFiltersProps = {
  centres: AdminCentreOption[];
  selectedCentreId: string | null;
  selectedQuestionnaireId: string | null;
  selectedScope: AdminResultsScopeInput;
  versions: Array<{
    id: string;
    title: string;
    version: string;
  }>;
};

export function AdminResultsFilters({
  centres,
  selectedCentreId,
  selectedQuestionnaireId,
  selectedScope,
  versions,
}: AdminResultsFiltersProps) {
  const [centreId, setCentreId] = useState(
    selectedScope === "centre" ? (selectedCentreId ?? "") : "all",
  );
  const [questionnaireId, setQuestionnaireId] = useState(
    selectedQuestionnaireId ?? "",
  );
  const selectedCentre = centres.find((centre) => centre.id === centreId);
  const availableCentres = questionnaireId
    ? centres.filter((centre) => centre.questionnaireIds.includes(questionnaireId))
    : centres;
  const availableVersions = selectedCentre
    ? versions.filter((version) =>
        selectedCentre.questionnaireIds.includes(version.id),
      )
    : versions.filter((version) =>
        centres.some((centre) => centre.questionnaireIds.includes(version.id)),
      );

  function selectCentre(nextCentreId: string) {
    setCentreId(nextCentreId);

    if (nextCentreId === "all") {
      return;
    }

    const nextCentre = centres.find((centre) => centre.id === nextCentreId);

    if (questionnaireId && !nextCentre?.questionnaireIds.includes(questionnaireId)) {
      setQuestionnaireId("");
    }
  }

  return (
    <form action="/admin" className="flex flex-col gap-4" method="get">
      <input name="section" type="hidden" value="results" />
      <input
        name="scope"
        type="hidden"
        value={centreId === "all" ? "all" : "centre"}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-muted">
          Centre
          <select
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            name="centreId"
            onChange={(event) => selectCentre(event.target.value)}
            value={centreId}
          >
            <option value="all">Tots els centres</option>
            {availableCentres.map((centre) => (
              <option key={centre.id} value={centre.id}>
                {formatCentreOption(centre)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-muted">
          Qüestionari
          <select
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            name="questionnaireId"
            onChange={(event) => setQuestionnaireId(event.target.value)}
            required
            value={questionnaireId}
          >
            <option value="">
              Tria un qüestionari
            </option>
            {availableVersions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.version} · {version.title}
              </option>
            ))}
          </select>
        </label>

        <button
          className="self-start rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-hover disabled:bg-muted md:col-span-2"
          disabled={!questionnaireId}
          type="submit"
        >
          Mostra resultats
        </button>
      </div>
    </form>
  );
}

function formatCentreOption(centre: AdminCentreOption): string {
  const details = [centre.officialCode, centre.municipality].filter(Boolean);
  return details.length > 0 ? `${centre.name} · ${details.join(" · ")}` : centre.name;
}
