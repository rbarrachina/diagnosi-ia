import { createInterfaceTranslator, type InterfaceTranslator } from "@/lib/i18n/interface-messages";

import { InterfaceText } from "@/components/i18n/interface-text";
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
  t = createInterfaceTranslator("CA"),
}: {
  t?: InterfaceTranslator;
  centre: AdminManagedCentreDetail | null;
  centres: AdminManagedCentreSummary[];
  filter: AdminCentreFilter;
  minimumResponseCount: number;
  search: string;
}) {

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
      <section aria-label={t("llistaDeCentres")}>
        <form action="/admin" className="flex gap-2" method="get">
          <input name="section" type="hidden" value="centres" />
          {filter !== "all" ? (
            <input name="filter" type="hidden" value={filter} />
          ) : null}
          <label className="min-w-0 flex-1 text-sm font-medium text-muted">
            <span className="sr-only"><InterfaceText messageKey="cercaCentres" /></span>
            <input
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
              defaultValue={search}
              maxLength={100}
              name="q"
              placeholder={t("nomCodiMunicipiOCorreu")}
              type="search"
            />
          </label>
          <button
            className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-action-contrast hover:bg-action-hover"
            type="submit"
          ><InterfaceText messageKey="cerca" /></button>
        </form>

        {filter !== "all" ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-accent-soft px-3 py-2 text-xs text-muted">
            <span>
              <InterfaceText messageKey="filtre" />{" "}<strong className="font-semibold text-ink">{filterLabel(filter, t)}
            </strong>
            </span>
            <Link
              className="font-semibold text-action hover:text-action-hover"
              href="/admin?section=centres"
            ><InterfaceText messageKey="mostraTots" /></Link>
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
                  <StatusBadge t={t} hasSpace={item.hasSpace} suspended={item.isSuspended} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {formatResponseCount(item.totalSubmissions, minimumResponseCount, t)}
                </p>
              </Link>
            ))
          ) : (
            <p className="px-3 py-8 text-sm text-muted">
              <InterfaceText messageKey="noSHaTrobatCapCentre" />
            </p>
          )}
        </div>
      </section>

      {centre ? (
        <CentreDetail t={t} centre={centre} minimumResponseCount={minimumResponseCount} />
      ) : (
        <section className="py-8 text-sm text-muted">
          <InterfaceText messageKey="seleccionaUnCentrePerConsultarNeLaFitxaILesAccions" />
        </section>
      )}
    </div>
  );
}

