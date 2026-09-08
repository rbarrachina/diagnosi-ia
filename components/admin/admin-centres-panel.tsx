import Link from "next/link";
import type { ReactNode } from "react";

import { ConfirmSubmitButton } from "@/app/admin/activation-button";
import {
  deleteAdminCentreAction,
  resetAdminCentreResponsesAction,
  resetAdminCentreSpaceAction,
  setAdminCentreSuspendedAction,
} from "@/app/admin/actions";
import type {
  AdminCentreAction,
  AdminCentreFilter,
  AdminManagedCentreDetail,
  AdminManagedCentreSummary,
} from "@/lib/admin/centre-management";

export function AdminCentresPanel({
  centre,
  centres,
  filter,
  minimumResponseCount,
  search,
}: {
  centre: AdminManagedCentreDetail | null;
  centres: AdminManagedCentreSummary[];
  filter: AdminCentreFilter;
  minimumResponseCount: number;
  search: string;
}) {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
      <section aria-label="Llista de centres">
        <form action="/admin" className="flex gap-2" method="get">
          <input name="section" type="hidden" value="centres" />
          {filter !== "all" ? (
            <input name="filter" type="hidden" value={filter} />
          ) : null}
          <label className="min-w-0 flex-1 text-sm font-medium text-muted">
            <span className="sr-only">Cerca centres</span>
            <input
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
              defaultValue={search}
              maxLength={100}
              name="q"
              placeholder="Nom, codi, municipi o correu"
              type="search"
            />
          </label>
          <button
            className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-action-contrast hover:bg-action-hover"
            type="submit"
          >
            Cerca
          </button>
        </form>

        {filter !== "all" ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-accent-soft px-3 py-2 text-xs text-muted">
            <span>
              Filtre: <strong className="font-semibold text-ink">{filterLabel(filter)}</strong>
            </span>
            <Link
              className="font-semibold text-action hover:text-action-hover"
              href="/admin?section=centres"
            >
              Mostra tots
            </Link>
          </div>
        ) : null}

        <div className="mt-5 divide-y divide-line border-y border-line">
          {centres.length > 0 ? (
            centres.map((item) => (
              <Link
                aria-current={centre?.id === item.id ? "page" : undefined}
                className={`block px-3 py-4 transition hover:bg-surface-soft ${
                  centre?.id === item.id ? "bg-accent-soft" : ""
                }`}
                href={centreHref(item.id, search, filter)}
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {item.displayName}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {[item.officialCode, item.municipality]
                        .filter(Boolean)
                        .join(" · ") || item.responsibleEmail}
                    </p>
                  </div>
                  <StatusBadge hasSpace={item.hasSpace} suspended={item.isSuspended} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {formatResponseCount(item.totalSubmissions, minimumResponseCount)}
                </p>
              </Link>
            ))
          ) : (
            <p className="px-3 py-8 text-sm text-muted">
              No s’ha trobat cap centre.
            </p>
          )}
        </div>
      </section>

      {centre ? (
        <CentreDetail centre={centre} minimumResponseCount={minimumResponseCount} />
      ) : (
        <section className="py-8 text-sm text-muted">
          Selecciona un centre per consultar-ne la fitxa i les accions disponibles.
        </section>
      )}
    </div>
  );
}

