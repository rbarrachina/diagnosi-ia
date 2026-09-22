"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguageSettings } from "@/components/i18n/language-settings-provider";
import { AVAILABLE_LANGUAGES, type LanguageCode } from "@/lib/i18n/languages";

export function LanguageSelector() {
  const { language: currentLanguage, messages, selectorVisible, visibleLanguageCodes } = useLanguageSettings();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  if (!selectorVisible) {
    return null;
  }

  const languages = AVAILABLE_LANGUAGES.filter(({ code }) =>
    visibleLanguageCodes.includes(code),
  );
  const currentLabel = AVAILABLE_LANGUAGES.find(({ code }) => code === currentLanguage)?.label ?? "Català";

  async function selectLanguage(language: LanguageCode) {
    const response = await fetch("/api/language", {
      body: JSON.stringify({ language }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    if (!response.ok) return;
    setIsOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-label={`${messages.common.language}: ${currentLabel}`}
        className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-surface-soft px-3 text-xs font-bold tracking-[0.08em] text-action shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-action hover:bg-surface focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-paper"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {currentLanguage}
      </button>

      {isOpen ? (
        <div
          aria-label={messages.common.languages}
          className="fixed right-4 top-20 mt-3 w-52 rounded-2xl border border-line bg-surface p-2 shadow-[0_18px_60px_var(--app-shadow)] backdrop-blur-xl sm:absolute sm:right-0 sm:top-auto"
          id={menuId}
          role="region"
        >
          <ul>
          {languages.map((language) => (
            <li
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm"
              key={language.code}
            >
              <button
                className="flex w-full items-center justify-between text-left"
                onClick={() => void selectLanguage(language.code)}
                type="button"
              >
              <span className="flex items-center gap-3">
                <span className="w-7 text-xs font-bold tracking-wide text-action">
                  {language.code}
                </span>
                <span className="font-medium text-ink">
                  {language.label}
                </span>
              </span>
              {language.code === currentLanguage ? <CheckIcon /> : null}
              </button>
            </li>
          ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 text-action" fill="none" viewBox="0 0 24 24">
      <path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}
