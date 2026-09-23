"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildGmailComposeUrl,
  type CommunicationTemplate,
} from "@/lib/communication/email-template";
import { useTranslations } from "@/components/i18n/language-settings-provider";

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

type CopyState = "idle" | "public";

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
  const messages = useTranslations();
  const copy = messages.centre;
  const router = useRouter();
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [space, setSpace] = useState<CreatedSpaceResponse | null>(existingSpace);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [resetting, setResetting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const displayedSpace = space;
  const gmailComposeUrl = displayedSpace
    ? buildGmailComposeUrl({
        ...communicationTemplate,
        centreName,
        publicCode: displayedSpace.publicCode,
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
        copy.copyError,
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
        throw new Error(errorPayload?.error ?? copy.createError);
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
          : copy.createRetryError,
      });
    }
  }

  async function resetSpace(publicCode: string) {
    const confirmed = window.confirm(
      copy.resetConfirm,
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
        throw new Error(copy.resetError);
      }

      const data = (await response.json()) as CreatedSpaceResponse;
      setSpace(data);
      onSpaceChange?.(data);
      setCopyState("idle");
    } catch {
      setActionError(copy.resetError);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex h-full flex-col text-left text-ink">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-action">
          {copy.diagnosisSpace}
        </p>
        <h2
          className="text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-3xl"
          id="workspace-questionnaire-heading"
        >
          {copy.centreQuestionnaire}
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
          {copy.questionnaireIntro}
        </p>
      </div>

      {!displayedSpace ? (
        <button
          className="mt-7 inline-flex self-start rounded-full bg-action px-6 py-3 text-sm font-semibold text-action-contrast shadow-[0_10px_28px_var(--app-action-shadow)] transition hover:-translate-y-0.5 hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={state.status === "submitting"}
          onClick={handleCreateSpace}
          type="button"
        >
          {state.status === "submitting" ? copy.creating : copy.createQuestionnaire}
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
              <p className="inline-flex items-center gap-2 rounded-full border border-success-border bg-success-bg px-3 py-1 text-xs font-semibold text-success-text">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
                {copy.activeQuestionnaire}
              </p>
              <p className="mt-2 break-words text-xl font-semibold leading-snug text-ink sm:text-2xl">
                {displayedSpace.questionnaireTitle}
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                {messages.common.version} {displayedSpace.questionnaireVersion}
              </p>
            </div>
            <a
              className="group flex w-full items-center justify-between rounded-2xl border border-line bg-surface-soft px-5 py-4 transition hover:border-action hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:w-auto sm:min-w-44 sm:gap-7"
              href={displayedSpace.ownerResultsUrl}
            >
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
                {messages.common.responses}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-3xl font-semibold leading-none text-ink">
                  {displayedSpace.totalSubmissions}
                </span>
                <span
                  aria-hidden="true"
                  className="text-xl text-action transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </a>
          </div>

          <section
            aria-labelledby="public-link-heading"
            className="rounded-2xl border border-line bg-surface-soft p-5 shadow-[0_12px_32px_rgb(34_73_118_/_0.06)] sm:p-6"
          >
            <div>
              <h3
                className="text-base font-semibold text-ink"
                id="public-link-heading"
              >
                {copy.shareQuestionnaire}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                {copy.shareQuestionnaireHelp}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-3 lg:flex-row">
              <label className="min-w-0 flex-1">
                <span className="sr-only">{copy.publicLink}</span>
                <input
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none"
                  readOnly
                  value={displayedSpace.publicUrl}
                />
              </label>
              <button
                className={`rounded-full px-5 py-3 text-sm font-semibold shadow-[0_8px_22px_var(--app-action-shadow)] transition hover:-translate-y-0.5 ${
                  copyState === "public"
                    ? "border border-success-border bg-success-bg text-success-text"
                    : "bg-action text-action-contrast hover:bg-action-hover"
                }`}
                onClick={() => copyToClipboard(displayedSpace.publicUrl, "public")}
                type="button"
              >
                {copyState === "public" ? `✓ ${messages.common.copied}` : messages.common.copy}
              </button>
              <button
                aria-expanded={showEmailConfirmation}
                className="rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold text-muted transition hover:border-action hover:text-action"
                onClick={() => setShowEmailConfirmation((current) => !current)}
                type="button"
              >
                {copy.sendEmail}
              </button>
            </div>
            {showEmailConfirmation && gmailComposeUrl ? (
              <div className="mt-4 rounded-xl border border-info-border bg-info-bg p-4 text-sm leading-6 text-muted">
                <p>
                  {copy.gmailAccount.split("{email}")[0]}
                  <strong className="text-ink">{responsibleEmail}</strong>
                  {copy.gmailAccount.split("{email}")[1]}
                </p>
                <p className="mt-1">
                  {copy.gmailRecipients}
                </p>
                <p className="mt-1">
                  {copy.gmailIncludes.split("{code}")[0]}
                  <strong className="text-ink">{displayedSpace.publicCode}</strong>
                  {copy.gmailIncludes.split("{code}")[1]}
                </p>
                <a
                  className="mt-3 inline-flex rounded-full bg-action px-4 py-2 font-semibold text-action-contrast transition hover:bg-action-hover"
                  href={gmailComposeUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {copy.openGmail}
                </a>
              </div>
            ) : null}
          </section>

          <details className="group border-t border-line pt-6">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-1 py-2 text-sm font-semibold text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
              {copy.advancedOptions}
              <span aria-hidden="true" className="text-lg transition group-open:rotate-180">⌄</span>
            </summary>
            <section
              aria-labelledby="danger-zone-heading"
              className="mt-3 flex flex-col gap-4 rounded-2xl border border-danger-border bg-danger-bg p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3
                  className="text-sm font-semibold text-ink"
                  id="danger-zone-heading"
                >
                  {copy.startAgain}
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                  {copy.resetHelp}
                </p>
              </div>
              <button
                className="inline-flex shrink-0 justify-center rounded-full border border-danger-border bg-surface px-5 py-2.5 text-sm font-semibold text-danger-text transition hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
                disabled={resetting}
                onClick={() => resetSpace(displayedSpace.publicCode)}
                type="button"
              >
                {resetting ? copy.resetting : copy.resetQuestionnaire}
              </button>
            </section>
          </details>

          <p aria-live="polite" className="sr-only">
            {copyState === "public"
              ? copy.publicCopied
              : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
