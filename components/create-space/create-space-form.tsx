"use client";

import { useState } from "react";

type CreatedSpaceResponse = {
  publicCode: string;
  publicUrl: string;
  sharedResultsUrl: string | null;
  ownerResultsUrl: string;
  totalSubmissions: number;
};

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

type CopyState = "idle" | "public" | "shared";

type CreateSpaceFormProps = {
  existingSpace?: CreatedSpaceResponse | null;
};

export function CreateSpaceForm({ existingSpace = null }: CreateSpaceFormProps) {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [space, setSpace] = useState<CreatedSpaceResponse | null>(existingSpace);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [regenerating, setRegenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const displayedSpace = space;

  async function copyToClipboard(value: string, target: Exclude<CopyState, "idle">) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(target);
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("idle");
    }
  }

  async function handleCreateSpace() {
    setState({ status: "submitting" });
    setActionError(null);

    try {
      const response = await fetch("/api/spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{}",
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errorPayload?.error ?? "No s'ha pogut crear l'espai.");
      }

      const data = (await response.json()) as CreatedSpaceResponse;
      setSpace(data);
      setState({ status: "idle" });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error
          ? error.message
          : "No s'ha pogut crear l'espai. Torna-ho a provar.",
      });
    }
  }

  async function regenerateSharedLink(publicCode: string) {
    const confirmed = window.confirm(
      "Aquesta acció regenerarà l’accés privat als resultats. L’enllaç antic deixarà de funcionar. Si no comparteixes el nou enllaç, ningú podrà accedir als resultats amb l’enllaç privat.",
    );

    if (!confirmed) {
      return;
    }

    setRegenerating(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/spaces/${publicCode}/results-token`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("No s'ha pogut regenerar l'enllaç privat.");
      }

      const data = (await response.json()) as { sharedResultsUrl: string };
      setSpace((currentSpace) =>
        currentSpace
          ? {
              ...currentSpace,
              sharedResultsUrl: data.sharedResultsUrl,
            }
          : currentSpace,
      );
      setCopyState("idle");
    } catch {
      setActionError("No s'ha pogut regenerar l'enllaç privat.");
    } finally {
      setRegenerating(false);
    }
  }

  async function resetSpace(publicCode: string) {
    const confirmed = window.confirm(
      "Aquesta acció eliminarà totes les respostes recollides fins ara i generarà nous enllaços. Els enllaços antics deixaran de funcionar.",
    );

    if (!confirmed) {
      return;
    }

    setResetting(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/spaces/${publicCode}/reset`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("No s'ha pogut reiniciar el qüestionari.");
      }

      const data = (await response.json()) as CreatedSpaceResponse;
      setSpace(data);
      setCopyState("idle");
    } catch {
      setActionError("No s'ha pogut reiniciar el qüestionari.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-md border border-line bg-white p-6 text-center shadow-sm">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
          CREAR QÜESTIONARI
        </p>
        <h2 className="text-xl font-semibold text-ink">
          Soc responsable del centre educatiu
        </h2>
      </div>

      {displayedSpace ? (
        <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-slate-700">
          Ja tens un qüestionari creat. Gestiona els enllaços i els resultats
          des d&apos;aquí.
        </p>
      ) : null}

      {!displayedSpace ? (
        <button
          className="mt-6 inline-flex self-center rounded-md bg-action px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5d68] disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={state.status === "submitting"}
          onClick={handleCreateSpace}
          type="button"
        >
          {state.status === "submitting" ? "Creant..." : "Crear el qüestionari"}
        </button>
      ) : null}

      {state.status === "error" ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}

      {actionError ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </p>
      ) : null}

      {displayedSpace ? (
        <div className="mt-6 space-y-4 rounded-md border border-line bg-paper p-4 text-left">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="inline-flex w-fit items-center rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              Respostes {displayedSpace.totalSubmissions}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Codi públic
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-ink">
                {displayedSpace.publicCode}
              </p>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Enllaç públic per al professorat
            </span>
            <div className="mt-2 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
                readOnly
                value={displayedSpace.publicUrl}
              />
              <button
                className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-action hover:text-action"
                onClick={() => copyToClipboard(displayedSpace.publicUrl, "public")}
                type="button"
              >
                {copyState === "public" ? "Copiat" : "Copia"}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Enllaç privat compartit de resultats
            </span>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
                readOnly
                value={
                  displayedSpace.sharedResultsUrl ?? "Cal regenerar l’enllaç privat."
                }
              />
              <button
                className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-action hover:text-action"
                disabled={!displayedSpace.sharedResultsUrl}
                onClick={() =>
                  displayedSpace.sharedResultsUrl
                    ? copyToClipboard(displayedSpace.sharedResultsUrl, "shared")
                    : undefined
                }
                type="button"
              >
                {copyState === "shared" ? "Copiat" : "Copia"}
              </button>
              <button
                className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-action hover:text-action disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={regenerating || resetting}
                onClick={() => regenerateSharedLink(displayedSpace.publicCode)}
                type="button"
              >
                {regenerating ? "Regenerant..." : "Regenerar"}
              </button>
            </div>
          </label>

          <p className="text-sm leading-6 text-slate-700">
            L&apos;enllaç privat es desa xifrat i es pot recuperar des del teu
            espai de gestió.
          </p>

          <div className="flex flex-col gap-3 md:flex-row md:flex-nowrap">
            <a
              className="inline-flex shrink-0 justify-center rounded-md bg-action px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f5d68]"
              href={displayedSpace.ownerResultsUrl}
            >
              Ves als resultats
            </a>
            <button
              className="inline-flex shrink-0 justify-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-800 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={resetting || regenerating}
              onClick={() => resetSpace(displayedSpace.publicCode)}
              type="button"
            >
              {resetting ? "Reiniciant..." : "Reiniciar qüestionari"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
