"use client";

import { useEffect, useId, useRef, useState } from "react";

type OpenPanel = "project" | "privacy" | null;

type HeaderInfoControlsProps = {
  version: string;
};

export function HeaderInfoControls({ version }: HeaderInfoControlsProps) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const projectPanelId = useId();
  const projectTitleId = useId();
  const privacyPanelId = useId();
  const privacyTitleId = useId();

  function togglePanel(panel: Exclude<OpenPanel, null>) {
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  useEffect(() => {
    if (openPanel === null) {
      return;
    }

    function closePanelOnOutsidePointer(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !controlsRef.current?.contains(event.target)
      ) {
        setOpenPanel(null);
      }
    }

    document.addEventListener("pointerdown", closePanelOnOutsidePointer);

    return () => {
      document.removeEventListener("pointerdown", closePanelOnOutsidePointer);
    };
  }, [openPanel]);

  return (
    <div
      className="absolute right-4 top-4 z-20 text-left sm:right-8 sm:top-8"
      ref={controlsRef}
    >
      <div className="flex justify-end gap-2">
        <InfoButton
          ariaControls={privacyPanelId}
          ariaExpanded={openPanel === "privacy"}
          ariaLabel="Informació de privacitat"
          onClick={() => togglePanel("privacy")}
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
        </InfoButton>

        <InfoButton
          ariaControls={projectPanelId}
          ariaExpanded={openPanel === "project"}
          ariaLabel="Informació de versió i projecte"
          onClick={() => togglePanel("project")}
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="8.5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M12 10.8v5.1M12 8.1h.01"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
        </InfoButton>
      </div>

      {openPanel === "project" ? (
        <InfoPanel
          closeLabel="Tanca la informació de versió i projecte"
          id={projectPanelId}
          onClose={() => setOpenPanel(null)}
          title="Versió i projecte"
          titleId={projectTitleId}
        >
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
              Beta
            </span>
            <span>Versió {version}</span>
          </div>
          <p className="mt-3">
            Aquesta és una versió beta i pot contenir errors.
          </p>
          <dl className="mt-3 space-y-2">
            <div>
              <dt className="inline font-semibold text-ink">Llicència: </dt>
              <dd className="inline">
                <a
                  className="font-medium text-action underline decoration-action/40 underline-offset-2 hover:decoration-action"
                  href="https://www.apache.org/licenses/LICENSE-2.0"
                  rel="noreferrer"
                  target="_blank"
                >
                  Apache-2.0
                </a>
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold text-ink">Codi font: </dt>
              <dd className="inline">
                <a
                  className="font-medium text-action underline decoration-action/40 underline-offset-2 hover:decoration-action"
                  href="https://github.com/rbarrachina/diagnosi-ia"
                  rel="noreferrer"
                  target="_blank"
                >
                  repositori a GitHub
                </a>
              </dd>
            </div>
          </dl>
        </InfoPanel>
      ) : null}

      {openPanel === "privacy" ? (
        <InfoPanel
          closeLabel="Tanca la informació de privacitat"
          id={privacyPanelId}
          onClose={() => setOpenPanel(null)}
          title="Privacitat i anonimat"
          titleId={privacyTitleId}
        >
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
        </InfoPanel>
      ) : null}
    </div>
  );
}

type InfoButtonProps = {
  ariaControls: string;
  ariaExpanded: boolean;
  ariaLabel: string;
  children: React.ReactNode;
  onClick: () => void;
};

function InfoButton({
  ariaControls,
  ariaExpanded,
  ariaLabel,
  children,
  onClick,
}: InfoButtonProps) {
  return (
    <button
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-action shadow-sm transition hover:border-action hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

type InfoPanelProps = {
  children: React.ReactNode;
  closeLabel: string;
  id: string;
  onClose: () => void;
  title: string;
  titleId: string;
};

function InfoPanel({
  children,
  closeLabel,
  id,
  onClose,
  title,
  titleId,
}: InfoPanelProps) {
  return (
    <section
      aria-labelledby={titleId}
      className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-md border border-line bg-white p-5 text-sm leading-6 text-slate-700 shadow-lg"
      id={id}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-semibold text-ink" id={titleId}>
          {title}
        </h2>
        <button
          aria-label={closeLabel}
          className="-mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-slate-500 transition hover:bg-slate-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-focus"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
      {children}
    </section>
  );
}
