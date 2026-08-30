import Link from "next/link";
import type { ReactNode } from "react";
import { LoginButton, LogoutButton } from "@/components/auth/auth-actions";
import type { AdminSection } from "@/components/admin/admin-navigation";
import { AdminRouteFrame } from "@/components/admin/admin-route-frame";
import { CentreAppShell } from "@/components/create-space/centre-app-shell";
import { HeaderInfoControls } from "@/components/home/header-info-controls";
import { LanguageSelector } from "@/components/home/language-selector";
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
  setResponsibleAccessModeAction,
  setAdminUserActiveAction,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/app/admin/activation-button";
import { QuestionnaireEditorForm } from "@/app/admin/questionnaire-editor-form";
import {
  listAdminEmailInvitations,
  listAdminUsers,
} from "@/lib/admin/admin-users";
import { getAdminSessionState } from "@/lib/admin/auth";
import { isLocalAuthEnabled } from "@/lib/auth/local";
import {
  getAdminResultsMinimumSubmissions,
  getResponsibleAccessMode,
  type ResponsibleAccessMode,
} from "@/lib/auth/responsible-access";
import { getCommunicationTemplate } from "@/lib/admin/communication-settings";
import {
  QUESTIONNAIRE_URL_PLACEHOLDER,
  type CommunicationTemplate,
} from "@/lib/communication/email-template";
import type {
  AdminEmailInvitationSummary,
  AdminQuestionnaireDetail,
  AdminQuestionnaireSummary,
  AdminUserSummary,
} from "@/lib/admin/types";
import {
  getQuestionnaireVersionDetail,
  listQuestionnaireVersions,
} from "@/lib/admin/questionnaires";
import { getAggregatedResultsForQuestionnaireVersion } from "@/lib/results/get-results";
import {
  MAX_QUESTION_BLOCKS,
  MAX_QUESTIONS_PER_BLOCK,
  questionnaireIdSchema,
} from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    questionnaireId?: string;
    section?: string;
    status?: string;
  }>;
};

const statusMessages: Record<string, string> = {
  activated: "Versió activada.",
  "admin-added": "Invitació d'administrador creada.",
  "admin-deleted": "Rol d'administrador eliminat.",
  "admin-updated": "Estat de l'administrador actualitzat.",
  copied: "Versió copiada.",
  created: "Esborrany creat.",
  deleted: "Qüestionari eliminat.",
  saved: "Contingut desat.",
  "settings-saved": "Configuració desada.",
};

const errorMessages: Record<string, string> = {
  "activation-confirmation": "Cal confirmar l'activació.",
  activate: "No s'ha pogut activar la versió. Revisa que sigui completa.",
  "admin-add": "No s'ha pogut crear la invitació. Revisa que sigui un correu @xtec.cat.",
  "admin-delete": "No s'ha pogut eliminar el rol d'administrador.",
  "admin-update": "No s'ha pogut actualitzar l'administrador.",
  copy: "No s'ha pogut copiar la versió.",
  create: "No s'ha pogut crear la versió. Revisa que les dades siguin vàlides.",
  "create-title-exists": "No s'ha pogut crear la versió perquè el títol ja existeix.",
  "create-version-exists": "No s'ha pogut crear la versió perquè la versió ja existeix.",
  delete: "No s'ha pogut eliminar el qüestionari.",
  "delete-confirmation": "Cal confirmar l'eliminació total.",
  save: "No s'ha pogut desar. Revisa l'avís d'edició i que no s'eliminin preguntes amb respostes.",
  settings: "No s'ha pogut desar la configuració.",
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
    params.section === "admins" ||
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
    params.error === "admin-add" ||
    params.error === "admin-update" ||
    params.error === "settings"
  ) {
    return params.status === "settings-saved" || params.error === "settings"
      ? "settings"
      : "admins";
  }

  if (isLocalAuthEnabled()) {
    return "admins";
  }

  return "questionnaires";
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

