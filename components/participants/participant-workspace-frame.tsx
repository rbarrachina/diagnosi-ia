"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

import { useInterfaceTranslator } from "@/components/i18n/interface-text";
import { useParticipantSidebarState } from "@/components/participants/use-participant-sidebar-state";

type ParticipationLink = { publicCode: string; questionnaireTitle: string };
type ParticipantView = "home" | "new" | "questionnaires" | "result";

export function ParticipantWorkspaceFrame({
  activePublicCode,
  children,
  participations,
  view,
}: {
  activePublicCode?: string;
  children: ReactNode;
  participations: ParticipationLink[];
  view: ParticipantView;
}) {
  const t = useInterfaceTranslator();
  const { expanded, toggle } = useParticipantSidebarState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = [
    { href: "/docent", label: t("iniciDocent"), icon: "home" as const, active: view === "home" },
    { href: "/docent?view=new", label: t("nouQuestionari"), icon: "code" as const, active: view === "new" },
    { href: "/docent?view=questionnaires", label: t("questionaris"), icon: "result" as const, active: view === "questionnaires" || view === "result" },
  ];
  const showQuestionnaires = view === "questionnaires" || view === "result";

  return (
    <div className="relative mx-auto flex h-[100svh] w-full max-w-7xl overflow-hidden pt-20">
      <aside
        aria-label={t("menuDocent")}
        className={`participant-sidebar hidden h-full shrink-0 flex-col overflow-hidden border-r border-line bg-[color-mix(in_srgb,var(--color-paper)_88%,transparent)] px-3 py-5 backdrop-blur-md transition-[width] duration-200 md:flex md:w-[72px] ${expanded ? "lg:w-60" : "lg:w-[72px]"}`}
      >
        <button
          aria-expanded={expanded}
          aria-label={expanded ? t("plegaLaBarraLateral") : t("expandeixLaBarraLateral")}
          className="mb-6 hidden h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-accent-soft hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:inline-flex"
          onClick={toggle}
          type="button"
        >
          <SidebarToggleIcon expanded={expanded} />
        </button>
        <nav aria-label={t("menuDocent")} className="min-h-0 space-y-1.5 overflow-y-auto">
          {sections.map((section) => (
            <Link
              aria-label={section.label}
              aria-current={view !== "result" && section.active ? "page" : undefined}
              className={`flex h-11 items-center rounded-xl px-3 text-sm font-medium transition hover:bg-accent-soft hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${section.active ? "bg-accent-soft text-action" : "text-muted"} ${expanded ? "lg:justify-start" : "lg:justify-center"}`}
              href={section.href}
              key={section.href}
              title={section.label}
            >
              <SectionIcon name={section.icon} />
              {expanded ? <span className="participant-sidebar-expanded-content ml-3 hidden truncate lg:inline">{section.label}</span> : null}
            </Link>
          ))}
          {showQuestionnaires && expanded ? (
            <div className="participant-sidebar-expanded-content hidden border-t border-line pt-3 lg:block">
              {participations.map((item) => (
                <Link
                  aria-current={activePublicCode === item.publicCode ? "page" : undefined}
                  className={`block truncate rounded-lg px-3 py-2 text-sm transition hover:bg-accent-soft hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${activePublicCode === item.publicCode ? "bg-accent-soft text-action" : "text-muted"}`}
                  href={`/docent/resultats/${item.publicCode}`}
                  key={item.publicCode}
                  title={item.questionnaireTitle}
                >
                  {item.questionnaireTitle}
                </Link>
              ))}
            </div>
          ) : null}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain" id="inici" tabIndex={-1}>
        {children}
      </div>

      <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-5 z-40 md:hidden">
        {mobileOpen ? (
          <nav aria-label={t("menuDocent")} className="absolute bottom-14 left-0 max-h-[70svh] w-[min(20rem,calc(100vw-2.5rem))] overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-xl">
            {sections.map((section) => (
              <Link
                aria-current={view !== "result" && section.active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${section.active ? "bg-accent-soft text-action" : "text-ink"}`}
                href={section.href}
                key={section.href}
                onClick={() => setMobileOpen(false)}
              >
                <SectionIcon name={section.icon} />
                {section.label}
              </Link>
            ))}
            {showQuestionnaires ? <div className="border-t border-line pt-2">
              {participations.map((item) => (
                <Link
                  aria-current={activePublicCode === item.publicCode ? "page" : undefined}
                  className={`block truncate rounded-xl px-3 py-2 text-sm hover:bg-accent-soft hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${activePublicCode === item.publicCode ? "bg-accent-soft text-action" : "text-muted"}`}
                  href={`/docent/resultats/${item.publicCode}`}
                  key={item.publicCode}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.questionnaireTitle}
                </Link>
              ))}
            </div> : null}
          </nav>
        ) : null}
        <button
          aria-expanded={mobileOpen}
          aria-label={t("menuDocent")}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={() => setMobileOpen((value) => !value)}
          type="button"
        >
          <MenuIcon />
          {t("menuDocent")}
        </button>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function SidebarToggleIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <rect height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="4" />
      <path d="M8.5 4v16" stroke="currentColor" strokeWidth="1.7" />
      <path d={expanded ? "m15.5 9-3 3 3 3" : "m12.5 9 3 3-3 3"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function SectionIcon({ name }: { name: "home" | "code" | "result" }) {
  const path = name === "home"
    ? "m4 10 8-6 8 6v10H4V10Zm5 10v-6h6v6"
    : name === "code"
      ? "M12 5v14M5 12h14"
      : "M6 3h9l3 3v15H6V3Zm3 8h6m-6 4h6";
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d={path} />
    </svg>
  );
}