function CentreDetail({
  centre,
  minimumResponseCount,
  t = createInterfaceTranslator("CA"),
}: {
  t?: InterfaceTranslator;
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
              <InterfaceText messageKey="fitxaDelCentre" />
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              {centre.displayName}
            </h2>
          </div>
          <StatusBadge t={t} hasSpace={centre.hasSpace} suspended={centre.isSuspended} />
        </div>
        <dl className="mt-6 grid gap-x-8 gap-y-5 border-t border-line pt-6 sm:grid-cols-2">
          <Detail label={t("codiOficial")} value={centre.officialCode ?? t("noDisponible")} />
          <Detail label={t("correuInstitucional")} value={centre.centreEmail} />
          <Detail label={t("municipi")} value={centre.municipality ?? t("noDisponible")} />
          <Detail label={t("areaTerritorial")} value={centre.territorialArea ?? t("noDisponible")} />
          <Detail label={t("serveiEducatiu")} value={centre.educationalService ?? t("noDisponible")} />
          <Detail
            label={t("fitxaConfirmada")}
            value={centre.profileConfirmedAt ? formatDate(centre.profileConfirmedAt) : t("pendent")}
          />
          <Detail label={t("dadesInstitucionals")} value={sourceStatusLabel(centre.sourceStatus, t)} />
        </dl>
      </section>

      <section className="border-t border-line pt-8">
        <h3 className="border-l-4 border-action pl-3 text-lg font-semibold text-ink">
          <InterfaceText messageKey="identificacioIAcces" />
        </h3>
        <dl className="mt-5 grid gap-x-8 gap-y-5 pl-4 sm:grid-cols-2">
          <Detail label={t("responsable")} value={centre.responsibleName ?? t("senseNomVisible")} />
          <Detail label={t("correuResponsable")} value={centre.responsibleEmail} />
          <Detail label={t("primerRegistre")} value={formatDate(centre.responsibleCreatedAt)} />
          <Detail
            label={t("darrerAcces")}
            value={centre.lastLoginAt ? formatDate(centre.lastLoginAt) : t("encaraNoConsta")}
          />
          <Detail label={t("accesXtec")} value={centre.allowXtec ? t("admes") : t("noAdmes")} />
          <Detail label={t("dominiDelCentre")} value={centre.customDomain ? `@${centre.customDomain}` : t("noConfigurat")} />
          <Detail
            label={t("politicaDeCorreus")}
            value={centre.emailPolicyConfiguredAt ? t("configurada") : t("pendent")}
          />
        </dl>
        <p className="mt-4 pl-4 text-xs leading-5 text-muted">
          <InterfaceText messageKey="lAplicacioNoDesaNiMostraElsCorreusDelProfessoratParticipant" />
        </p>
      </section>

      <section className="border-t border-line pt-8">
        <h3 className="border-l-4 border-action pl-3 text-lg font-semibold text-ink">
          <InterfaceText messageKey="questionariIResultats" />
        </h3>
        <dl className="mt-5 grid gap-x-8 gap-y-5 pl-4 sm:grid-cols-2">
          <Detail
            label={t("questionari")}
            value={centre.space ? `${centre.space.questionnaireVersion} · ${centre.space.questionnaireTitle}` : t("senseEspai")}
          />
          <Detail
            label={t("respostes")}
            value={formatResponseCount(centre.totalSubmissions, minimumResponseCount, t)}
          />
          <Detail label={t("codiPublic")} value={centre.space?.publicCode ?? t("noDisponible")} />
          <Detail
            label={t("estatDeLEspai")}
            value={centre.space?.isActive ? t("publicat") : centre.space ? t("tancat") : t("senseEspai")}
          />
        </dl>
        {centre.space && centre.totalSubmissions > minimumResponseCount ? (
          <Link
            className="ml-4 mt-5 inline-flex rounded-md border border-line px-4 py-2 text-sm font-semibold text-action hover:bg-accent-soft"
            href={`/admin?section=results&scope=centre&centreId=${encodeURIComponent(centre.id)}&questionnaireId=${encodeURIComponent(centre.space.questionnaireId)}`}
          ><InterfaceText messageKey="consultaElsResultatsAgregats" /></Link>
        ) : null}
      </section>

      <section className="border-t border-line pt-8">
        <h3 className="border-l-4 border-action pl-3 text-lg font-semibold text-ink">
          <InterfaceText messageKey="accionsAdministratives" />
        </h3>
        <div className="mt-5 space-y-5 pl-4">
          <ActionRow
            description={centre.isSuspended ? t("tornaAPermetreLAccesDelResponsableIActivaLEspai") : t("impedeixLAccesDelResponsableIDesactivaElQuestionariPublic")}
            title={centre.isSuspended ? t("reactivaElCentre") : t("suspenElCentre")}
          >
            <form action={setAdminCentreSuspendedAction}>
              <input name="centreId" type="hidden" value={centre.id} />
              <input name="suspended" type="hidden" value={centre.isSuspended ? "false" : "true"} />
              <ConfirmSubmitButton
                className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-soft"
                message={centre.isSuspended ? t("volsReactivarAquestCentre") : t("volsSuspendreAquestCentreElQuestionariPublicDeixaraDEstarDisponible")}
              >
                {centre.isSuspended ? t("reactiva") : t("suspen")}
              </ConfirmSubmitButton>
            </form>
          </ActionRow>

          <DestructiveActionForm
        t={t}
            action={resetAdminCentreResponsesAction}
            buttonLabel={t("eliminaLesRespostes")}
            centreId={centre.id}
            description={t("eliminaRespostesIVinculacionsPseudonimesPeroConservaLEspaiLEnllac")}
            disabled={!centre.space || centre.totalSubmissions === 0}
            title={t("reiniciaLesRespostes")}
          />
          <DestructiveActionForm
        t={t}
            action={resetAdminCentreSpaceAction}
            buttonLabel={t("reiniciaElQuestionari")}
            centreId={centre.id}
            description={t("eliminaLesRespostesAssignaLaVersioActivaIGeneraEnllacosI")}
            disabled={!centre.space}
            title={t("reiniciaCompletamentLEspai")}
          />

          <div className="border-t border-danger-border pt-5">
            <h4 className="font-semibold text-danger-text">
              <InterfaceText messageKey="eliminaDefinitivamentElCentre" />
            </h4>
            <p className="mt-1 text-sm leading-6 text-muted">
              <InterfaceText messageKey="eliminaLaFitxaElCompteResponsableLEspaiITotesLes" />
            </p>
            <form action={deleteAdminCentreAction} className="mt-3 max-w-md">
              <input name="centreId" type="hidden" value={centre.id} />
              <label className="block text-sm text-muted">
                <InterfaceText messageKey="escriu" />{" "}<strong className="font-semibold text-ink">{deleteConfirmation}</strong>{" "}<InterfaceText messageKey="perConfirmar" />{" "}<input
                  autoComplete="off"
                  className="mt-2 w-full rounded-md border border-danger-border bg-surface px-3 py-2 text-sm"
                  name="confirmation"
                  required
                  type="text"
                />
              </label>
              <ConfirmSubmitButton
                className="mt-3 rounded-md bg-danger-text px-4 py-2 text-sm font-semibold text-white"
                message={t("aquestaEliminacioEsIrreversibleVolsEliminarDefinitivamentElCentreITotes")}
              ><InterfaceText messageKey="eliminaDefinitivament" /></ConfirmSubmitButton>
            </form>
          </div>
        </div>
      </section>

      <section className="border-t border-line pt-8">
        <h3 className="border-l-4 border-action pl-3 text-lg font-semibold text-ink">
          <InterfaceText messageKey="activitatAdministrativaRecent" />
        </h3>
        {centre.recentActions.length > 0 ? (
          <ul className="mt-5 divide-y divide-line pl-4 text-sm">
            {centre.recentActions.map((action) => (
              <li className="flex flex-wrap justify-between gap-2 py-3" key={action.id}>
                <span className="font-medium text-ink">
                  {actionLabel(action.action, t)}
                  {action.affectedSubmissions > minimumResponseCount
                    ? t("value0Respostes", { value0: action.affectedSubmissions })
                    : action.affectedSubmissions > 0
                      ? t("value0Respostes2", { value0: minimumResponseCount })
                      : ""}
                </span>
                <span className="text-muted">
                  {action.actorName} · {formatDate(action.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 pl-4 text-sm text-muted">
            <InterfaceText messageKey="encaraNoHiHaActuacionsRegistrades" />
          </p>
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
  t = createInterfaceTranslator("CA"),
}: {
  t?: InterfaceTranslator;
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
          /><InterfaceText messageKey="confirmoQueAquestaAccioEliminaDadesINoEsPotDesfer" /></label>
        <ConfirmSubmitButton
          className="rounded-md border border-danger-border px-3 py-2 text-sm font-semibold text-danger-text hover:bg-danger-bg disabled:opacity-50"
          disabled={disabled}
          message={t("aquestaAccioEsIrreversibleVolsContinuar")}
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
  t = createInterfaceTranslator("CA"),
}: {
  t?: InterfaceTranslator;
  hasSpace: boolean;
  suspended: boolean;
}) {

  const label = suspended ? t("suspes") : hasSpace ? t("actiu") : t("pendent");
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

function formatResponseCount(total: number, minimum: number, t: InterfaceTranslator): string {
  if (total === 0) return t("capResposta");
  if (total <= minimum) return t("noSuperaElLlindarValue0", { value0: minimum });
  return `${total} ${total === 1 ? t("resposta2") : t("respostes3")}`;
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

function filterLabel(filter: AdminCentreFilter, t: InterfaceTranslator): string {
  return {
    all: t("totsElsCentres"),
    active: t("centresActius"),
    suspended: t("centresSuspesos"),
    pending: t("pendentsDeConfiguracio"),
    active_without_questionnaire: t("centresActiusSenseQuestionari"),
    without_questionnaire: t("senseQuestionari"),
    with_questionnaire_without_responses:
      t("ambQuestionariPeroSenseRespostes"),
    without_responses: t("senseRespostes"),
  }[filter];
}

function actionLabel(action: AdminCentreAction, t: InterfaceTranslator): string {
  const labels: Record<AdminCentreAction, string> = {
    suspended: t("centreSuspes"),
    reactivated: t("centreReactivat"),
    responses_reset: t("respostesReiniciades"),
    space_reset: t("espaiReiniciat"),
    deleted: t("centreEliminat"),
  };
  return labels[action];
}

function sourceStatusLabel(status: string, t: InterfaceTranslator): string {
  const labels: Record<string, string> = {
    pending: t("pendentDeConsulta"),
    ok: t("verificades"),
    not_found: t("centreNoTrobat"),
    unavailable: t("fontNoDisponible"),
  };
  return labels[status] ?? t("noDisponible");
}
