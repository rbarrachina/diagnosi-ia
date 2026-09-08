"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildGmailComposeUrl,
  type CommunicationTemplate,
} from "@/lib/communication/email-template";

export type CreatedSpaceResponse = {
  publicCode: string;
  questionnaireTitle: string;
  questionnaireVersion: string;
  publicUrl: string;
  sharedResultsUrl: string | null;
  ownerResultsUrl: string;
  questionnairePreviewUrl: string;
  totalSubmissions: number;
};

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

type CopyState = "idle" | "public" | "shared";

export type CreateSpaceFormProps = {
  centreName: string;
  communicationTemplate: CommunicationTemplate;
  existingSpace?: CreatedSpaceResponse | null;
  onSpaceChange?: (space: CreatedSpaceResponse) => void;
  responsibleEmail: string;
};

export function CreateSpaceForm({
  centreName,
  communicationTemplate,
  existingSpace = null,
  onSpaceChange,
  responsibleEmail,
}: CreateSpaceFormProps) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [space, setSpace] = useState<CreatedSpaceResponse | null>(existingSpace);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [regenerating, setRegenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const displayedSpace = space;
  const gmailComposeUrl = displayedSpace
    ? buildGmailComposeUrl({
        ...communicationTemplate,
        centreName,
        publicUrl: displayedSpace.publicUrl,
        senderEmail: responsibleEmail,
      })
    : null;

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
      onSpaceChange?.(data);
      setState({ status: "idle" });
      router.refresh();
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
      onSpaceChange?.(data);
      setCopyState("idle");
    } catch {
      setActionError("No s'ha pogut reiniciar el qüestionari.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex h-full flex-col text-left text-ink">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-action">
          Espai de diagnosi
        </p>
        <h2
          className="text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-3xl"
          id="workspace-questionnaire-heading"
        >
          Qüestionari del centre
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
          Comparteix l’accés amb el claustre i consulta els resultats sempre de
          manera conjunta.
        </p>
      </div>

      {!displayedSpace ? (
        <button
          className="mt-7 inline-flex self-start rounded-full bg-action px-6 py-3 text-sm font-semibold text-action-contrast shadow-[0_10px_28px_var(--app-action-shadow)] transition hover:-translate-y-0.5 hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="mt-8 space-y-7 border-t border-line pt-7 text-left">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
                Qüestionari
              </p>
              <p className="mt-2 break-words text-xl font-semibold leading-snug text-ink sm:text-2xl">
                {displayedSpace.questionnaireTitle}
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                Versió {displayedSpace.questionnaireVersion}
              </p>
            </div>
            <div className="flex w-fit min-w-24 flex-col items-center border-l border-line px-5 text-center sm:min-w-32">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
                Respostes
              </span>
              <span className="mt-2 text-4xl font-semibold leading-none text-ink">
                {displayedSpace.totalSubmissions}
              </span>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Enllaç públic per al professorat
            </span>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                className="min-w-0 flex-1 rounded-xl border border-line bg-surface-soft px-4 py-3 text-sm text-ink outline-none"
                readOnly
                value={displayedSpace.publicUrl}
              />
              <button
                className="rounded-full border border-line bg-surface-soft px-4 py-2 text-xs font-semibold text-muted transition hover:border-action hover:text-action"
                onClick={() => copyToClipboard(displayedSpace.publicUrl, "public")}
                type="button"
              >
                {copyState === "public" ? "Copiat" : "Copia"}
              </button>
              <button
                className="rounded-full border border-line bg-surface-soft px-4 py-2 text-xs font-semibold text-muted transition hover:border-action hover:text-action"
                onClick={() => setShowEmailConfirmation((current) => !current)}
                type="button"
              >
                Envia correu web
              </button>
            </div>
            {showEmailConfirmation && gmailComposeUrl ? (
              <div className="mt-3 rounded-xl border border-line bg-surface-soft p-4 text-xs leading-5 text-muted">
                <p>
                  Gmail s&apos;obrirà amb el compte{" "}
                  <strong className="text-ink">{responsibleEmail}</strong>.
                </p>
                <p className="mt-1">
                  Afegeix al camp “Per a” els correus dels docents del centre
                  abans d&apos;enviar el missatge.
                </p>
                <a
                  className="mt-3 inline-flex rounded-full bg-action px-4 py-2 font-semibold text-action-contrast transition hover:bg-action-hover"
                  href={gmailComposeUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Obre Gmail
                </a>
              </div>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Enllaç privat compartit de resultats
            </span>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                className="min-w-0 flex-1 rounded-xl border border-line bg-surface-soft px-4 py-3 text-sm text-ink outline-none"
                readOnly
                value={
                  displayedSpace.sharedResultsUrl ?? "Cal regenerar l’enllaç privat."
                }
              />
              <button
                className="rounded-full border border-line bg-surface-soft px-4 py-2 text-xs font-semibold text-muted transition hover:border-action hover:text-action disabled:opacity-50"
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
                className="rounded-full border border-line bg-surface-soft px-4 py-2 text-xs font-semibold text-muted transition hover:border-action hover:text-action disabled:cursor-not-allowed disabled:opacity-50"
                disabled={regenerating || resetting}
                onClick={() => regenerateSharedLink(displayedSpace.publicCode)}
                type="button"
              >
                {regenerating ? "Regenerant..." : "Regenerar"}
              </button>
            </div>
          </label>

          <p className="text-sm leading-6 text-muted">
            L&apos;enllaç privat es desa xifrat i es pot recuperar des del teu
            espai de gestió.
          </p>

          <div>
            <button
              className="inline-flex shrink-0 justify-center rounded-full border border-red-300 bg-transparent px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/30"
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
