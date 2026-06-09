"use client";

import { useState } from "react";
import type { OwnerDiagnosticSpace } from "@/lib/spaces/manage-spaces";

type OwnerSpacesListProps = {
  spaces: OwnerDiagnosticSpace[];
};

type ResetSpaceResponse = {
  publicCode: string;
  publicUrl: string;
  sharedResultsUrl: string;
  ownerResultsUrl: string;
};

type CopyState = {
  publicCode: string;
  target: "public" | "shared" | "owner";
} | null;

export function OwnerSpacesList({ spaces }: OwnerSpacesListProps) {
  const [items, setItems] = useState(spaces);
  const [copyState, setCopyState] = useState<CopyState>(null);
  const [regeneratingCode, setRegeneratingCode] = useState<string | null>(null);
  const [resettingCode, setResettingCode] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function copyToClipboard(
    publicCode: string,
    target: "public" | "shared" | "owner",
    value: string,
  ) {
    await navigator.clipboard.writeText(value);
    setCopyState({ publicCode, target });
    window.setTimeout(() => setCopyState(null), 1800);
  }

  async function regenerateSharedLink(publicCode: string) {
    setRegeneratingCode(publicCode);
    setActionError(null);

    try {
      const response = await fetch(`/api/spaces/${publicCode}/results-token`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Regenerate token failed");
      }

      const data = (await response.json()) as { sharedResultsUrl: string };
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.publicCode === publicCode
            ? {
                ...item,
                sharedResultsUrl: data.sharedResultsUrl,
                resultsTokenEnabled: true,
              }
            : item,
        ),
      );
    } catch {
      setActionError("No s'ha pogut regenerar l'enllaç privat.");
    } finally {
      setRegeneratingCode(null);
    }
  }

  async function resetSpace(publicCode: string) {
    const confirmed = window.confirm(
      "Aquesta acció eliminarà totes les respostes recollides fins ara i generarà nous enllaços. Els enllaços antics deixaran de funcionar.",
    );

    if (!confirmed) {
      return;
    }

    setResettingCode(publicCode);
    setActionError(null);

    try {
      const response = await fetch(`/api/spaces/${publicCode}/reset`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Reset space failed");
      }

      const data = (await response.json()) as ResetSpaceResponse;
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.publicCode === publicCode
            ? {
                ...item,
                publicCode: data.publicCode,
                publicUrl: data.publicUrl,
                sharedResultsUrl: data.sharedResultsUrl,
                ownerResultsUrl: data.ownerResultsUrl,
                resultsTokenEnabled: true,
              }
            : item,
        ),
      );
    } catch {
      setActionError("No s'ha pogut reiniciar el qüestionari.");
    } finally {
      setResettingCode(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-line bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
        Encara no has creat cap espai diagnòstic.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {actionError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </p>
      ) : null}

      {items.map((space) => (
        <article
          className="rounded-md border border-line bg-white p-5 text-left shadow-sm"
          key={space.publicCode}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
                Codi públic
              </p>
              <h2 className="mt-1 font-mono text-2xl font-semibold text-ink">
                {space.publicCode}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Creat el {new Date(space.createdAt).toLocaleDateString("ca-ES")}
              </p>
            </div>
            <a
              className="inline-flex rounded-md bg-action px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f5d68]"
              href={space.ownerResultsUrl}
            >
              Veure resultats
            </a>
          </div>

          <div className="mt-5 grid gap-4">
            <LinkRow
              copied={copyState?.publicCode === space.publicCode && copyState.target === "public"}
              label="Enllaç públic del qüestionari"
              onCopy={() => copyToClipboard(space.publicCode, "public", space.publicUrl)}
              value={space.publicUrl}
            />
            <LinkRow
              copied={copyState?.publicCode === space.publicCode && copyState.target === "shared"}
              label="Enllaç privat compartit de resultats"
              onCopy={() =>
                space.sharedResultsUrl
                  ? copyToClipboard(space.publicCode, "shared", space.sharedResultsUrl)
                  : undefined
              }
              value={space.sharedResultsUrl ?? "Cal regenerar l’enllaç privat."}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-action hover:text-action disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={regeneratingCode === space.publicCode || resettingCode === space.publicCode}
              onClick={() => regenerateSharedLink(space.publicCode)}
              type="button"
            >
              {regeneratingCode === space.publicCode
                ? "Regenerant..."
                : "Regenerar enllaç privat"}
            </button>

            <button
              className="inline-flex justify-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-800 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={resettingCode === space.publicCode || regeneratingCode === space.publicCode}
              onClick={() => resetSpace(space.publicCode)}
              type="button"
            >
              {resettingCode === space.publicCode
                ? "Reiniciant..."
                : "Reiniciar qüestionari"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function LinkRow(props: {
  copied: boolean;
  label: string;
  onCopy: () => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{props.label}</span>
      <div className="mt-2 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink"
          readOnly
          value={props.value}
        />
        <button
          className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-action hover:text-action"
          onClick={props.onCopy}
          type="button"
        >
          {props.copied ? "Copiat" : "Copia"}
        </button>
      </div>
    </label>
  );
}
