"use client";

import { useState } from "react";

type CreatedSpaceResponse = {
  publicCode: string;
  publicUrl: string;
  sharedResultsUrl: string;
  ownerResultsUrl: string;
};

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "created"; data: CreatedSpaceResponse }
  | { status: "error"; message: string };

type CopyState = "idle" | "public" | "shared";

export function CreateSpaceForm() {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [copyState, setCopyState] = useState<CopyState>("idle");

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

    try {
      const response = await fetch("/api/spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{}",
      });

      if (!response.ok) {
        throw new Error("Create space failed");
      }

      const data = (await response.json()) as CreatedSpaceResponse;
      setState({ status: "created", data });
    } catch {
      setState({
        status: "error",
        message: "No s'ha pogut crear l'espai. Torna-ho a provar.",
      });
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

      {state.status !== "created" ? (
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

      {state.status === "created" ? (
        <div className="mt-6 space-y-4 rounded-md border border-line bg-paper p-4 text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Codi públic
            </p>
            <p className="mt-1 font-mono text-lg font-semibold text-ink">
              {state.data.publicCode}
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Enllaç públic per al professorat
            </span>
            <div className="mt-2 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
                readOnly
                value={state.data.publicUrl}
              />
              <button
                className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-action hover:text-action"
                onClick={() => copyToClipboard(state.data.publicUrl, "public")}
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
            <div className="mt-2 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
                readOnly
                value={state.data.sharedResultsUrl}
              />
              <button
                className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-action hover:text-action"
                onClick={() => copyToClipboard(state.data.sharedResultsUrl, "shared")}
                type="button"
              >
                {copyState === "shared" ? "Copiat" : "Copia"}
              </button>
            </div>
          </label>

          <p className="text-sm leading-6 text-slate-700">
            L&apos;enllaç privat es desa xifrat i es pot recuperar des del teu
            espai de gestió.
          </p>

          <a
            className="inline-flex rounded-md bg-action px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f5d68]"
            href={state.data.ownerResultsUrl}
          >
            Ves als resultats
          </a>
        </div>
      ) : null}
    </div>
  );
}
