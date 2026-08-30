"use client";

export type WorkspaceView = "questionnaire" | "profile" | "settings";
export type WorkspaceAccess = "preview" | "results";

type NavigationItem = {
  icon: "questionnaire" | "profile" | "settings";
  label: string;
  view: WorkspaceView;
};

type NavigationLink = {
  access: WorkspaceAccess;
  href: string;
  icon: "preview" | "results";
  label: string;
  mobileLabel: string;
};

const navigationItems: NavigationItem[] = [
  { icon: "profile", label: "Fitxa", view: "profile" },
  { icon: "settings", label: "Configuració", view: "settings" },
  { icon: "questionnaire", label: "Qüestionari", view: "questionnaire" },
];

export function CentreSidebar({
  centreName,
  activeAccess,
  expanded,
  hasCentre,
  onNavigate,
  onToggle,
  questionnairePreviewUrl,
  resultsUrl,
  view,
}: {
  activeAccess?: WorkspaceAccess;
  centreName: string;
  expanded: boolean;
  hasCentre: boolean;
  onNavigate?: (view: WorkspaceView) => void;
  onToggle: () => void;
  questionnairePreviewUrl?: string;
  resultsUrl?: string;
  view?: WorkspaceView;
}) {
  const navigationLinks = getNavigationLinks(questionnairePreviewUrl, resultsUrl);

  return (
    <aside
      aria-label="Navegació de l’espai del centre"
      className={`centre-sidebar hidden h-full shrink-0 flex-col overflow-hidden border-r border-line bg-[color-mix(in_srgb,var(--color-paper)_88%,transparent)] px-3 py-5 backdrop-blur-md transition-[width] duration-200 md:flex md:w-[72px] ${
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
          <BuildingIcon />
        </span>
        {expanded ? (
          <div className="centre-sidebar-expanded-content hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-action">
              Espai del centre
            </p>
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-ink">
              {centreName}
            </p>
          </div>
        ) : null}
      </div>

      <nav aria-label="Seccions del centre" className="space-y-1.5">
        {navigationItems.filter((item) => hasCentre || item.view === "questionnaire").map((item) => (
          <SidebarItem
            active={view === item.view}
            expanded={expanded}
            href={onNavigate ? undefined : getWorkspaceViewHref(item.view)}
            item={item}
            key={item.view}
            onClick={onNavigate ? () => onNavigate(item.view) : undefined}
          />
        ))}
        {navigationLinks.length > 0 ? (
          <div className="mt-4 space-y-1.5 border-t border-line pt-4">
            {expanded ? (
              <p className="centre-sidebar-expanded-content mb-2 hidden px-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted lg:block">
                Accessos
              </p>
            ) : null}
            {navigationLinks.map((item) => (
              <SidebarLink
                active={activeAccess === item.access}
                expanded={expanded}
                item={item}
                key={item.label}
              />
            ))}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}

export function CentreMobileNavigation({
  activeAccess,
  onNavigate,
  hasCentre,
  questionnairePreviewUrl,
  resultsUrl,
  view,
}: {
  activeAccess?: WorkspaceAccess;
  onNavigate?: (view: WorkspaceView) => void;
  hasCentre: boolean;
  questionnairePreviewUrl?: string;
  resultsUrl?: string;
  view?: WorkspaceView;
}) {
  const navigationLinks = getNavigationLinks(questionnairePreviewUrl, resultsUrl);
  const visibleItems = navigationItems.filter(
    (item) => hasCentre || item.view === "questionnaire",
  );
  const itemCount = visibleItems.length + navigationLinks.length;

  return (
    <nav
      aria-label="Seccions del centre"
      className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-surface px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_36px_var(--app-shadow)] md:hidden ${
        itemCount >= 5
          ? "grid-cols-5"
          : itemCount === 3
            ? "grid-cols-3"
            : itemCount === 2
              ? "grid-cols-2"
              : "grid-cols-1"
      }`}
    >
      {visibleItems.map((item) => {
        const active = view === item.view;
        return (
          <MobileSectionItem
            active={active}
            href={onNavigate ? undefined : getWorkspaceViewHref(item.view)}
            item={item}
            key={item.view}
            onClick={onNavigate ? () => onNavigate(item.view) : undefined}
          />
        );
      })}
      {navigationLinks.map((item) => (
        <a
          aria-current={activeAccess === item.access ? "page" : undefined}
          aria-label={item.label}
          className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[0.65rem] font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
            activeAccess === item.access
              ? "bg-accent-soft text-action"
              : "text-muted hover:text-action"
          }`}
          href={item.href}
          key={item.label}
        >
          <NavigationIcon name={item.icon} />
          <span>{item.mobileLabel}</span>
        </a>
      ))}
    </nav>
  );
}

function getNavigationLinks(
  questionnairePreviewUrl?: string,
  resultsUrl?: string,
): NavigationLink[] {
  const links: NavigationLink[] = [];

  if (questionnairePreviewUrl) {
    links.push({
      access: "preview",
      href: questionnairePreviewUrl,
      icon: "preview",
      label: "Veure qüestionari",
      mobileLabel: "Visualitza",
    });
  }
  if (resultsUrl) {
    links.push({
      access: "results",
      href: resultsUrl,
      icon: "results",
      label: "Ves als resultats",
      mobileLabel: "Resultats",
    });
  }

  return links;
}

function getWorkspaceViewHref(view: WorkspaceView) {
  if (view === "questionnaire") return "/crear";
  return `/crear?view=${view}`;
}

function SidebarItem({
  active,
  expanded,
  href,
  item,
  onClick,
}: {
  active: boolean;
  expanded: boolean;
  href?: string;
  item: NavigationItem;
  onClick?: () => void;
}) {
  const className = `centre-sidebar-navigation-item group relative flex h-11 w-full items-center rounded-xl px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
    active
      ? "bg-accent-soft text-action"
      : "text-muted hover:bg-surface-soft hover:text-ink"
  } ${expanded ? "lg:justify-start" : "lg:justify-center"} justify-center`;
  const content = (
    <>
      <NavigationIcon name={item.icon} />
      {expanded ? (
        <span className="centre-sidebar-expanded-content ml-3 hidden truncate lg:inline">{item.label}</span>
      ) : null}
      <NavigationTooltip
        hideOnExpandedDesktop={expanded}
        label={item.label}
      />
      <span className="sr-only lg:hidden">{item.label}</span>
    </>
  );

  return href ? (
    <a
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={className}
      href={href}
    >
      {content}
    </a>
  ) : (
    <button
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={className}
      onClick={onClick}
      type="button"
    >
      {content}
    </button>
  );
}

function SidebarLink({
  active,
  expanded,
  item,
}: {
  active: boolean;
  expanded: boolean;
  item: NavigationLink;
}) {
  return (
    <a
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={`centre-sidebar-navigation-item group relative flex h-11 w-full items-center justify-center rounded-xl px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
        active
          ? "bg-accent-soft text-action"
          : "text-muted hover:bg-surface-soft hover:text-action"
      } ${expanded ? "lg:justify-start" : "lg:justify-center"}`}
      href={item.href}
    >
      <NavigationIcon name={item.icon} />
      {expanded ? (
        <span className="centre-sidebar-expanded-content ml-3 hidden truncate lg:inline">{item.label}</span>
      ) : null}
      <NavigationTooltip
        hideOnExpandedDesktop={expanded}
        label={item.label}
      />
      <span className="sr-only lg:hidden">{item.label}</span>
    </a>
  );
}

function MobileSectionItem({
  active,
  href,
  item,
  onClick,
}: {
  active: boolean;
  href?: string;
  item: NavigationItem;
  onClick?: () => void;
}) {
  const className = `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[0.7rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
    active
      ? "bg-accent-soft text-action"
      : "text-muted hover:text-ink"
  }`;
  const content = (
    <>
      <NavigationIcon name={item.icon} />
      <span>{item.label}</span>
    </>
  );

  return href ? (
    <a
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={className}
      href={href}
    >
      {content}
    </a>
  ) : (
    <button
      aria-current={active ? "page" : undefined}
      className={className}
      onClick={onClick}
      type="button"
    >
      {content}
    </button>
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
      className={`pointer-events-none absolute left-[calc(100%+0.65rem)] z-50 hidden whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100 md:block ${hideOnExpandedDesktop ? "lg:hidden" : ""}`}
      role="tooltip"
    >
      {label}
    </span>
  );
}

function NavigationIcon({
  name,
}: {
  name: NavigationItem["icon"] | NavigationLink["icon"];
}) {
  if (name === "profile") {
    return <BuildingIcon />;
  }
  if (name === "settings") {
    return <SettingsIcon />;
  }
  if (name === "preview") {
    return <PreviewIcon />;
  }
  if (name === "results") {
    return <ResultsIcon />;
  }
  return <QuestionnaireIcon />;
}

function PreviewIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M3.5 12s3.1-5 8.5-5 8.5 5 8.5 5-3.1 5-8.5 5-8.5-5-8.5-5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ResultsIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M5 19V9M12 19V5M19 19v-7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M3.5 19.5h17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function QuestionnaireIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M7 4.5h10A2.5 2.5 0 0 1 19.5 7v10a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 17V7A2.5 2.5 0 0 1 7 4.5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 9h8M8 12.5h8M8 16h4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M4 20h16M6 20V9l6-4 6 4v11M9 20v-5h6v5M9 11h.01M15 11h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M12 15.1a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="m18.1 13.3 1.4 1.1-1.8 3.1-1.7-.7a7.4 7.4 0 0 1-2.2 1.3l-.2 1.8H10l-.2-1.8a7.4 7.4 0 0 1-2.2-1.3l-1.7.7-1.8-3.1 1.4-1.1a7.6 7.6 0 0 1 0-2.6L4.1 9.6l1.8-3.1 1.7.7a7.4 7.4 0 0 1 2.2-1.3L10 4.1h3.6l.2 1.8A7.4 7.4 0 0 1 16 7.2l1.7-.7 1.8 3.1-1.4 1.1a7.6 7.6 0 0 1 0 2.6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function SidebarToggleIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <rect height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="4" />
      <path d="M8.5 4v16" stroke="currentColor" strokeWidth="1.7" />
      <path
        d={expanded ? "m15.5 9-3 3 3 3" : "m12.5 9 3 3-3 3"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}