function AdminEntryShell({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell min-h-screen text-ink">
      <AppHeader brandHref="/">
        <HeaderInfoControls />
        <LanguageSelector />
        <ThemeToggle />
      </AppHeader>

      <div
        aria-hidden="true"
        className="app-grid pointer-events-none fixed inset-0 opacity-50"
      />
      <div aria-hidden="true" className="app-orb app-orb-left fixed" />
      <div aria-hidden="true" className="app-orb app-orb-right fixed" />

      <div className="relative flex min-h-screen flex-col pt-20">
        <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-12">
          {children}
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}

function AdminAccessDenied({
  email,
  reason,
}: {
  email: string | null;
  reason: "not_admin" | "not_xtec";
}) {
  return (
    <AdminEntryShell>
      <div className="rounded-2xl border border-danger-border bg-danger-bg p-7 text-center text-danger-text shadow-[0_16px_48px_var(--app-shadow)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Administració</p>
        <h1 className="mt-3 text-2xl font-semibold">Accés no autoritzat</h1>
        <p className="mt-3 text-sm leading-6">
          {reason === "not_xtec"
            ? "Només es permet l'accés amb un compte XTEC."
            : "Aquest compte no té permisos d'administració actius."}
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Administració</p>
        <h1 className="mt-3 text-2xl font-semibold">Administració no configurada</h1>
        <p className="mt-3 text-sm leading-6">
          Cal aplicar les migracions d&apos;administració a la base de dades
          configurada abans d&apos;entrar a aquesta pantalla.
        </p>
        <p className="mt-3 text-sm leading-6">
          Revisa que existeixi `admin_users` a MySQL i que la configuració
          local apunti a la base de dades correcta.
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
          <h2 className="text-lg font-semibold text-ink">Versions</h2>
          <p className="mt-1 text-sm text-muted">
            {versions.length} versions de qüestionari
          </p>
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
                        Activa
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">{version.title}</p>
                </div>
                <span className="text-xs text-muted">ID {version.id}</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-muted">
                <span>{version.blockCount} blocs</span>
                <span>{version.questionCount} preguntes</span>
                <span>{version.diagnosticSpaceCount} espais</span>
                <span>{version.totalSubmissions} respostes</span>
              </div>
            </Link>
          );
        })}

        {versions.length === 0 ? (
          <p className="rounded-md border border-dashed border-line p-4 text-sm text-muted">
            Encara no hi ha cap versió.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function AdminResultsPanel({
  minimumResponseCount,
  selectedQuestionnaireId,
  versions,
}: {
  minimumResponseCount: number;
  selectedQuestionnaireId: string | null;
  versions: AdminQuestionnaireSummary[];
}) {
  const selectedVersion = versions.find((version) => version.id === selectedQuestionnaireId);

  return (
    <div className="space-y-6">
      <section className="admin-panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Resultats</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Tria una versió del qüestionari per veure els resultats agregats
              de totes les enquestes fetes amb aquella versió.
            </p>
          </div>
          <form action="/admin" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input name="section" type="hidden" value="results" />
            <label className="text-sm font-medium text-muted">
              Versió del qüestionari
              <select
                className="mt-1 min-w-72 rounded-md border border-line bg-surface px-3 py-2 text-sm"
                defaultValue={selectedQuestionnaireId ?? ""}
                name="questionnaireId"
                required
              >
                <option disabled value="">
                  Tria una versió
                </option>
                {versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.version} · {version.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-hover"
              disabled={versions.length === 0}
              type="submit"
            >
              Mostra resultats
            </button>
          </form>
        </div>
      </section>

      {selectedQuestionnaireId && selectedVersion ? (
        <AdminResultsContent
          minimumResponseCount={minimumResponseCount}
          questionnaireId={selectedQuestionnaireId}
        />
      ) : (
        <section className="rounded-md border border-dashed border-line bg-surface p-5 text-sm text-muted">
          {versions.length === 0
            ? "Encara no hi ha cap versió de qüestionari per mostrar."
            : "Tria una versió del qüestionari per generar els resultats."}
        </section>
      )}
    </div>
  );
}

async function AdminResultsContent({
  minimumResponseCount,
  questionnaireId,
}: {
  minimumResponseCount: number;
  questionnaireId: string;
}) {
  const results = await getAggregatedResultsForQuestionnaireVersion(questionnaireId);

  return (
    <AdminResultsClient
      minimumResponseCount={minimumResponseCount}
      questionnaireId={questionnaireId}
      results={results}
    />
  );
}

function DraftForms({ versions }: { versions: AdminQuestionnaireSummary[] }) {
  return (
    <section className="admin-panel p-5">
      <h2 className="text-lg font-semibold text-ink">Nova versió</h2>
      <form action={createQuestionnaireVersionAction} className="mt-5 max-w-xl space-y-4">
        <label className="block text-sm font-medium text-muted">
          Versió
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            name="version"
            placeholder="2026-27 v1"
            required
          />
        </label>
        <label className="block text-sm font-medium text-muted">
          Títol
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            name="title"
            placeholder="Diagnosi IA - Qüestionari 2026-27 v1"
            required
          />
        </label>
        <label className="block text-sm font-medium text-muted">
          Minuts per respondre-la
          <input
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
          Punt de partida
          <select
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            name="sourceQuestionnaireId"
            required
          >
            <option value="blank">Qüestionari en blanc</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                Copia {version.version} · {version.title}
              </option>
            ))}
          </select>
        </label>
        <div>
          <button
            className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-hover"
            type="submit"
          >
            Crea versió
          </button>
        </div>
      </form>
    </section>
  );
}

