"use client";

import { useState } from "react";
import type { CentreEmailPolicy } from "@/lib/centres/types";

export function CentreEmailPolicyForm({
  initialPolicy,
  onSaved,
  title = "Correus admesos",
  embedded = false,
  headingId,
}: {
  initialPolicy: CentreEmailPolicy;
  onSaved?: (policy: CentreEmailPolicy) => void;
  title?: string;
  embedded?: boolean;
  headingId?: string;
}) {
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
      setMessage(payload.error ?? "No s'ha pogut desar la configuració.");
      setSaving(false);
      return;
    }
    setMessage("Configuració desada.");
    setSaving(false);
    onSaved?.(payload.policy);
  }

  return (
    <section className={embedded ? "text-left text-ink" : "mb-4 rounded-md border border-line bg-surface p-5 text-left shadow-sm"}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
        Configuració d’accés
      </p>
      <h2 className={`mt-2 font-semibold tracking-[-0.025em] ${embedded ? "text-2xl text-ink sm:text-3xl" : "text-xl text-ink"}`} id={headingId}>{title}</h2>
      <p className={`mt-3 max-w-2xl text-sm leading-6 ${embedded ? "text-muted sm:text-base" : "text-muted"}`}>
        El professorat haurà d’iniciar sessió amb Google. No es desa el seu
        correu ni es vincula a les respostes.
      </p>

      <label className={`mt-7 block border-t p-4 ${embedded ? "border-line" : "rounded-md border border-line"}`}>
        <span className="flex items-center gap-3">
          <input
            aria-label="@xtec.cat"
            checked={domainType === "xtec"}
            className="h-4 w-4 shrink-0"
            name="email-domain"
            onChange={() => setDomainType("xtec")}
            type="radio"
          />
          <strong className="text-sm leading-5 text-ink">@xtec.cat</strong>
        </span>
        <span className="mt-1 block pl-7 text-xs text-muted">
          Opció recomanada i predeterminada.
        </span>
      </label>

      <label className={`block border-t p-4 ${embedded ? "border-line" : "mt-3 rounded-md border border-line"}`}>
        <span className="flex items-center gap-3">
          <input
            aria-label="Domini propi"
            checked={domainType === "custom"}
            className="h-4 w-4 shrink-0"
            name="email-domain"
            onChange={() => setDomainType("custom")}
            type="radio"
          />
          <strong className="text-sm leading-5 text-ink">Domini propi</strong>
        </span>
        <span className="mt-1 block pl-7 text-xs text-muted">
          Ha de ser un domini gestionat amb Google Workspace. No s’admeten
          automàticament els subdominis.
        </span>
        <span className="block pl-7">
          {domainType === "custom" ? (
            <span className={`mt-3 flex max-w-sm items-center rounded-xl border ${embedded ? "border-line bg-surface-soft" : "border-line bg-surface"}`}>
              <span className="border-r border-line bg-accent-soft px-3 py-2 text-muted">@</span>
              <input
                aria-label="Domini propi"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink outline-none"
                onChange={(event) => setCustomDomain(event.target.value.toLowerCase())}
                placeholder="escola.cat"
                spellCheck={false}
                type="text"
                value={customDomain}
              />
            </span>
          ) : null}
        </span>
      </label>

      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
      <button
        className={embedded ? "mt-5 rounded-full bg-action px-6 py-3 text-sm font-semibold text-action-contrast shadow-[0_10px_28px_var(--app-action-shadow)] transition hover:bg-action-hover disabled:opacity-60" : "mt-4 rounded-md bg-action px-5 py-3 text-sm font-semibold text-action-contrast disabled:opacity-60"}
        disabled={saving}
        onClick={save}
        type="button"
      >
        {saving ? "Desant..." : "Desa i continua"}
      </button>
    </section>
  );
}
