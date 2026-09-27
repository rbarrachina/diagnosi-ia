import type { InterfaceMessageKey } from "@/lib/i18n/interface-messages";
import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";

import { InterfaceText } from "@/components/i18n/interface-text";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { LoginButton, LogoutButton } from "@/components/auth/auth-actions";
import type { AdminSection } from "@/components/admin/admin-navigation";
import { AdminRouteFrame } from "@/components/admin/admin-route-frame";
import { AdminResultsFilters } from "@/components/admin/admin-results-filters";
import { AdminCentresPanel } from "@/components/admin/admin-centres-panel";
import { AdminSummaryPanel } from "@/components/admin/admin-summary-panel";
import { CentreAppShell } from "@/components/create-space/centre-app-shell";
import { SiteFooter } from "@/components/home/site-footer";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AppHeader } from "@/components/layout/app-header";
import { AdminResultsClient } from "@/components/results/admin-results-client";
import {
  addAdminUserAction,
  activateQuestionnaireVersionAction,
  createQuestionnaireVersionAction,
  deleteQuestionnaireVersionAction,
  deleteAdminUserAction,
  deletePendingAdminEmailInvitationAction,
  setResponsibleAccessModeAction,
  setResponsiblePortalStatusAction,
  setAdminUserActiveAction,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/app/admin/activation-button";
import { QuestionnaireEditorForm } from "@/app/admin/questionnaire-editor-form";
import { listAdminCentresWithResults } from "@/lib/admin/centres";
import {
  listAdminEmailInvitations,
  listAdminUsers,
} from "@/lib/admin/admin-users";
import { getAdminSessionState } from "@/lib/admin/auth";
import {
  getAdminResultsMinimumSubmissions,
  getResponsibleAccessMode,
  getResponsiblePortalStatus,
  type ResponsibleAccessMode,
  type ResponsiblePortalStatus,
} from "@/lib/auth/responsible-access";
import { getCommunicationTemplate } from "@/lib/admin/communication-settings";
import { getLanguageSettings } from "@/lib/admin/language-settings";
import {
  getAdminManagedCentre,
  listAdminManagedCentres,
  type AdminCentreFilter,
} from "@/lib/admin/centre-management";
import { getAdminSummary } from "@/lib/admin/summary";
import {
  QUESTIONNAIRE_CODE_PLACEHOLDER,
  QUESTIONNAIRE_URL_PLACEHOLDER,
  type CommunicationTemplate,
} from "@/lib/communication/email-template";
import type {
  AdminCentreOption,
  AdminEmailInvitationSummary,
  AdminQuestionnaireDetail,
  AdminQuestionnaireSummary,
  AdminUserSummary,
} from "@/lib/admin/types";
import {
  AVAILABLE_LANGUAGES,
  DEFAULT_LANGUAGE_SETTINGS,
  type LanguageSettings,
} from "@/lib/i18n/languages";
import {
  getQuestionnaireVersionDetail,
  listQuestionnaireVersions,
} from "@/lib/admin/questionnaires";
import { getAggregatedResultsForQuestionnaireVersion } from "@/lib/results/get-results";
import {
  MAX_QUESTION_BLOCKS,
  MAX_QUESTIONS_PER_BLOCK,
  centreIdSchema,
  questionnaireIdSchema,
  type AdminResultsScopeInput,
} from "@/lib/validation/schemas";
import {
  QUESTIONNAIRE_LANGUAGE_CODES,
  QUESTIONNAIRE_LANGUAGE_LABELS,
} from "@/lib/questionnaire/languages";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerInterfaceTranslator();
  return {
    title: t("administracio"),
  };
}

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    centreId?: string;
    filter?: string;
    questionnaireId?: string;
    q?: string;
    scope?: string;
    section?: string;
    status?: string;
  }>;
};

const statusMessages: Record<string, InterfaceMessageKey> = {
  activated: "versioActivada",
  "admin-added": "invitacioDAdministradorCreada",
  "admin-deleted": "rolDAdministradorEliminat",
  "admin-invitation-deleted": "invitacioPendentEliminada",
  "admin-updated": "estatDeLAdministradorActualitzat",
  "centre-deleted": "centreIDadesAssociadesEliminats",
  "centre-reactivated": "centreReactivat2",
  "centre-responses-reset": "respostesDelCentreEliminades",
  "centre-space-reset": "espaiDelCentreReiniciat",
  "centre-suspended": "centreSuspes2",
  copied: "versioCopiada",
  created: "esborranyCreat",
  deleted: "questionariEliminat",
  saved: "contingutDesat",
  "settings-saved": "configuracioDesada",
  "portal-closed": "serveiTancatEnModeDePrellancament",
  "portal-opened": "serveiObert",
};

