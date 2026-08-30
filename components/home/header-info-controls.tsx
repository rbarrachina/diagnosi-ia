"use client";

import { useEffect, useId, useRef, useState } from "react";

export function HeaderInfoControls() {
  const [isOpen, setIsOpen] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);
  const privacyPanelId = useId();
  const privacyTitleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closePanelOnOutsidePointer(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !controlsRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closePanelOnOutsidePointer);

    return () => {
      document.removeEventListener("pointerdown", closePanelOnOutsidePointer);
    };
  }, [isOpen]);

  return (
    <div
      className="relative z-20 text-left"
      ref={controlsRef}
    >
      <div className="flex justify-end gap-2">
        <InfoButton
          ariaControls={privacyPanelId}
          ariaExpanded={isOpen}
          ariaLabel="Informació sobre privacitat"
          onClick={() => setIsOpen((current) => !current)}
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

      </div>

      {isOpen ? (
        <InfoPanel
          closeLabel="Tanca la informació sobre privacitat"
          id={privacyPanelId}
          onClose={() => setIsOpen(false)}
          title="Privacitat i anonimat"
          titleId={privacyTitleId}
        >
          <p className="mt-3">
            Les respostes són anònimes i els resultats es consulten només en
            conjunt.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              El centre promotor està identificat, però les seves dades
              d’identificació no es vinculen a cap resposta individual.
            </li>
            <li>
              No es recullen noms, cognoms, adreces electròniques, adreces IP
              ni dades dels dispositius del professorat.
            </li>
            <li>
              No es demanen respostes obertes ni es permet consultar respostes
              individuals.
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface-soft text-action shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-action hover:bg-surface focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-paper"
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
      className="fixed left-4 right-4 top-20 mt-3 rounded-2xl border border-line bg-surface p-5 text-sm leading-6 text-muted shadow-[0_18px_60px_var(--app-shadow)] backdrop-blur-xl sm:absolute sm:left-auto sm:top-auto sm:w-[min(21rem,calc(100vw-2rem))]"
      id={id}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-semibold text-ink" id={titleId}>
          {title}
        </h2>
        <button
          aria-label={closeLabel}
          className="-mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-muted transition hover:bg-surface-soft hover:text-ink focus:outline-none focus:ring-2 focus:ring-focus"
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
