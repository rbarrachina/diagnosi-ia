"use client";

import { useState } from "react";
import { useTranslations } from "@/components/i18n/language-settings-provider";

const PUBLIC_CODE_PATTERN = /^C-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

export function ParticipantCodeAccessForm({ disabled = false }: { disabled?: boolean }) {
  const messages = useTranslations();
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const normalizedCode = code.trim().toUpperCase();
  const valid = PUBLIC_CODE_PATTERN.test(normalizedCode);
  const invalid = touched && code.length > 0 && !valid;

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled || !valid) return;
        // The OAuth Route Handler requires a full browser navigation.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/auth/login?next=${encodeURIComponent(`/q/${normalizedCode}`)}`);
      }}
    >
      <label className="sr-only" htmlFor="participant-code">
        {messages.common.questionnaireCode}
      </label>
      <input
        autoComplete="off"
        aria-describedby={invalid ? "participant-code-error" : "participant-code-help"}
        aria-invalid={invalid || undefined}
        className="min-h-12 flex-1 rounded-xl border border-line bg-surface px-4 font-mono uppercase text-ink outline-none focus:border-action focus:ring-2 focus:ring-focus"
        id="participant-code"
        disabled={disabled}
        maxLength={12}
        onBlur={() => setTouched(true)}
        onChange={(event) => setCode(event.target.value)}
        placeholder="C-XXXX-XXXX"
        required
        spellCheck={false}
        value={code}
      />
      <button
        className="min-h-12 rounded-xl bg-action px-6 font-semibold text-action-contrast disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || !valid}
        type="submit"
      >
        {messages.common.access}
      </button>
      <p
        className={`text-sm sm:basis-full ${invalid ? "text-danger-text" : "text-muted"}`}
        id={invalid ? "participant-code-error" : "participant-code-help"}
        role={invalid ? "alert" : undefined}
      >
        {invalid
          ? messages.common.questionnaireCodeFormatError
          : messages.common.questionnaireCodeFormatHelp}
      </p>
    </form>
  );
}
