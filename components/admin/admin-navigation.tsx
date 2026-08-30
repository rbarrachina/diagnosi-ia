"use client";

import Link from "next/link";

export type AdminSection = "admins" | "questionnaires" | "results" | "settings";

type AdminNavigationItem = {
  href: string;
  icon: "questionnaires" | "results" | "admins" | "settings";
  label: string;
  mobileLabel: string;
  section: AdminSection;
};

function getNavigationItems(
  selectedQuestionnaireId: string | null,
): AdminNavigationItem[] {
  const questionnaireHref = selectedQuestionnaireId
    ? `/admin?section=questionnaires&questionnaireId=${selectedQuestionnaireId}`
    : "/admin?section=questionnaires";

  return [
    {
      href: questionnaireHref,
      icon: "questionnaires",
      label: "Qüestionaris",
      mobileLabel: "Qüestionaris",
      section: "questionnaires",
    },
    {
      href: "/admin?section=results",
      icon: "results",
      label: "Resultats",
      mobileLabel: "Resultats",
      section: "results",
    },
    {
      href: "/admin?section=admins",
      icon: "admins",
      label: "Usuaris",
      mobileLabel: "Usuaris",
      section: "admins",
    },
    {
      href: "/admin?section=settings",
      icon: "settings",
      label: "Configuració",
      mobileLabel: "Config.",
      section: "settings",
    },
  ];
}

export function AdminSidebar({
  activeSection,
  expanded,
  onToggle,
  selectedQuestionnaireId,
}: {
  activeSection: AdminSection;
  expanded: boolean;
  onToggle: () => void;
  selectedQuestionnaireId: string | null;
}) {
  const items = getNavigationItems(selectedQuestionnaireId);

  return (
    <aside
      aria-label="Navegació d’administració"
      className={`admin-sidebar hidden h-full shrink-0 flex-col overflow-hidden border-r border-line bg-[color-mix(in_srgb,var(--color-paper)_88%,transparent)] px-3 py-5 backdrop-blur-md transition-[width] duration-200 md:flex md:w-[72px] ${
        expanded ? "lg:w-60" : "lg:w-[72px]"
      }`}
    >
      <div className="mb-6 px-2">
        <button
          aria-label={expanded ? "Plega la barra lateral" : "Expandeix la barra lateral"}
          className="group relative mb-4 hidden h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-accent-soft hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:inline-flex"
          onClick={onToggle}
          type="button"
        >
          <SidebarToggleIcon expanded={expanded} />
          <NavigationTooltip
            hideOnExpandedDesktop={false}
            label={expanded ? "Plega" : "Expandeix"}
          />
        </button>

        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-action lg:hidden">
          <AdminIcon />
        </span>

        {expanded ? (
          <div className="admin-sidebar-expanded-content hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-action">
              Administració
            </p>
            <p className="mt-2 text-sm font-semibold leading-5 text-ink">
              Tauler de control
            </p>
          </div>
        ) : null}
      </div>

      <nav aria-label="Seccions d’administració" className="space-y-1.5">
        {items.map((item) => (
          <AdminSidebarItem
            active={activeSection === item.section}
            expanded={expanded}
            item={item}
            key={item.section}
          />
        ))}
      </nav>
    </aside>
  );
}

export function AdminMobileNavigation({
  activeSection,
  selectedQuestionnaireId,
}: {
  activeSection: AdminSection;
  selectedQuestionnaireId: string | null;
}) {
  return (
    <nav
      aria-label="Seccions d’administració"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_36px_var(--app-shadow)] md:hidden"
    >
      {getNavigationItems(selectedQuestionnaireId).map((item) => {
        const active = activeSection === item.section;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[0.65rem] font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              active
                ? "bg-accent-soft text-action"
                : "text-muted hover:text-action"
            }`}
            href={item.href}
            key={item.section}
          >
            <AdminNavigationIcon name={item.icon} />
            <span>{item.mobileLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AdminSidebarItem({
  active,
  expanded,
  item,
}: {
  active: boolean;
  expanded: boolean;
  item: AdminNavigationItem;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={`admin-sidebar-navigation-item group relative flex h-11 w-full items-center justify-center rounded-xl px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
        active
          ? "bg-accent-soft text-action"
          : "text-muted hover:bg-surface-soft hover:text-ink"
      } ${expanded ? "lg:justify-start" : "lg:justify-center"}`}
      href={item.href}
    >
      <AdminNavigationIcon name={item.icon} />
      {expanded ? (
        <span className="admin-sidebar-expanded-content ml-3 hidden truncate lg:inline">
          {item.label}
        </span>
      ) : null}
      <NavigationTooltip hideOnExpandedDesktop={expanded} label={item.label} />
      <span className="sr-only lg:hidden">{item.label}</span>
    </Link>
  );
}

function NavigationTooltip({
  hideOnExpandedDesktop,
  label,
}: {
  hideOnExpandedDesktop: boolean;
  label: string;
}) {
  return (
    <span
      className={`pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${
        hideOnExpandedDesktop ? "lg:hidden" : ""
      }`}
      role="tooltip"
    >
      {label}
    </span>
  );
}

function AdminNavigationIcon({
  name,
}: {
  name: AdminNavigationItem["icon"];
}) {
  const common = {
    className: "h-5 w-5 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (name === "questionnaires") {
    return (
      <svg aria-hidden="true" {...common}>
        <rect height="17" rx="2" width="15" x="4.5" y="3.5" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  }

  if (name === "results") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    );
  }

  if (name === "admins") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M17 11a4 4 0 0 0 0-8M22 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .6 1.51 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.37.36.7.66.96.3.25.68.4 1.07.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.64Z" />
    </svg>
  );
}

function SidebarToggleIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <rect height="16" rx="2" stroke="currentColor" strokeWidth="1.8" width="18" x="3" y="4" />
      <path d="M9 4v16" stroke="currentColor" strokeWidth="1.8" />
      <path
        d={expanded ? "m15 9-3 3 3 3" : "m13 9 3 3-3 3"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M12 3 4.5 6v5.4c0 4.5 3.2 8.7 7.5 9.6 4.3-.9 7.5-5.1 7.5-9.6V6L12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m9.5 12 1.7 1.7 3.6-3.9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}
