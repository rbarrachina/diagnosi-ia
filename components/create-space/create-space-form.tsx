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
  const messages = useTranslations();
  const copy = messages.centre;
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

  async function regenerateSharedLink(publicCode: string) {
    const confirmed = window.confirm(
      copy.regenerateConfirm,
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
        throw new Error(copy.regenerateError);
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
      setActionError(copy.regenerateError);
    } finally {
      setRegenerating(false);
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
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
                {copy.activeQuestionnaire}
              </p>
              <p className="mt-2 break-words text-xl font-semibold leading-snug text-ink sm:text-2xl">
                {displayedSpace.questionnaireTitle}
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                {messages.common.version} {displayedSpace.questionnaireVersion}
              </p>
            </div>
            <div className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface-soft px-5 py-4 sm:w-auto sm:min-w-44 sm:gap-7">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
                {messages.common.responses}
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
                  {copy.shareQuestionnaire}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {copy.shareQuestionnaireHelp}
                </p>
              </div>
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
                className="rounded-full bg-action px-5 py-3 text-sm font-semibold text-action-contrast shadow-[0_8px_22px_var(--app-action-shadow)] transition hover:-translate-y-0.5 hover:bg-action-hover"
                onClick={() => copyToClipboard(displayedSpace.publicUrl, "public")}
                type="button"
              >
                {copyState === "public" ? messages.common.copied : messages.common.copy}
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
                    {copy.shareResults}
                  </h3>
                  <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted">
                    {messages.common.optional}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {copy.shareResultsHelp}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 lg:flex-row">
              <label className="min-w-0 flex-1">
                <span className="sr-only">
                  {copy.privateResultsLink}
                </span>
                <input
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none"
                  readOnly
                  value={
                    displayedSpace.sharedResultsUrl ??
                    copy.regenerateRequired
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
                {copyState === "shared" ? messages.common.copied : messages.common.copy}
              </button>
              <button
                className="rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold text-muted transition hover:border-action hover:text-action disabled:cursor-not-allowed disabled:opacity-50"
                disabled={regenerating || resetting}
                onClick={() => regenerateSharedLink(displayedSpace.publicCode)}
                type="button"
              >
                {regenerating ? copy.regenerating : copy.regenerate}
              </button>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              {copy.encryptedLinkHelp}
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
                {copy.startAgain}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                {copy.resetHelp}
              </p>
            </div>
            <button
              className="inline-flex shrink-0 justify-center rounded-full border border-danger-border bg-transparent px-5 py-2.5 text-sm font-semibold text-danger-text transition hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
              disabled={resetting || regenerating}
              onClick={() => resetSpace(displayedSpace.publicCode)}
              type="button"
            >
              {resetting ? copy.resetting : copy.resetQuestionnaire}
            </button>
          </section>

          <p aria-live="polite" className="sr-only">
            {copyState === "public"
              ? copy.publicCopied
              : copyState === "shared"
                ? copy.privateCopied
                : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
