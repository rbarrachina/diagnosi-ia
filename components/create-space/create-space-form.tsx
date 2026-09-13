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
      setActionError(
        "No s’ha pogut copiar l’enllaç. Selecciona’l i copia’l manualment.",
      );
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
          Comparteix l’accés amb el claustre i consulta sempre els resultats de
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
        <div className="mt-8 space-y-6 border-t border-line pt-7 text-left">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
                Qüestionari actiu
              </p>
              <p className="mt-2 break-words text-xl font-semibold leading-snug text-ink sm:text-2xl">
                {displayedSpace.questionnaireTitle}
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                Versió {displayedSpace.questionnaireVersion}
              </p>
            </div>
            <div className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface-soft px-5 py-4 sm:w-auto sm:min-w-44 sm:gap-7">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
                Respostes
              </span>
              <span className="text-3xl font-semibold leading-none text-ink">
                {displayedSpace.totalSubmissions}
              </span>
            </div>
          </div>

          <section
            aria-labelledby="public-link-heading"
            className="rounded-2xl border border-line bg-surface-soft p-5 shadow-[0_12px_32px_rgb(34_73_118_/_0.06)] sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-action text-action-contrast"
              >
                1
              </span>
              <div>
                <h3
                  className="text-base font-semibold text-ink"
                  id="public-link-heading"
                >
                  Comparteix el qüestionari
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Envia aquest enllaç al professorat perquè pugui respondre.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 lg:flex-row">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Enllaç públic per al professorat</span>
                <input
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none"
                  readOnly
                  value={displayedSpace.publicUrl}
                />
              </label>
              <button
                className="rounded-full bg-action px-5 py-3 text-sm font-semibold text-action-contrast shadow-[0_8px_22px_var(--app-action-shadow)] transition hover:-translate-y-0.5 hover:bg-action-hover"
                onClick={() => copyToClipboard(displayedSpace.publicUrl, "public")}
                type="button"
              >
                {copyState === "public" ? "Copiat" : "Copia"}
              </button>
              <button
                aria-expanded={showEmailConfirmation}
                className="rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold text-muted transition hover:border-action hover:text-action"
                onClick={() => setShowEmailConfirmation((current) => !current)}
                type="button"
              >
                Envia el correu
              </button>
            </div>
            {showEmailConfirmation && gmailComposeUrl ? (
              <div className="mt-4 rounded-xl border border-info-border bg-info-bg p-4 text-sm leading-6 text-muted">
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
          </section>

          <section
            aria-labelledby="results-link-heading"
            className="rounded-2xl border border-line bg-surface-soft p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-action"
              >
                2
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className="text-base font-semibold text-ink"
                    id="results-link-heading"
                  >
                    Comparteix els resultats
                  </h3>
                  <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted">
                    Opcional
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Dona accés als resultats de conjunt als docents del claustre.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 lg:flex-row">
              <label className="min-w-0 flex-1">
                <span className="sr-only">
                  Enllaç privat compartit de resultats
                </span>
                <input
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none"
                  readOnly
                  value={
                    displayedSpace.sharedResultsUrl ??
                    "Cal regenerar l’enllaç privat."
                  }
                />
              </label>
              <button
                className="rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold text-muted transition hover:border-action hover:text-action disabled:opacity-50"
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
                className="rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold text-muted transition hover:border-action hover:text-action disabled:cursor-not-allowed disabled:opacity-50"
                disabled={regenerating || resetting}
                onClick={() => regenerateSharedLink(displayedSpace.publicCode)}
                type="button"
              >
                {regenerating ? "Regenerant..." : "Regenerar"}
              </button>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              L&apos;enllaç es desa xifrat. Si el regeneres, l&apos;anterior
              deixarà de funcionar.
            </p>
          </section>

          <section
            aria-labelledby="danger-zone-heading"
            className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3
                className="text-sm font-semibold text-ink"
                id="danger-zone-heading"
              >
                Vols començar de nou?
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                El reinici elimina totes les respostes i genera enllaços nous.
              </p>
            </div>
            <button
              className="inline-flex shrink-0 justify-center rounded-full border border-danger-border bg-transparent px-5 py-2.5 text-sm font-semibold text-danger-text transition hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
              disabled={resetting || regenerating}
              onClick={() => resetSpace(displayedSpace.publicCode)}
              type="button"
            >
              {resetting ? "Reiniciant..." : "Reiniciar qüestionari"}
            </button>
          </section>

          <p aria-live="polite" className="sr-only">
            {copyState === "public"
              ? "Enllaç públic copiat"
              : copyState === "shared"
                ? "Enllaç privat copiat"
                : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