const errorMessages: Record<string, InterfaceMessageKey> = {
  "activation-confirmation": "calConfirmarLActivacio",
  activate: "noSHaPogutActivarLaVersioRevisaQueSiguiCompleta",
  "admin-add": "noSHaPogutCrearLaInvitacioRevisaQueSiguiUn",
  "admin-delete": "noSHaPogutEliminarElRolDAdministrador",
  "admin-invitation-delete": "noSHaPogutEliminarLaInvitacioPendent",
  "admin-update": "noSHaPogutActualitzarLAdministrador",
  "centre-action": "noSHaPogutCompletarLAccioSobreElCentre",
  "centre-confirmation": "noSHaPogutCompletarLAccioRevisaLaConfirmacio",
  copy: "noSHaPogutCopiarLaVersio",
  create: "noSHaPogutCrearLaVersioRevisaQueLesDades",
  "create-title-exists": "noSHaPogutCrearLaVersioPerqueElTitolJa",
  "create-version-exists": "noSHaPogutCrearLaVersioPerqueLaVersioJa",
  delete: "noSHaPogutEliminarElQuestionari",
  "delete-confirmation": "calConfirmarLEliminacioTotal",
  save: "noSHaPogutDesarRevisaLAvisDEdicioI",
  settings: "noSHaPogutDesarLaConfiguracio",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ca-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getAdminSection(params: { error?: string; section?: string; status?: string }) {
  if (
    params.section === "summary" ||
    params.section === "admins" ||
    params.section === "centres" ||
    params.section === "questionnaires" ||
    params.section === "results" ||
    params.section === "settings"
  ) {
    return params.section;
  }

  if (
    params.status === "admin-added" ||
    params.status === "admin-updated" ||
    params.status === "settings-saved" ||
    params.status === "portal-closed" ||
    params.status === "portal-opened" ||
    params.error === "admin-add" ||
    params.error === "admin-update" ||
    params.error === "settings"
  ) {
    return params.status === "settings-saved" ||
      params.status === "portal-closed" ||
      params.status === "portal-opened" ||
      params.error === "settings"
      ? "settings"
      : "admins";
  }

  return "summary";
}

function getSelectedQuestionnaireId(
  requestedId: string | undefined,
  versions: AdminQuestionnaireSummary[],
) {
  if (
    requestedId &&
    questionnaireIdSchema.safeParse(requestedId).success &&
    versions.some((version) => version.id === requestedId)
  ) {
    return requestedId;
  }

  return (
    versions.find((version) => version.isActive)?.id ??
    versions[0]?.id ??
    null
  );
}

function getRequestedQuestionnaireId(
  requestedId: string | undefined,
  versions: AdminQuestionnaireSummary[],
) {
  if (
    requestedId &&
    questionnaireIdSchema.safeParse(requestedId).success &&
    versions.some((version) => version.id === requestedId)
  ) {
    return requestedId;
  }

  return null;
}

function getAdminCentreFilter(value: string | undefined): AdminCentreFilter {
  return value === "active" ||
    value === "suspended" ||
    value === "pending" ||
    value === "active_without_questionnaire" ||
    value === "without_questionnaire" ||
    value === "with_questionnaire_without_responses" ||
    value === "without_responses"
    ? value
    : "all";
}

function AdminEntryShell({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell min-h-screen text-ink">
      <AppHeader brandHref="/">
        <ThemeToggle />
      </AppHeader>

      <div
        aria-hidden="true"
        className="app-grid pointer-events-none fixed inset-0 opacity-50"
      />
      <div aria-hidden="true" className="app-orb app-orb-left fixed" />
      <div aria-hidden="true" className="app-orb app-orb-right fixed" />

      <div className="relative flex min-h-screen flex-col pt-20">
        <section
          className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-12"
          id="inici"
          tabIndex={-1}
        >
          {children}
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}

async function AdminAccessDenied({
  email,
  reason,
}: {
  email: string | null;
  reason: "not_admin" | "not_xtec";
}) {
  const t = await getServerInterfaceTranslator();
  return (
    <AdminEntryShell>
      <div className="rounded-2xl border border-danger-border bg-danger-bg p-7 text-center text-danger-text shadow-[0_16px_48px_var(--app-shadow)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">
          <InterfaceText messageKey="administracio" />
        </p>
        <h1 className="mt-3 text-2xl font-semibold"><InterfaceText messageKey="accesNoAutoritzat" /></h1>
        <p className="mt-3 text-sm leading-6">
          {reason === "not_xtec"
            ? t("nomesEsPermetLAccesAmbUnCompteXtec2")
            : t("aquestCompteNoTePermisosDAdministracioActius")}
        </p>
        {email ? <p className="mt-2 text-sm font-medium">{email}</p> : null}
        <div className="mt-5 flex justify-center">
          <LogoutButton next="/admin" />
        </div>
      </div>
    </AdminEntryShell>
  );
}

function AdminSetupError() {
  return (
    <AdminEntryShell>
      <div className="rounded-2xl border border-warning-border bg-warning-bg p-7 text-center text-warning-text shadow-[0_16px_48px_var(--app-shadow)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">
          <InterfaceText messageKey="administracio" />
        </p>
        <h1 className="mt-3 text-2xl font-semibold">
          <InterfaceText messageKey="administracioNoConfigurada" />
        </h1>
        <p className="mt-3 text-sm leading-6">
          <InterfaceText messageKey="calAplicarLesMigracionsDAdministracioALaBaseDeDades" />
        </p>
        <p className="mt-3 text-sm leading-6">
          <InterfaceText messageKey="revisaQueExisteixiAdmin_usersAMysqlIQueLaConfiguracioLocal" />
        </p>
        <div className="mt-5 flex justify-center">
          <LogoutButton next="/admin" />
        </div>
      </div>
    </AdminEntryShell>
  );
}

function VersionList({
  selectedQuestionnaireId,
  versions,
}: {
  selectedQuestionnaireId: string | null;
  versions: AdminQuestionnaireSummary[];
}) {
  return (
    <section className="admin-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink"><InterfaceText messageKey="versions" /></h2>
          <p className="mt-1 text-sm text-muted">
            {versions.length}{" "}<InterfaceText messageKey="versionsDeQuestionari" /></p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {versions.map((version) => {
          const isSelected = version.id === selectedQuestionnaireId;

          return (
            <Link
              className={`block rounded-md border p-4 transition ${
                isSelected
                  ? "border-action bg-accent-soft"
                  : "border-line bg-surface hover:border-action"
              }`}
              href={`/admin?section=questionnaires&questionnaireId=${version.id}`}
              key={version.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{version.version}</span>
                    {version.isActive ? (
                      <span className="rounded bg-success-bg px-2 py-0.5 text-xs font-semibold text-success-text">
                        <InterfaceText messageKey="activa" />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">{version.title}</p>
                </div>
                <span className="text-xs text-muted">ID {version.id}</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-muted">
                <span>{version.blockCount}{" "}<InterfaceText messageKey="blocs" /></span>
                <span>{version.questionCount}{" "}<InterfaceText messageKey="preguntes" /></span>
                <span>{version.diagnosticSpaceCount}{" "}<InterfaceText messageKey="espais" /></span>
                <span>{version.totalSubmissions}{" "}<InterfaceText messageKey="respostes3" /></span>
              </div>
            </Link>
          );
        })}

        {versions.length === 0 ? (
          <p className="rounded-md border border-dashed border-line p-4 text-sm text-muted">
            <InterfaceText messageKey="encaraNoHiHaCapVersio" />
          </p>
        ) : null}
      </div>
    </section>
  );
}

async function AdminResultsPanel({
  centres,
  minimumResponseCount,
  selectedCentreId,
  selectedQuestionnaireId,
  selectedScope,
  versions,
}: {
  centres: AdminCentreOption[];
  minimumResponseCount: number;
  selectedCentreId: string | null;
  selectedQuestionnaireId: string | null;
  selectedScope: AdminResultsScopeInput;
  versions: AdminQuestionnaireSummary[];
}) {
  const t = await getServerInterfaceTranslator();
  const selectedVersion = versions.find((version) => version.id === selectedQuestionnaireId);

  return (
    <div className="space-y-8">
      <section className="border-b border-line pb-8">
        <AdminResultsFilters
          centres={centres}
          selectedCentreId={selectedCentreId}
          selectedQuestionnaireId={selectedQuestionnaireId}
          selectedScope={selectedScope}
          versions={versions}
        />
      </section>

      {selectedQuestionnaireId &&
      selectedVersion &&
      (selectedScope === "all" || selectedCentreId) ? (
        <AdminResultsContent
          centreId={selectedCentreId}
          minimumResponseCount={minimumResponseCount}
          questionnaireId={selectedQuestionnaireId}
          scope={selectedScope}
        />
      ) : (
        <p className="py-8 text-sm text-muted">
          {versions.length === 0
            ? t("encaraNoHiHaCapVersioDeQuestionariPerMostrar")
            : t("triaUnaVersioDelQuestionariPerGenerarElsResultats")}
        </p>
      )}
    </div>
  );
}

async function AdminResultsContent({
  centreId,
  minimumResponseCount,
  questionnaireId,
  scope,
}: {
  centreId: string | null;
  minimumResponseCount: number;
  questionnaireId: string;
  scope: AdminResultsScopeInput;
}) {
  const results = await getAggregatedResultsForQuestionnaireVersion(
    scope === "centre" && centreId
      ? { centreId, questionnaireId, scope }
      : { questionnaireId, scope: "all" },
  );

  if (scope === "centre" && results.totalSubmissions === 0) {
    return (
      <p className="rounded-md border border-warning-border bg-warning-bg px-4 py-3 text-sm leading-6 text-warning-text">
        <InterfaceText messageKey="aquestCentreNoSuperaElLlindarMinimDeRespostesINo" />
      </p>
    );
  }

  return (
    <AdminResultsClient
      centreId={scope === "centre" ? centreId : null}
      minimumResponseCount={minimumResponseCount}
      questionnaireId={questionnaireId}
      results={results}
      scope={scope}
    />
  );
}

async function DraftForms({ versions }: { versions: AdminQuestionnaireSummary[] }) {
  const t = await getServerInterfaceTranslator();
  return (
    <section className="admin-panel p-5">
      <h2 className="text-lg font-semibold text-ink"><InterfaceText messageKey="novaVersio" /></h2>
      <form action={createQuestionnaireVersionAction} className="mt-5 max-w-xl space-y-4">
        <label className="block text-sm font-medium text-muted">
          <InterfaceText messageKey="versio" />{" "}<input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            name="version"
            placeholder="2026-27 v1"
            required
          />
        </label>
        <label className="block text-sm font-medium text-muted">
          <InterfaceText messageKey="titol" />{" "}<input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            name="title"
            placeholder={t("diagnosiIaQuestionari202627V1")}
            required
          />
        </label>
        <label className="block text-sm font-medium text-muted">
          <InterfaceText messageKey="minutsPerRespondreLa" />{" "}<input
            className="mt-1 w-28 rounded-md border border-line px-3 py-2 text-sm"
            defaultValue={10}
            max={120}
            min={1}
            name="estimatedMinutes"
            required
            type="number"
          />
        </label>
        <label className="block text-sm font-medium text-muted">
          <InterfaceText messageKey="idiomaDelQuestionariIDelsInformes" />{" "}<select
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            defaultValue="ca"
            name="languageCode"
            required
          >
            {QUESTIONNAIRE_LANGUAGE_CODES.map((code) => (
              <option key={code} value={code}>
                {QUESTIONNAIRE_LANGUAGE_LABELS[code]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-muted">
          <InterfaceText messageKey="puntDePartida" />{" "}<select
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            name="sourceQuestionnaireId"
            required
          >
            <option value="blank"><InterfaceText messageKey="questionariEnBlanc" /></option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                <InterfaceText messageKey="copia" />{" "}{version.version} · {version.title}
              </option>
            ))}
          </select>
        </label>
        <div>
          <button
            className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-action-contrast hover:bg-action-hover"
            type="submit"
          ><InterfaceText messageKey="creaVersio" /></button>
        </div>
      </form>
    </section>
  );
}

type QuestionnaireEditorFeedback = {
  message: string;
  tone: "error" | "success";
};

async function QuestionnaireEditor({
  detail,
  feedback,
}: {
  detail: AdminQuestionnaireDetail | null;
  feedback?: QuestionnaireEditorFeedback | null;
}) {
  const t = await getServerInterfaceTranslator();
  if (!detail) {
    return (
      <section className="admin-panel p-5">
        <h2 className="text-lg font-semibold text-ink"><InterfaceText messageKey="editor" /></h2>
        <p className="mt-3 text-sm text-muted"><InterfaceText messageKey="seleccionaOCreaUnaVersio" /></p>
      </section>
    );
  }

  const isAssignedToSpace = detail.diagnosticSpaceCount > 0;
  const isComplete =
    detail.blocks.length >= 1 &&
    detail.blocks.length <= MAX_QUESTION_BLOCKS &&
    detail.blocks.every(
      (block) =>
        block.questions.length >= 1 &&
        block.questions.length <= MAX_QUESTIONS_PER_BLOCK &&
        block.questions.every(
          (question) =>
            question.options.length === 4 &&
            question.options.every((option) => option.text.trim().length > 0),
        ),
    );

  return (
    <section className="admin-panel p-5">
      <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">
              {detail.version} · ID {detail.id}
            </h2>
            {detail.isActive ? (
              <span className="rounded bg-success-bg px-2 py-0.5 text-xs font-semibold text-success-text">
                <InterfaceText messageKey="activa" />
              </span>
            ) : null}
            {isAssignedToSpace ? (
              <span className="rounded bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning-text">
                <InterfaceText messageKey="assignadaAEspais" />
              </span>
            ) : (
              <span className="rounded bg-accent-soft px-2 py-0.5 text-xs font-semibold text-muted">
                <InterfaceText messageKey="senseEspais" />
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">
            {detail.blockCount}{" "}<InterfaceText messageKey="blocs2" />{" "}{detail.questionCount}{" "}<InterfaceText messageKey="preguntes2" />{" "}
            {detail.diagnosticSpaceCount}{" "}<InterfaceText messageKey="espais2" />{" "}{detail.totalSubmissions}{" "}<InterfaceText messageKey="respostes4" />{" "}
            {detail.estimatedMinutes}{" "}<InterfaceText messageKey="minutsCreadaEl" />{" "}{formatDate(detail.createdAt)}.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <form action={activateQuestionnaireVersionAction} className="flex flex-col items-start gap-2">
            <input name="questionnaireId" type="hidden" value={detail.id} />
            <label className="flex items-center gap-2 text-xs font-medium text-muted">
              <input
                className="h-4 w-4"
                disabled={detail.isActive || !isComplete}
                name="confirmActivation"
                type="checkbox"
                value="yes"
              /><InterfaceText messageKey="confirmoLActivacio" /></label>
            <ConfirmSubmitButton
              className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-action-contrast hover:bg-action-hover disabled:bg-muted"
              disabled={detail.isActive || !isComplete}
              message={t("volsActivarLaVersioValue0ElsEspaisExistentsConservaranLaSeva", { value0: detail.version })}
            ><InterfaceText messageKey="activaVersio" /></ConfirmSubmitButton>
            {!isComplete ? (
              <p className="max-w-xs text-xs text-warning-text">
                <InterfaceText messageKey="calAlmenys1BlocI1PreguntaPerBlocMaxim10" />
              </p>
            ) : null}
          </form>
          {!detail.isActive ? (
            <form action={deleteQuestionnaireVersionAction} className="flex flex-col items-start gap-2">
              <input name="questionnaireId" type="hidden" value={detail.id} />
              <label className="flex items-center gap-2 text-xs font-medium text-danger-text">
                <input
                  className="h-4 w-4"
                  name="confirmDeletion"
                  type="checkbox"
                  value="yes"
                /><InterfaceText messageKey="confirmoLEliminacioTotal" /></label>
              <ConfirmSubmitButton
                className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold text-danger-text hover:bg-danger-bg"
                message={t("volsEliminarDefinitivamentLaVersioValue0SEliminaranTambeTotsEls", { value0: detail.version })}
              ><InterfaceText messageKey="eliminaQuestionari" /></ConfirmSubmitButton>
            </form>
          ) : null}
        </div>
      </div>

      <QuestionnaireEditorForm
        detail={detail}
        feedback={feedback}
        isLocked={isAssignedToSpace}
        key={detail.id}
      />
    </section>
  );
}

async function AdminUsersPanel({
  admins,
  currentUserId,
  invitations,
}: {
  admins: AdminUserSummary[];
  currentUserId: string;
  invitations: AdminEmailInvitationSummary[];
}) {
  const t = await getServerInterfaceTranslator();
  return (
    <section aria-label={t("administradors")}>
      <form
        action={addAdminUserAction}
        className="flex flex-col gap-3 border-b border-line pb-8 sm:flex-row sm:items-end"
      >
        <label className="w-full max-w-xs text-sm font-medium text-muted">
          <InterfaceText messageKey="afegeixUnaPersonaAdministradora" />{" "}<input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            name="email"
            placeholder="persona@xtec.cat"
            required
            type="email"
          />
        </label>
        <button
          className="self-start rounded-md bg-action px-4 py-2 text-sm font-semibold text-action-contrast hover:bg-action-hover sm:self-auto"
          type="submit"
        ><InterfaceText messageKey="convida" /></button>
      </form>

      {invitations.length > 0 ? (
        <section className="border-b border-line py-8">
          <h3 className="text-sm font-semibold text-ink">
            <InterfaceText messageKey="invitacionsPendents" />
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase text-muted">
                <tr>
                  <th className="py-2 pr-3 font-semibold"><InterfaceText messageKey="correu" /></th>
                  <th className="py-2 pr-3 font-semibold"><InterfaceText messageKey="creada" /></th>
                  <th className="py-2 pr-3 font-semibold"><InterfaceText messageKey="estat" /></th>
                  <th className="py-2 pr-3 font-semibold"><InterfaceText messageKey="accio" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invitations.map((invitation) => (
                  <tr key={invitation.email}>
                    <td className="py-3 pr-3 text-muted">{invitation.email}</td>
                    <td className="py-3 pr-3 text-muted">
                      {formatDate(invitation.createdAt)}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="rounded bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning-text">
                        <InterfaceText messageKey="pendent" />
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <form action={deletePendingAdminEmailInvitationAction}>
                        <input name="email" type="hidden" value={invitation.email} />
                        <button
                          className="rounded-md border border-danger-border px-3 py-1.5 text-xs font-semibold text-danger-text hover:bg-danger-bg"
                          type="submit"
                        ><InterfaceText messageKey="elimina" /></button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <p className="border-b border-line py-8 text-sm text-muted">
          <InterfaceText messageKey="encaraNoHiHaInvitacionsDAdministracioPendents" />
        </p>
      )}

      <div className="pt-8">
        <h2 className="text-lg font-semibold text-ink"><InterfaceText messageKey="administradors" /></h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr>
                <th className="py-2 pr-3 font-semibold"><InterfaceText messageKey="nom" /></th>
                <th className="py-2 pr-3 font-semibold"><InterfaceText messageKey="correu" /></th>
                <th className="py-2 pr-3 font-semibold"><InterfaceText messageKey="creat" /></th>
                <th className="py-2 pr-3 font-semibold"><InterfaceText messageKey="darrerAcces" /></th>
                <th className="py-2 pr-3 font-semibold"><InterfaceText messageKey="estat" /></th>
                <th className="py-2 pr-3 font-semibold"><InterfaceText messageKey="accio" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {admins.map((admin) => {
                const isCurrentUser = admin.userId === currentUserId;

                return (
                  <tr key={admin.userId}>
                    <td className="py-3 pr-3 text-muted">
                      {admin.displayName ?? t("senseNom")}
                    </td>
                    <td className="py-3 pr-3 text-muted">
                      {admin.email ?? t("noDisponible")}
                    </td>
                    <td className="py-3 pr-3 text-muted">
                      {formatDate(admin.createdAt)}
                    </td>
                    <td className="py-3 pr-3 text-muted">
                      {admin.lastLoginAt
                        ? formatDate(admin.lastLoginAt)
                        : t("noDisponible")}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${
                            admin.isActive
                              ? "bg-success-bg text-success-text"
                              : "bg-accent-soft text-muted"
                          }`}
                        >
                          {admin.isActive ? t("actiu") : t("inactiu")}
                        </span>
                        {isCurrentUser ? (
                          <span className="rounded bg-accent-soft px-2 py-0.5 text-xs font-semibold text-muted">
                            <InterfaceText messageKey="tu" />
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <form action={setAdminUserActiveAction}>
                          <input name="userId" type="hidden" value={admin.userId} />
                          <input
                            name="isActive"
                            type="hidden"
                            value={admin.isActive ? "false" : "true"}
                          />
                          <button
                            className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-action hover:text-action disabled:text-muted"
                            disabled={isCurrentUser && admin.isActive}
                            type="submit"
                          >
                            {admin.isActive ? t("desactiva") : t("reactiva")}
                          </button>
                        </form>
                        <form action={deleteAdminUserAction}>
                          <input name="userId" type="hidden" value={admin.userId} />
                          <button
                            className="rounded-md border border-danger-border px-3 py-1.5 text-xs font-semibold text-danger-text hover:bg-danger-bg disabled:text-muted"
                            disabled={isCurrentUser}
                            type="submit"
                          ><InterfaceText messageKey="eliminaRol" /></button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function InfoDisclosure({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-info-border text-action transition hover:border-action hover:bg-info-bg hover:text-action-hover focus:outline-none focus:ring-2 focus:ring-focus"
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>
      <span className="absolute left-0 top-full z-10 mt-2 hidden w-72 rounded-md border border-line bg-surface p-3 text-sm font-normal leading-6 text-muted shadow-lg group-hover:block group-focus-within:block sm:w-96">
        {children}
      </span>
    </span>
  );
}

function ResponsibleAccessOption({
  checked,
  children,
  description,
  id,
  infoLabel,
  value,
}: {
  checked: boolean;
  children: ReactNode;
  description: ReactNode;
  id: string;
  infoLabel: string;
  value: ResponsibleAccessMode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 text-sm text-muted">
      <input
        className="mt-1 h-4 w-4"
        defaultChecked={checked}
        id={id}
        name="responsibleAccessMode"
        type="radio"
        value={value}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-semibold text-ink" htmlFor={id}>
            {children}
          </label>
          <InfoDisclosure label={infoLabel}>
            {description}
          </InfoDisclosure>
        </div>
      </div>
    </div>
  );
}

async function SettingsPanel({
  communicationTemplate,
  languageSettings,
  minimumResponseCount,
  responsibleAccessMode,
  responsiblePortalStatus,
}: {
  communicationTemplate: CommunicationTemplate;
  languageSettings: LanguageSettings;
  minimumResponseCount: number;
  responsibleAccessMode: ResponsibleAccessMode;
  responsiblePortalStatus: ResponsiblePortalStatus;
}) {
  const t = await getServerInterfaceTranslator();
  return (
    <section aria-label={t("configuracio")}>
      <div className="mb-10 rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">
              <InterfaceText messageKey="disponibilitatDelServei" />
            </p>
            <h2 className="mt-2 text-xl font-semibold text-ink">
              {responsiblePortalStatus === "open"
                ? t("serveiObert2")
                : t("modeDePrellancament")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {responsiblePortalStatus === "open"
                ? t("elsCentresIElProfessoratPodenAccedirAlServei")
                : t("elsCentresIElProfessoratNoPodenIniciarSessioNiUtilitzar")}
            </p>
            {responsiblePortalStatus === "closed" ? (
              <Link className="mt-3 inline-flex text-sm font-semibold text-action" href="/crear">
                <InterfaceText messageKey="provaLAccesComAAdministrador" />
              </Link>
            ) : null}
          </div>
          <form action={setResponsiblePortalStatusAction}>
            <input
              name="responsiblePortalStatus"
              type="hidden"
              value={responsiblePortalStatus === "open" ? "closed" : "open"}
            />
            <ConfirmSubmitButton
              className={
                responsiblePortalStatus === "open"
                  ? "rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  : "rounded-md bg-action px-4 py-2 text-sm font-semibold text-action-contrast hover:bg-action-hover"
              }
              message={
                responsiblePortalStatus === "open"
                  ? t("volsTancarAraElServeiLesSessionsDeCentreIDocents")
                  : t("volsObrirAraElServeiElsCentresIElProfessoratHi")
              }
            >
              {responsiblePortalStatus === "open"
                ? t("tancaElServei")
                : t("obreElServei")}
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>
      <form action={setResponsibleAccessModeAction}>
        <fieldset className="border-b border-line pb-10">
          <legend className="border-l-4 border-action pl-3 text-lg font-semibold text-ink">
            <InterfaceText messageKey="accesPerAResponsables" />
          </legend>
          <div className="mt-4 max-w-3xl space-y-0.5 pl-4">
            <ResponsibleAccessOption
              checked={responsibleAccessMode === "all_xtec"}
              description={
                <><InterfaceText messageKey="qualsevolCompteAcabatEnXtecCatPotCrearIGestionarEl" /></>
              }
              id="responsible-access-all-xtec"
              infoLabel={t("mesInformacioSobreQualsevolCompteXtec")}
              value="all_xtec"
            ><InterfaceText messageKey="qualsevolCompteXtec" /></ResponsibleAccessOption>
            <ResponsibleAccessOption
              checked={responsibleAccessMode === "centre_xtec"}
              description={
                <><InterfaceText messageKey="nomesElsComptesAmbFormatA0000000XtecCatB0000000XtecCat" /></>
              }
              id="responsible-access-restricted-xtec"
              infoLabel={t("mesInformacioSobreNomesComptesDeCentreXtec")}
              value="centre_xtec"
            ><InterfaceText messageKey="nomesComptesDeCentreXtec" /></ResponsibleAccessOption>
          </div>
        </fieldset>
        <fieldset className="border-b border-line py-10">
          <legend className="border-l-4 border-action pl-3 text-lg font-semibold text-ink">
            <InterfaceText messageKey="resultatsGlobals" />
          </legend>
          <div className="mt-2 pl-4 text-sm text-muted">
            <div className="flex flex-wrap items-center gap-2">
              <label
                className="font-semibold text-ink"
                htmlFor="minimum-response-count"
              ><InterfaceText messageKey="respostesMinimesPerComputar" /></label>
              <input
                className="w-20 rounded-md border border-line px-3 py-2 text-sm"
                defaultValue={minimumResponseCount}
                id="minimum-response-count"
                max={10}
                min={0}
                name="minimumResponseCount"
                required
                type="number"
              />
              <InfoDisclosure label={t("mesInformacioSobreRespostesMinimesPerComputar")}>
                <InterfaceText messageKey="lesEnquestesAmbUnNombreDeRespostesIgualOInferiorA" />
              </InfoDisclosure>
            </div>
          </div>
        </fieldset>
        <fieldset className="border-b border-line py-10">
          <legend className="border-l-4 border-action pl-3 text-lg font-semibold text-ink">
            <InterfaceText messageKey="idiomes" />
          </legend>
          <div className="mt-4 max-w-3xl space-y-4 pl-4 text-sm text-muted">
            <label className="flex items-center gap-3 font-semibold text-ink">
              <input
                className="h-4 w-4"
                defaultChecked={languageSettings.selectorVisible}
                name="languageSelectorVisible"
                type="checkbox"
              /><InterfaceText messageKey="mostraElSelectorDIdiomaALesCapcaleres" /></label>
            <div>
              <p className="font-semibold text-ink"><InterfaceText messageKey="idiomesVisibles" /></p>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
                {AVAILABLE_LANGUAGES.map((language) => {
                  const isCatalan = language.code === "CA";
                  return (
                    <label
                      className="inline-flex items-center gap-2"
                      key={language.code}
                    >
                      {isCatalan ? (
                        <>
                          <input
                            checked
                            className="h-4 w-4"
                            disabled
                            readOnly
                            type="checkbox"
                          />
                          <input
                            name="visibleLanguageCodes"
                            type="hidden"
                            value="CA"
                          />
                        </>
                      ) : (
                        <input
                          className="h-4 w-4"
                          defaultChecked={languageSettings.visibleLanguageCodes.includes(
                            language.code,
                          )}
                          name="visibleLanguageCodes"
                          type="checkbox"
                          value={language.code}
                        />
                      )}
                      <span>
                        <span className="font-semibold text-ink">
                          {language.code}
                        </span>{" "}
                        {language.label}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                <InterfaceText messageKey="elCatalaEsLIdiomaBaseIDeReservaLesLlengues" />
              </p>
            </div>
          </div>
        </fieldset>
        <fieldset className="py-10">
          <legend className="border-l-4 border-action pl-3 text-lg font-semibold text-ink">
            <InterfaceText messageKey="comunicat" />
          </legend>
          <div className="mt-4 max-w-4xl space-y-4 pl-4 text-sm text-muted">
            <p className="text-xs leading-5 text-muted">
              <InterfaceText messageKey="potsUsar" />{" "}<code>{"{NOM_CENTRE}"}</code>{" "}<InterfaceText messageKey="alTitolOAlCos" />{" "}
              <code>{QUESTIONNAIRE_URL_PLACEHOLDER}</code>{" "}<InterfaceText messageKey="perALEnllacI" />{" "}
              <code>{QUESTIONNAIRE_CODE_PLACEHOLDER}</code>{" "}<InterfaceText messageKey="perAlCodiElNomDelCentreNomesApareixeraOnHagis" /></p>
            <label className="block">
              <span className="font-semibold text-ink"><InterfaceText messageKey="titolDelCorreu" /></span>
              <input
                className="mt-2 w-full rounded-md border border-line px-3 py-2 text-sm"
                defaultValue={communicationTemplate.subject}
                maxLength={160}
                name="communicationSubject"
                required
                type="text"
              />
            </label>
            <label className="block">
              <span className="font-semibold text-ink"><InterfaceText messageKey="textDelMissatge" /></span>
              <textarea
                className="mt-2 min-h-56 w-full rounded-md border border-line px-3 py-2 text-sm leading-6"
                defaultValue={communicationTemplate.body}
                maxLength={4000}
                name="communicationBody"
                required
              />
            </label>
            <p className="text-xs leading-5 text-muted">
              <InterfaceText messageKey="laMarca" />{" "}<code>{QUESTIONNAIRE_URL_PLACEHOLDER}</code>{" "}<InterfaceText messageKey="seSubstituiraPerLEnllacPublicI" />{" "}
              <code>{QUESTIONNAIRE_CODE_PLACEHOLDER}</code>{" "}<InterfaceText messageKey="pelCodiDeCadaEspaiSiFaltaAlgunaDeLesDues" /></p>
          </div>
        </fieldset>
        <button
          className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-action-contrast hover:bg-action-hover"
          type="submit"
        ><InterfaceText messageKey="desaConfiguracio" /></button>
      </form>
    </section>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const t = await getServerInterfaceTranslator();
  const params = await searchParams;
  const session = await getAdminSessionState({ allowBootstrap: true });

  if (session.status === "unauthenticated") {
    return (
      <AdminEntryShell>
        <div className="admin-panel p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-action">
            <InterfaceText messageKey="accesRestringit" />
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-ink">
            <InterfaceText messageKey="administracio" />
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            <InterfaceText messageKey="accedeixAmbUnCompteXtecAutoritzatPerGestionarLAplicacio" />
          </p>
          <div className="mt-6">
            <LoginButton next="/admin" />
          </div>
        </div>
      </AdminEntryShell>
    );
  }

  if (session.status === "forbidden") {
    return <AdminAccessDenied email={session.email} reason={session.reason} />;
  }

  if (session.status === "setup_error") {
    return <AdminSetupError />;
  }

  const activeSection = getAdminSection(params);
  const centreFilter = getAdminCentreFilter(params.filter);
  const [
    versions,
    admins,
    adminInvitations,
    responsibleAccessMode,
    responsiblePortalStatus,
    minimumResponseCount,
    communicationTemplate,
    languageSettings,
    managedCentres,
  ] = await Promise.all([
    activeSection === "questionnaires" || activeSection === "results"
      ? listQuestionnaireVersions()
      : Promise.resolve([]),
    activeSection === "admins" ? listAdminUsers() : Promise.resolve([]),
    activeSection === "admins" ? listAdminEmailInvitations() : Promise.resolve([]),
    activeSection === "settings"
      ? getResponsibleAccessMode()
      : Promise.resolve<ResponsibleAccessMode>("all_xtec"),
    activeSection === "settings"
      ? getResponsiblePortalStatus()
      : Promise.resolve<ResponsiblePortalStatus>("closed"),
    activeSection === "settings" ||
    activeSection === "results" ||
    activeSection === "centres" ||
    activeSection === "summary"
      ? getAdminResultsMinimumSubmissions()
      : Promise.resolve(0),
    activeSection === "settings"
      ? getCommunicationTemplate()
      : Promise.resolve({ subject: "", body: "" }),
    activeSection === "settings"
      ? getLanguageSettings()
      : Promise.resolve(DEFAULT_LANGUAGE_SETTINGS),
    activeSection === "centres"
      ? listAdminManagedCentres(params.q ?? "", centreFilter)
      : Promise.resolve([]),
  ]);
  const adminSummary =
    activeSection === "summary"
      ? await getAdminSummary(minimumResponseCount)
      : null;
  const resultCentres =
    activeSection === "results"
      ? await listAdminCentresWithResults(minimumResponseCount)
      : [];
  const requestedManagedCentreId =
    activeSection === "centres" &&
    centreIdSchema.safeParse(params.centreId).success &&
    managedCentres.some((centre) => centre.id === params.centreId)
      ? params.centreId ?? null
      : managedCentres[0]?.id ?? null;
  const managedCentre = requestedManagedCentreId
    ? await getAdminManagedCentre(requestedManagedCentreId)
    : null;
  const selectedQuestionnaireId = getSelectedQuestionnaireId(
    params.questionnaireId,
    versions,
  );
  const selectedResultsQuestionnaireId =
    activeSection === "results"
      ? getRequestedQuestionnaireId(params.questionnaireId, versions)
      : selectedQuestionnaireId;
  const selectedResultsScope: AdminResultsScopeInput =
    params.scope === "centre" ? "centre" : "all";
  const selectedResultsCentreId =
    activeSection === "results" &&
    selectedResultsScope === "centre" &&
    centreIdSchema.safeParse(params.centreId).success &&
    resultCentres.some((centre) => centre.id === params.centreId)
      ? params.centreId ?? null
      : null;
  const selectedDetail = selectedQuestionnaireId
    ? activeSection === "questionnaires"
      ? await getQuestionnaireVersionDetail(selectedQuestionnaireId)
      : null
    : null;
  const questionnaireEditorFeedback =
    activeSection === "questionnaires" && params.status === "saved"
      ? {
          message: t(statusMessages.saved),
          tone: "success" as const,
        }
      : activeSection === "questionnaires" && params.error === "save"
        ? {
            message: t(errorMessages.save),
            tone: "error" as const,
          }
        : null;

  const sectionTitles: Record<AdminSection, { eyebrow: string; title: string; description: string }> = {
    summary: {
      eyebrow: t("visioGeneral"),
      title: t("resum"),
      description: t("consultaLEstatGeneralDeLAplicacioIDelQuestionariActiu"),
    },
    questionnaires: {
      eyebrow: t("contingut"),
      title: t("gestioDeQuestionaris"),
      description: t("creaRevisaIActivaLesVersionsDelQuestionariDeDiagnosi"),
    },
    results: {
      eyebrow: t("visioGlobal"),
      title: t("resultatsAgregats"),
      description: t("consultaLesDadesDeConjuntSenseExposarRespostesIndividuals"),
    },
    centres: {
      eyebrow: t("gestioInstitucional"),
      title: t("centres"),
      description: t("consultaElsRegistresDelsCentresIGestionaNLAccesI"),
    },
    admins: {
      eyebrow: t("acces"),
      title: t("gestioDUsuaris"),
      description: t("administraLesPersonesAutoritzadesAAccedirAlTauler"),
    },
    settings: {
      eyebrow: t("aplicacio"),
      title: t("configuracio"),
      description: t("defineixElsCriterisGlobalsDAccesResultatsIComunicacio"),
    },
  };
  const sectionHeading = sectionTitles[activeSection];

  return (
    <CentreAppShell
      account={{
        email: session.user.email,
        name: session.user.displayName ?? session.user.email,
      }}
      logoutNext="/admin"
    >
      <AdminRouteFrame
        activeSection={activeSection}
        footer={<SiteFooter />}
        selectedQuestionnaireId={selectedResultsQuestionnaireId}
      >
        <section className="admin-content mx-auto w-full max-w-7xl" id="admin-top">
          <header className="mb-8 border-b border-line pb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-action">
              {sectionHeading.eyebrow}{" "}<InterfaceText messageKey="administracio2" /></p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
              {sectionHeading.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
              {sectionHeading.description}
            </p>
            {session.bootstrapped ? (
              <p className="mt-3 text-xs font-medium text-action">
                <InterfaceText messageKey="primerAdministradorCreat" />
              </p>
            ) : null}
          </header>

        {params.status && statusMessages[params.status] ? (
          <div
            className="mb-5 rounded-md border border-success-border bg-success-bg px-4 py-3 text-sm font-medium text-success-text"
            role="status"
          >
            {t(statusMessages[params.status])}
          </div>
        ) : null}

        {params.error && errorMessages[params.error] ? (
          <div
            className="mb-5 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm font-medium text-danger-text"
            role="alert"
          >
            {t(errorMessages[params.error])}
          </div>
        ) : null}

        {activeSection === "summary" && adminSummary ? (
          <AdminSummaryPanel
            t={t}
            minimumResponseCount={minimumResponseCount}
            summary={adminSummary}
          />
        ) : activeSection === "questionnaires" ? (
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-6">
              <VersionList
                selectedQuestionnaireId={selectedQuestionnaireId}
                versions={versions}
              />
              <DraftForms versions={versions} />
            </div>
            <div className="space-y-6">
              <QuestionnaireEditor
                detail={selectedDetail}
                feedback={questionnaireEditorFeedback}
              />
            </div>
          </div>
        ) : activeSection === "admins" ? (
          <AdminUsersPanel
            admins={admins}
            currentUserId={session.user.id}
            invitations={adminInvitations}
          />
        ) : activeSection === "centres" ? (
          <AdminCentresPanel
            t={t}
            centre={managedCentre}
            centres={managedCentres}
            filter={centreFilter}
            minimumResponseCount={minimumResponseCount}
            search={params.q?.trim().slice(0, 100) ?? ""}
          />
        ) : activeSection === "results" ? (
          <AdminResultsPanel
            centres={resultCentres}
            minimumResponseCount={minimumResponseCount}
            selectedCentreId={selectedResultsCentreId}
            selectedQuestionnaireId={selectedResultsQuestionnaireId}
            selectedScope={selectedResultsScope}
            versions={versions}
          />
        ) : (
          <SettingsPanel
            communicationTemplate={communicationTemplate}
            languageSettings={languageSettings}
            minimumResponseCount={minimumResponseCount}
            responsibleAccessMode={responsibleAccessMode}
            responsiblePortalStatus={responsiblePortalStatus}
          />
        )}
        </section>
      </AdminRouteFrame>
    </CentreAppShell>
  );
}