type QuestionnaireEditorFeedback = {
  message: string;
  tone: "error" | "success";
};

function QuestionnaireEditor({
  detail,
  feedback,
}: {
  detail: AdminQuestionnaireDetail | null;
  feedback?: QuestionnaireEditorFeedback | null;
}) {
  if (!detail) {
    return (
      <section className="admin-panel p-5">
        <h2 className="text-lg font-semibold text-ink">Editor</h2>
        <p className="mt-3 text-sm text-muted">Selecciona o crea una versió.</p>
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
        block.questions.length <= MAX_QUESTIONS_PER_BLOCK,
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
                Activa
              </span>
            ) : null}
            {isAssignedToSpace ? (
              <span className="rounded bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning-text">
                Assignada a espais
              </span>
            ) : (
              <span className="rounded bg-accent-soft px-2 py-0.5 text-xs font-semibold text-muted">
                Sense espais
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">
            {detail.blockCount} blocs, {detail.questionCount} preguntes,{" "}
            {detail.diagnosticSpaceCount} espais, {detail.totalSubmissions} respostes,{" "}
            {detail.estimatedMinutes} minuts.
            Creada el {formatDate(detail.createdAt)}.
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
              />
              Confirmo l&apos;activació
            </label>
            <ConfirmSubmitButton
              className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-hover disabled:bg-muted"
              disabled={detail.isActive || !isComplete}
              message={`Vols activar la versió ${detail.version}? Els espais existents conservaran la seva versió.`}
            >
              Activa versió
            </ConfirmSubmitButton>
            {!isComplete ? (
              <p className="max-w-xs text-xs text-warning-text">
                Cal almenys 1 bloc i 1 pregunta per bloc. Màxim 10 blocs i 10
                preguntes per bloc.
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
                />
                Confirmo l&apos;eliminació total
              </label>
              <ConfirmSubmitButton
                className="rounded-md border border-danger-border px-4 py-2 text-sm font-semibold text-danger-text hover:bg-danger-bg"
                message={`Vols eliminar definitivament la versió ${detail.version}? S'eliminaran també tots els espais, respostes, blocs i preguntes d'aquest qüestionari. Aquesta acció no es pot desfer.`}
              >
                Elimina qüestionari
              </ConfirmSubmitButton>
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

function AdminUsersPanel({
  admins,
  currentUserId,
  invitations,
}: {
  admins: AdminUserSummary[];
  currentUserId: string;
  invitations: AdminEmailInvitationSummary[];
}) {
  return (
    <section className="admin-panel p-5">
      <h2 className="text-lg font-semibold text-ink">Administradors</h2>
      <form action={addAdminUserAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1 text-sm font-medium text-muted">
          Correu XTEC de la persona administradora
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            name="email"
            placeholder="persona@xtec.cat"
            required
            type="email"
          />
        </label>
        <button
          className="self-end rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-hover"
          type="submit"
        >
          Convida
        </button>
      </form>
      <p className="mt-3 text-sm text-muted">
        La persona quedarà autoritzada quan accedeixi amb aquest compte Google
        XTEC. El correu només s&apos;usa per a aquesta invitació
        d&apos;administració.
      </p>

      {invitations.length > 0 ? (
        <div className="mt-5 rounded-md border border-line bg-accent-soft p-4">
          <h3 className="text-sm font-semibold text-ink">Invitacions pendents</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase text-muted">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Correu</th>
                  <th className="py-2 pr-3 font-semibold">Creada</th>
                  <th className="py-2 pr-3 font-semibold">Estat</th>
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
                        Pendent
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Encara no hi ha invitacions d&apos;administració pendents.
        </p>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase text-muted">
            <tr>
              <th className="py-2 pr-3 font-semibold">Nom</th>
              <th className="py-2 pr-3 font-semibold">Correu</th>
              <th className="py-2 pr-3 font-semibold">Creat</th>
              <th className="py-2 pr-3 font-semibold">Darrer accés</th>
              <th className="py-2 pr-3 font-semibold">Estat</th>
              <th className="py-2 pr-3 font-semibold">Acció</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {admins.map((admin) => {
              const isCurrentUser = admin.userId === currentUserId;

              return (
                <tr key={admin.userId}>
                  <td className="py-3 pr-3 text-muted">
                    {admin.displayName ?? "Sense nom"}
                  </td>
                  <td className="py-3 pr-3 text-muted">
                    {admin.email ?? "No disponible"}
                  </td>
                  <td className="py-3 pr-3 text-muted">{formatDate(admin.createdAt)}</td>
                  <td className="py-3 pr-3 text-muted">
                    {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : "No disponible"}
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
                        {admin.isActive ? "Actiu" : "Inactiu"}
                      </span>
                      {isCurrentUser ? (
                        <span className="rounded bg-accent-soft px-2 py-0.5 text-xs font-semibold text-muted">
                          Tu
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
                          {admin.isActive ? "Desactiva" : "Reactiva"}
                        </button>
                      </form>
                      <form action={deleteAdminUserAction}>
                        <input name="userId" type="hidden" value={admin.userId} />
                        <button
                          className="rounded-md border border-danger-border px-3 py-1.5 text-xs font-semibold text-danger-text hover:bg-danger-bg disabled:text-muted"
                          disabled={isCurrentUser}
                          type="submit"
                        >
                          Elimina rol
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
    <div className="flex items-start gap-3 py-4 text-sm text-muted">
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

function SettingsPanel({
  communicationTemplate,
  minimumResponseCount,
  responsibleAccessMode,
}: {
  communicationTemplate: CommunicationTemplate;
  minimumResponseCount: number;
  responsibleAccessMode: ResponsibleAccessMode;
}) {
  return (
    <section className="admin-panel p-5">
      <h2 className="text-lg font-semibold text-ink">Configuració</h2>
      <form action={setResponsibleAccessModeAction} className="mt-5 space-y-5">
        <fieldset>
          <legend className="text-sm font-semibold text-ink">
            Accés per a responsables
          </legend>
          <div className="mt-3 space-y-1 rounded-md border border-line bg-surface px-4">
            <ResponsibleAccessOption
              checked={responsibleAccessMode === "all_xtec"}
              description={
                <>
                  Qualsevol compte acabat en @xtec.cat pot crear i gestionar el
                  seu espai.
                </>
              }
              id="responsible-access-all-xtec"
              infoLabel="Més informació sobre qualsevol compte XTEC"
              value="all_xtec"
            >
              Qualsevol compte XTEC
            </ResponsibleAccessOption>
            <ResponsibleAccessOption
              checked={responsibleAccessMode === "centre_xtec"}
              description={
                <>
                  Només els comptes amb format a0000000@xtec.cat, b0000000@xtec.cat,
                  c0000000@xtec.cat, d0000000@xtec.cat o e0000000@xtec.cat poden
                  accedir com a responsables. Els administradors actius també poden
                  accedir en qualsevol mode.
                </>
              }
              id="responsible-access-restricted-xtec"
              infoLabel="Més informació sobre només comptes de centre XTEC"
              value="centre_xtec"
            >
              Només comptes de centre XTEC
            </ResponsibleAccessOption>
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold text-ink">
            Resultats globals
          </legend>
          <div className="mt-3 rounded-md border border-line bg-surface p-4 text-sm text-muted">
            <div className="flex flex-wrap items-center gap-2">
              <label
                className="font-semibold text-ink"
                htmlFor="minimum-response-count"
              >
                Respostes mínimes per computar
              </label>
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
              <InfoDisclosure label="Més informació sobre respostes mínimes per computar">
                Les enquestes amb un nombre de respostes igual o inferior a
                aquest valor no es computen als resultats globals
                d&apos;administració.
              </InfoDisclosure>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Comunicat</legend>
          <div className="mt-3 space-y-4 rounded-md border border-line bg-surface p-4 text-sm text-muted">
            <p className="text-xs leading-5 text-muted">
              Pots usar <code>{"{NOM_CENTRE}"}</code> al títol o al cos i{" "}
              <code>{"{URL_QUESTIONARI}"}</code> al cos. Si no hi poses el nom
              del centre, s’afegeix automàticament.
            </p>
            <label className="block">
              <span className="font-semibold text-ink">Títol del correu</span>
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
              <span className="font-semibold text-ink">Text del missatge</span>
              <textarea
                className="mt-2 min-h-56 w-full rounded-md border border-line px-3 py-2 text-sm leading-6"
                defaultValue={communicationTemplate.body}
                maxLength={4000}
                name="communicationBody"
                required
              />
            </label>
            <p className="text-xs leading-5 text-muted">
              La marca <code>{QUESTIONNAIRE_URL_PLACEHOLDER}</code> se substituirà
              automàticament per l&apos;enllaç públic específic de cada espai. Si
              no hi és, l&apos;aplicació afegirà l&apos;enllaç al final del missatge.
            </p>
          </div>
        </fieldset>
        <button
          className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-hover"
          type="submit"
        >
          Desa configuració
        </button>
      </form>
    </section>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const session = await getAdminSessionState({ allowBootstrap: true });

  if (session.status === "unauthenticated") {
    return (
      <AdminEntryShell>
        <div className="admin-panel p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-action">
            Accés restringit
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-ink">
            Administració
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Accedeix amb un compte XTEC autoritzat per gestionar l’aplicació.
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
  const [
    versions,
    admins,
    adminInvitations,
    responsibleAccessMode,
    minimumResponseCount,
    communicationTemplate,
  ] = await Promise.all([
    activeSection === "questionnaires" || activeSection === "results"
      ? listQuestionnaireVersions()
      : Promise.resolve([]),
    activeSection === "admins" ? listAdminUsers() : Promise.resolve([]),
    activeSection === "admins" ? listAdminEmailInvitations() : Promise.resolve([]),
    activeSection === "settings"
      ? getResponsibleAccessMode()
      : Promise.resolve<ResponsibleAccessMode>("all_xtec"),
    activeSection === "settings" || activeSection === "results"
      ? getAdminResultsMinimumSubmissions()
      : Promise.resolve(0),
    activeSection === "settings"
      ? getCommunicationTemplate()
      : Promise.resolve({ subject: "", body: "" }),
  ]);
  const selectedQuestionnaireId = getSelectedQuestionnaireId(
    params.questionnaireId,
    versions,
  );
  const selectedResultsQuestionnaireId =
    activeSection === "results"
      ? getRequestedQuestionnaireId(params.questionnaireId, versions)
      : selectedQuestionnaireId;
  const selectedDetail = selectedQuestionnaireId
    ? activeSection === "questionnaires"
      ? await getQuestionnaireVersionDetail(selectedQuestionnaireId)
      : null
    : null;
  const questionnaireEditorFeedback =
    activeSection === "questionnaires" && params.status === "saved"
      ? {
          message: statusMessages.saved,
          tone: "success" as const,
        }
      : activeSection === "questionnaires" && params.error === "save"
        ? {
            message: errorMessages.save,
            tone: "error" as const,
          }
        : null;

  const sectionTitles: Record<AdminSection, { eyebrow: string; title: string; description: string }> = {
    questionnaires: {
      eyebrow: "Contingut",
      title: "Gestió de qüestionaris",
      description: "Crea, revisa i activa les versions del qüestionari de diagnosi.",
    },
    results: {
      eyebrow: "Visió global",
      title: "Resultats agregats",
      description: "Consulta les dades de conjunt sense exposar respostes individuals.",
    },
    admins: {
      eyebrow: "Accés",
      title: "Gestió d’usuaris",
      description: "Administra les persones autoritzades a accedir al tauler.",
    },
    settings: {
      eyebrow: "Aplicació",
      title: "Configuració",
      description: "Defineix els criteris globals d’accés, resultats i comunicació.",
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
              {sectionHeading.eyebrow} · Administració
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
              {sectionHeading.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
              {sectionHeading.description}
            </p>
            {session.bootstrapped ? (
              <p className="mt-3 text-xs font-medium text-action">
                Primer administrador creat
              </p>
            ) : null}
          </header>

        {params.status && statusMessages[params.status] ? (
          <div className="mb-5 rounded-md border border-success-border bg-success-bg px-4 py-3 text-sm font-medium text-success-text">
            {statusMessages[params.status]}
          </div>
        ) : null}

        {params.error && errorMessages[params.error] ? (
          <div className="mb-5 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm font-medium text-danger-text">
            {errorMessages[params.error]}
          </div>
        ) : null}

        {activeSection === "questionnaires" ? (
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
        ) : activeSection === "results" ? (
          <AdminResultsPanel
            minimumResponseCount={minimumResponseCount}
            selectedQuestionnaireId={selectedResultsQuestionnaireId}
            versions={versions}
          />
        ) : (
          <SettingsPanel
            communicationTemplate={communicationTemplate}
            minimumResponseCount={minimumResponseCount}
            responsibleAccessMode={responsibleAccessMode}
          />
        )}
        </section>
      </AdminRouteFrame>
    </CentreAppShell>
  );
}
