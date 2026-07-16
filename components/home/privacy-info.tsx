"use client";

import { useId, useState } from "react";

export function PrivacyInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();

  return (
    <div className="absolute right-4 top-4 z-20 text-left sm:right-8 sm:top-8">
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-label="Informació de privacitat"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-action shadow-sm transition hover:border-action hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 3 5.5 5.7v5.7c0 4.2 2.6 7.7 6.5 9.6 3.9-1.9 6.5-5.4 6.5-9.6V5.7L12 3Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="m9.1 12.1 1.9 1.9 4-4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </button>

      {isOpen ? (
        <section
          aria-labelledby={titleId}
          className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-md border border-line bg-white p-5 text-sm leading-6 text-slate-700 shadow-lg"
          id={panelId}
        >
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-semibold text-ink" id={titleId}>
              Privacitat i anonimat
            </h2>
            <button
              aria-label="Tanca la informació de privacitat"
              className="-mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-slate-500 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-focus"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>
          <p className="mt-3">
            Les respostes són anònimes i els resultats es consulten només en
            conjunt.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>No es desa ni es mostra el nom del centre.</li>
            <li>
              No es recullen noms, correus, IPs ni informació del dispositiu
              del professorat.
            </li>
            <li>
              No hi ha respostes obertes ni accés a respostes individuals.
            </li>
          </ul>
        </section>
      ) : null}
    </div>
  );
}
