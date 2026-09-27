"use client";

import { useState } from "react";
import type { CentreEmailPolicy } from "@/lib/centres/types";
import { useTranslations } from "@/components/i18n/language-settings-provider";

export function CentreEmailPolicyForm({
  initialPolicy,
  onSaved,
  title,
  embedded = false,
  headingId,
}: {
  initialPolicy: CentreEmailPolicy;
  onSaved?: (policy: CentreEmailPolicy) => void;
  title?: string;
  embedded?: boolean;
  headingId?: string;
}) {
  const messages = useTranslations();
  const copy = messages.centre;
  const [domainType, setDomainType] = useState<"xtec" | "custom">(
    initialPolicy.customDomain ? "custom" : "xtec",
  );
  const [customDomain, setCustomDomain] = useState(initialPolicy.customDomain ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/centres/email-policy", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        allowXtec: domainType === "xtec",
        customDomain:
          domainType === "custom" ? customDomain.toLowerCase().trim() : null,
      }),
    });
    const payload = (await response.json()) as {
      policy?: CentreEmailPolicy;
      error?: string;
    };
    if (!response.ok || !payload.policy) {
      setMessage(payload.error ?? copy.settingsSaveError);
      setSaving(false);
      return;
    }
    setMessage(copy.settingsSaved);
    setSaving(false);
    onSaved?.(payload.policy);
  }

  return (
    <section className={embedded ? "text-left text-ink" : "mb-4 rounded-md border border-line bg-surface p-5 text-left shadow-sm"}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
        {copy.accessSettings}
      </p>
      <h2 className={`mt-2 font-semibold tracking-[-0.025em] ${embedded ? "text-2xl text-ink sm:text-3xl" : "text-xl text-ink"}`} id={headingId}>{title ?? copy.admittedEmails}</h2>
      <p className={`mt-3 max-w-2xl text-sm leading-6 ${embedded ? "text-muted sm:text-base" : "text-muted"}`}>
        {copy.emailPrivacy}
      </p>
      {!initialPolicy.configured ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {copy.emailLater}
        </p>
      ) : null}

      <fieldset className="mt-7 grid max-w-3xl gap-4 lg:grid-cols-2">
        <legend className="sr-only">{copy.admittedEmails}</legend>
        <label className={`block cursor-pointer rounded-2xl border p-5 transition focus-within:ring-2 focus-within:ring-focus ${domainType === "xtec" ? "border-action bg-accent-soft" : "border-line bg-surface hover:border-action"}`}>
          <span className="flex items-center gap-3">
            <input
              aria-label="@xtec.cat"
              checked={domainType === "xtec"}
              className="h-5 w-5 shrink-0 accent-action"
              name="email-domain"
              onChange={() => setDomainType("xtec")}
              type="radio"
            />
            <strong className="text-base leading-6 text-ink">@xtec.cat</strong>
          </span>
          <span className="mt-2 block pl-8 text-sm leading-6 text-muted">
            {copy.recommended}
          </span>
        </label>

        <div className={`rounded-2xl border p-5 transition focus-within:ring-2 focus-within:ring-focus ${domainType === "custom" ? "border-action bg-accent-soft" : "border-line bg-surface hover:border-action"}`}>
          <label className="block cursor-pointer">
            <span className="flex items-center gap-3">
              <input
                aria-label={copy.ownDomain}
                checked={domainType === "custom"}
                className="h-5 w-5 shrink-0 accent-action"
                name="email-domain"
                onChange={() => setDomainType("custom")}
                type="radio"
              />
              <strong className="text-base leading-6 text-ink">{copy.ownDomain}</strong>
            </span>
            <span className="mt-2 block pl-8 text-sm leading-6 text-muted">
              {copy.ownDomainHelp}
            </span>
          </label>
          <div className="ml-8 mt-4 flex min-w-0 items-center overflow-hidden rounded-xl border border-line bg-surface focus-within:border-action focus-within:ring-2 focus-within:ring-focus">
            <span aria-hidden="true" className="border-r border-line px-3 py-3 text-muted">@</span>
            <input
              aria-label={copy.ownDomain}
              autoComplete="off"
              autoCapitalize="none"
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-ink outline-none"
              onFocus={() => setDomainType("custom")}
              onChange={(event) => {
                setDomainType("custom");
                setCustomDomain(event.target.value.toLowerCase());
              }}
              placeholder="escola.cat"
              spellCheck={false}
              type="text"
              value={customDomain}
            />
          </div>
        </div>
      </fieldset>

      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
      <button
        className={embedded ? "mt-5 rounded-full bg-action px-6 py-3 text-sm font-semibold text-action-contrast shadow-[0_10px_28px_var(--app-action-shadow)] transition hover:bg-action-hover disabled:opacity-60" : "mt-4 rounded-md bg-action px-5 py-3 text-sm font-semibold text-action-contrast disabled:opacity-60"}
        disabled={saving}
        onClick={save}
        type="button"
      >
        {saving ? messages.common.saving : messages.common.saveAndContinue}
      </button>
    </section>
  );
}