function CentreDetail({
  centre,
  minimumResponseCount,
}: {
  centre: AdminManagedCentreDetail;
  minimumResponseCount: number;
}) {
  const deleteConfirmation = centre.officialCode ?? centre.centreEmail;

  return (
    <div className="min-w-0 space-y-10">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-action">
              Fitxa del centre
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              {centre.displayName}
            </h2>
          </div>
          <StatusBadge hasSpace={centre.hasSpace} suspended={centre.isSuspended} />
        </div>
        <dl className="mt-6 grid gap-x-8 gap-y-5 border-t border-line pt-6 sm:grid-cols-2">
          <Detail label="Codi oficial" value={centre.officialCode ?? "No disponible"} />
          <Detail label="Correu institucional" value={centre.centreEmail} />
          <Detail label="Municipi" value={centre.municipality ?? "No disponible"} />
          <Detail label="Àrea territorial" value={centre.territorialArea ?? "No disponible"} />
          <Detail label="Servei educatiu" value={centre.educationalService ?? "No disponible"} />
          <Detail
            label="Fitxa confirmada"
            value={centre.profileConfirmedAt ? formatDate(centre.profileConfirmedAt) : "Pendent"}
          />
          <Detail label="Dades institucionals" value={sourceStatusLabel(centre.sourceStatus)} />
        </dl>
      </section>

      <section className="border-t border-line pt-8">
        <h3 className="border-l-4 border-action pl-3 text-lg font-semibold text-ink">
          Identificació i accés
        </h3>
        <dl className="mt-5 grid gap-x-8 gap-y-5 pl-4 sm:grid-cols-2">
          <Detail label="Responsable" value={centre.responsibleName ?? "Sense nom visible"} />
          <Detail label="Correu responsable" value={centre.responsibleEmail} />
          <Detail label="Primer registre" value={formatDate(centre.responsibleCreatedAt)} />
          <Detail
            label="Darrer accés"
            value={centre.lastLoginAt ? formatDate(centre.lastLoginAt) : "Encara no consta"}
          />
          <Detail label="Accés XTEC" value={centre.allowXtec ? "Admès" : "No admès"} />
          <Detail label="Domini del centre" value={centre.customDomain ? `@${centre.customDomain}` : "No configurat"} />
          <Detail
            label="Política de correus"
            value={centre.emailPolicyConfiguredAt ? "Configurada" : "Pendent"}
          />
        </dl>
        <p className="mt-4 pl-4 text-xs leading-5 text-muted">
          L’aplicació no desa ni mostra els correus del professorat participant.
        </p>
      </section>

      <section className="border-t border-line pt-8">
        <h3 className="border-l-4 border-action pl-3 text-lg font-semibold text-ink">
          Qüestionari i resultats
        </h3>
        <dl className="mt-5 grid gap-x-8 gap-y-5 pl-4 sm:grid-cols-2">
          <Detail
            label="Qüestionari"
            value={centre.space ? `${centre.space.questionnaireVersion} · ${centre.space.questionnaireTitle}` : "Sense espai"}
          />
          <Detail
            label="Respostes"
            value={formatResponseCount(centre.totalSubmissions, minimumResponseCount)}
          />
          <Detail label="Codi públic" value={centre.space?.publicCode ?? "No disponible"} />
          <Detail
            label="Estat de l’espai"
            value={centre.space?.isActive ? "Publicat" : centre.space ? "Tancat" : "Sense espai"}
          />
        </dl>
        {centre.space && centre.totalSubmissions > minimumResponseCount ? (
          <Link
            className="ml-4 mt-5 inline-flex rounded-md border border-line px-4 py-2 text-sm font-semibold text-action hover:bg-accent-soft"
            href={`/admin?section=results&scope=centre&centreId=${encodeURIComponent(centre.id)}&questionnaireId=${encodeURIComponent(centre.space.questionnaireId)}`}
          >
            Consulta els resultats agregats
          </Link>
        ) : null}
      </section>

      <section className="border-t border-line pt-8">
        <h3 className="border-l-4 border-action pl-3 text-lg font-semibold text-ink">
          Accions administratives
        </h3>
        <div className="mt-5 space-y-5 pl-4">
          <ActionRow
            description={centre.isSuspended ? "Torna a permetre l’accés del responsable i activa l’espai." : "Impedeix l’accés del responsable i desactiva el qüestionari públic."}
            title={centre.isSuspended ? "Reactiva el centre" : "Suspèn el centre"}
          >
            <form action={setAdminCentreSuspendedAction}>
              <input name="centreId" type="hidden" value={centre.id} />
              <input name="suspended" type="hidden" value={centre.isSuspended ? "false" : "true"} />
              <ConfirmSubmitButton
                className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-soft"
                message={centre.isSuspended ? "Vols reactivar aquest centre?" : "Vols suspendre aquest centre? El qüestionari públic deixarà d’estar disponible."}
              >
                {centre.isSuspended ? "Reactiva" : "Suspèn"}
              </ConfirmSubmitButton>
            </form>
          </ActionRow>

          <DestructiveActionForm
            action={resetAdminCentreResponsesAction}
            buttonLabel="Elimina les respostes"
            centreId={centre.id}
            description="Elimina respostes i bloquejos anònims, però conserva l’espai, l’enllaç i la configuració."
            disabled={!centre.space || centre.totalSubmissions === 0}
            title="Reinicia les respostes"
          />
          <DestructiveActionForm
            action={resetAdminCentreSpaceAction}
            buttonLabel="Reinicia el qüestionari"
            centreId={centre.id}
            description="Elimina les respostes, assigna la versió activa i genera enllaços i tokens nous."
            disabled={!centre.space}
            title="Reinicia completament l’espai"
          />

          <div className="border-t border-danger-border pt-5">
            <h4 className="font-semibold text-danger-text">Elimina definitivament el centre</h4>
            <p className="mt-1 text-sm leading-6 text-muted">
              Elimina la fitxa, el compte responsable, l’espai i totes les respostes associades. El registre mínim de l’actuació administrativa es conserva.
            </p>
            <form action={deleteAdminCentreAction} className="mt-3 max-w-md">
              <input name="centreId" type="hidden" value={centre.id} />
              <label className="block text-sm text-muted">
                Escriu <strong className="font-semibold text-ink">{deleteConfirmation}</strong> per confirmar
                <input
                  autoComplete="off"
                  className="mt-2 w-full rounded-md border border-danger-border bg-surface px-3 py-2 text-sm"
                  name="confirmation"
                  required
                  type="text"
                />
              </label>
              <ConfirmSubmitButton
                className="mt-3 rounded-md bg-danger-text px-4 py-2 text-sm font-semibold text-white"
                message="Aquesta eliminació és irreversible. Vols eliminar definitivament el centre i totes les seves dades?"
              >
                Elimina definitivament
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>
      </section>

      <section className="border-t border-line pt-8">
        <h3 className="border-l-4 border-action pl-3 text-lg font-semibold text-ink">
          Activitat administrativa recent
        </h3>
        {centre.recentActions.length > 0 ? (
          <ul className="mt-5 divide-y divide-line pl-4 text-sm">
            {centre.recentActions.map((action) => (
              <li className="flex flex-wrap justify-between gap-2 py-3" key={action.id}>
                <span className="font-medium text-ink">
                  {actionLabel(action.action)}
                  {action.affectedSubmissions > minimumResponseCount
                    ? ` · ${action.affectedSubmissions} respostes`
                    : action.affectedSubmissions > 0
                      ? ` · ≤ ${minimumResponseCount} respostes`
                      : ""}
                </span>
                <span className="text-muted">
                  {action.actorName} · {formatDate(action.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 pl-4 text-sm text-muted">Encara no hi ha actuacions registrades.</p>
        )}
      </section>
    </div>
  );
}

function DestructiveActionForm({
  action,
  buttonLabel,
  centreId,
  description,
  disabled,
  title,
}: {
  action: (formData: FormData) => Promise<void>;
  buttonLabel: string;
  centreId: string;
  description: string;
  disabled: boolean;
  title: string;
}) {
  return (
    <ActionRow description={description} title={title}>
      <form action={action}>
        <input name="centreId" type="hidden" value={centreId} />
        <label className="mb-3 flex items-start gap-2 text-xs text-muted">
          <input
            className="mt-0.5 h-4 w-4"
            disabled={disabled}
            name="confirmation"
            required
            type="checkbox"
            value="confirmed"
          />
          Confirmo que aquesta acció elimina dades i no es pot desfer.
        </label>
        <ConfirmSubmitButton
          className="rounded-md border border-danger-border px-3 py-2 text-sm font-semibold text-danger-text hover:bg-danger-bg disabled:opacity-50"
          disabled={disabled}
          message="Aquesta acció és irreversible. Vols continuar?"
        >
          {buttonLabel}
        </ConfirmSubmitButton>
      </form>
    </ActionRow>
  );
}

function ActionRow({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div>
        <h4 className="font-semibold text-ink">{title}</h4>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

function StatusBadge({
  hasSpace,
  suspended,
}: {
  hasSpace: boolean;
  suspended: boolean;
}) {
  const label = suspended ? "Suspès" : hasSpace ? "Actiu" : "Pendent";
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
      suspended
        ? "bg-danger-bg text-danger-text"
        : hasSpace
          ? "bg-success-bg text-success-text"
          : "bg-accent-soft text-muted"
    }`}>
      {label}
    </span>
  );
}

function formatResponseCount(total: number, minimum: number): string {
  if (total === 0) return "Cap resposta";
  if (total <= minimum) return `No supera el llindar (≤ ${minimum})`;
  return `${total} ${total === 1 ? "resposta" : "respostes"}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ca-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function centreHref(
  centreId: string,
  search: string,
  filter: AdminCentreFilter,
): string {
  const params = new URLSearchParams({ centreId, section: "centres" });
  if (search) params.set("q", search);
  if (filter !== "all") params.set("filter", filter);
  return `/admin?${params.toString()}`;
}

function filterLabel(filter: AdminCentreFilter): string {
  return {
    all: "Tots els centres",
    active: "Centres actius",
    suspended: "Centres suspesos",
    pending: "Pendents de configuració",
    active_without_questionnaire: "Centres actius sense qüestionari",
    without_questionnaire: "Sense qüestionari",
    with_questionnaire_without_responses:
      "Amb qüestionari però sense respostes",
    without_responses: "Sense respostes",
  }[filter];
}

function actionLabel(action: AdminCentreAction): string {
  const labels: Record<AdminCentreAction, string> = {
    suspended: "Centre suspès",
    reactivated: "Centre reactivat",
    responses_reset: "Respostes reiniciades",
    space_reset: "Espai reiniciat",
    deleted: "Centre eliminat",
  };
  return labels[action];
}

function sourceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendent de consulta",
    ok: "Verificades",
    not_found: "Centre no trobat",
    unavailable: "Font no disponible",
  };
  return labels[status] ?? "No disponible";
}
