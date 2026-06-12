import Link from "next/link";
import { LoginButton, LogoutButton } from "@/components/auth/auth-actions";
import {
  addAdminUserAction,
  activateQuestionnaireVersionAction,
  createQuestionnaireVersionAction,
  deleteQuestionnaireVersionAction,
  deleteAdminUserAction,
  setAdminUserActiveAction,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/app/admin/activation-button";
import { QuestionnaireEditorForm } from "@/app/admin/questionnaire-editor-form";
import { listAdminUsers, searchAuthUsersForAdmin } from "@/lib/admin/admin-users";
import { getAdminSessionState } from "@/lib/admin/auth";
import type {
  AdminQuestionnaireDetail,
  AdminQuestionnaireSummary,
  AdminUserSearchResult,
  AdminUserSummary,
} from "@/lib/admin/types";
import {
  getQuestionnaireVersionDetail,
  listQuestionnaireVersions,
} from "@/lib/admin/questionnaires";
import {
  MAX_QUESTION_BLOCKS,
  MAX_QUESTIONS_PER_BLOCK,
  adminUserSearchQuerySchema,
  questionnaireIdSchema,
} from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    adminSearch?: string;
    questionnaireId?: string;
    section?: string;
    status?: string;
  }>;
};

const statusMessages: Record<string, string> = {
  activated: "Versió activada.",
  "admin-added": "Administrador afegit o reactivat.",
  "admin-deleted": "Rol d'administrador eliminat.",
  "admin-updated": "Estat de l'administrador actualitzat.",
  copied: "Versió copiada.",
  created: "Esborrany creat.",
  deleted: "Qüestionari eliminat.",
  saved: "Contingut desat.",
};

const errorMessages: Record<string, string> = {
  "activation-confirmation": "Cal confirmar l'activació.",
  activate: "No s'ha pogut activar la versió. Revisa que sigui completa.",
  "admin-add": "No s'ha pogut afegir l'administrador.",
  "admin-delete": "No s'ha pogut eliminar el rol d'administrador.",
  "admin-update": "No s'ha pogut actualitzar l'administrador.",
  copy: "No s'ha pogut copiar la versió.",
  create: "No s'ha pogut crear la versió. Revisa que la versió i el títol no existeixin.",
  delete: "No s'ha pogut eliminar el qüestionari.",
  "delete-confirmation": "Cal confirmar l'eliminació total.",
  save: "No s'ha pogut desar. Revisa l'avís d'edició i que no s'eliminin preguntes amb respostes.",
};

type AdminSection = "admins" | "questionnaires";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ca-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getAdminSection(params: { error?: string; section?: string; status?: string }) {
  if (params.section === "admins" || params.section === "questionnaires") {
    return params.section;
  }

  if (
    params.status === "admin-added" ||
    params.status === "admin-updated" ||
    params.error === "admin-add" ||
    params.error === "admin-update"
  ) {
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

function AdminAccessDenied({
  email,
  reason,
}: {
  email: string | null;
  reason: "not_admin" | "not_xtec";
}) {
  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-red-900 shadow-sm">
          <h1 className="text-2xl font-semibold">Accés no autoritzat</h1>
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
      </section>
    </main>
  );
}

function AdminSetupError() {
  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-6 text-center text-amber-950 shadow-sm">
          <h1 className="text-2xl font-semibold">Administració no configurada</h1>
          <p className="mt-3 text-sm leading-6">
            Cal aplicar les migracions d&apos;administració a la base de dades
            configurada abans d&apos;entrar a aquesta pantalla.
          </p>
          <p className="mt-3 text-sm leading-6">
            Revisa que existeixin `admin_users` i la RPC `bootstrap_first_admin`.
          </p>
          <div className="mt-5 flex justify-center">
            <LogoutButton next="/admin" />
          </div>
        </div>
      </section>
    </main>
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
    <section className="rounded-md border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Versions</h2>
          <p className="mt-1 text-sm text-slate-600">
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
                  ? "border-action bg-[#eef7f8]"
                  : "border-line bg-white hover:border-action"
              }`}
              href={`/admin?section=questionnaires&questionnaireId=${version.id}`}
              key={version.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{version.version}</span>
                    {version.isActive ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                        Activa
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{version.title}</p>
                </div>
                <span className="text-xs text-slate-500">ID {version.id}</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-slate-600">
                <span>{version.blockCount} blocs</span>
                <span>{version.questionCount} preguntes</span>
                <span>{version.diagnosticSpaceCount} espais</span>
                <span>{version.totalSubmissions} respostes</span>
              </div>
            </Link>
          );
        })}

        {versions.length === 0 ? (
          <p className="rounded-md border border-dashed border-line p-4 text-sm text-slate-600">
            Encara no hi ha cap versió.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function AdminMenu({
  activeSection,
  selectedQuestionnaireId,
}: {
  activeSection: AdminSection;
  selectedQuestionnaireId: string | null;
}) {
  const questionnaireHref = selectedQuestionnaireId
    ? `/admin?section=questionnaires&questionnaireId=${selectedQuestionnaireId}`
    : "/admin?section=questionnaires";

  const linkClass = (section: AdminSection) =>
    `inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold transition ${
      activeSection === section
        ? "border-action bg-action text-white"
        : "border-line bg-white text-slate-700 hover:border-action hover:text-action"
    }`;

  return (
    <nav aria-label="Gestió d'administració" className="flex flex-wrap gap-3">
      <Link className={linkClass("questionnaires")} href={questionnaireHref}>
        Gestió de qüestionaris
      </Link>
      <Link className={linkClass("admins")} href="/admin?section=admins">
        Gestió d&apos;usuaris
      </Link>
    </nav>
  );
}

function DraftForms({ versions }: { versions: AdminQuestionnaireSummary[] }) {
  return (
    <section className="rounded-md border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Nova versió</h2>
      <form action={createQuestionnaireVersionAction} className="mt-5 max-w-xl space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Versió
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            name="version"
            placeholder="2026.3"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Títol
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            name="title"
            placeholder="Diagnosi IA - Qüestionari 2026.3"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Punt de partida
          <select
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
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
            className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f5d68]"
            type="submit"
          >
            Crea versió
          </button>
        </div>
      </form>
    </section>
  );
}

function QuestionnaireEditor({ detail }: { detail: AdminQuestionnaireDetail | null }) {
  if (!detail) {
    return (
      <section className="rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Editor</h2>
        <p className="mt-3 text-sm text-slate-600">Selecciona o crea una versió.</p>
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
    <section className="rounded-md border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">
              {detail.version} · ID {detail.id}
            </h2>
            {detail.isActive ? (
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                Activa
              </span>
            ) : null}
            {isAssignedToSpace ? (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                Assignada a espais
              </span>
            ) : (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                Sense espais
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {detail.blockCount} blocs, {detail.questionCount} preguntes,{" "}
            {detail.diagnosticSpaceCount} espais, {detail.totalSubmissions} respostes.
            Creada el {formatDate(detail.createdAt)}.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <form action={activateQuestionnaireVersionAction} className="flex flex-col items-start gap-2">
            <input name="questionnaireId" type="hidden" value={detail.id} />
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
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
              className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f5d68] disabled:bg-slate-300"
              disabled={detail.isActive || !isComplete}
              message={`Vols activar la versió ${detail.version}? Els espais existents conservaran la seva versió.`}
            >
              Activa versió
            </ConfirmSubmitButton>
            {!isComplete ? (
              <p className="max-w-xs text-xs text-amber-800">
                Cal almenys 1 bloc i 1 pregunta per bloc. Màxim 10 blocs i 10
                preguntes per bloc.
              </p>
            ) : null}
          </form>
          {!detail.isActive ? (
            <form action={deleteQuestionnaireVersionAction} className="flex flex-col items-start gap-2">
              <input name="questionnaireId" type="hidden" value={detail.id} />
              <label className="flex items-center gap-2 text-xs font-medium text-red-800">
                <input
                  className="h-4 w-4"
                  name="confirmDeletion"
                  type="checkbox"
                  value="yes"
                />
                Confirmo l&apos;eliminació total
              </label>
              <ConfirmSubmitButton
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
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
        isLocked={isAssignedToSpace}
        key={detail.id}
      />
    </section>
  );
}

function AdminUsersPanel({
  admins,
  searchQuery,
  searchResults,
  searchWasSubmitted,
  currentUserId,
}: {
  admins: AdminUserSummary[];
  searchQuery: string;
  searchResults: AdminUserSearchResult[];
  searchWasSubmitted: boolean;
  currentUserId: string;
}) {
  const adminByUserId = new Map(admins.map((admin) => [admin.userId, admin]));

  return (
    <section className="rounded-md border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Administradors</h2>
      <form action="/admin" className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input name="section" type="hidden" value="admins" />
        <label className="flex-1 text-sm font-medium text-slate-700">
          Cerca per nom, cognom o correu
          <input
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            defaultValue={searchQuery}
            name="adminSearch"
            placeholder="nom o correu @xtec.cat"
            required
          />
        </label>
        <button
          className="self-end rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f5d68]"
          type="submit"
        >
          Cerca
        </button>
      </form>

      {searchWasSubmitted ? (
        <div className="mt-5 rounded-md border border-line bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-ink">Resultats de cerca</h3>
          {searchResults.length > 0 ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-line text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">Nom</th>
                    <th className="py-2 pr-3 font-semibold">Correu</th>
                    <th className="py-2 pr-3 font-semibold">Acció</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {searchResults.map((result) => {
                    const admin = adminByUserId.get(result.userId);

                    return (
                      <tr key={result.userId}>
                        <td className="py-3 pr-3 text-slate-700">
                          {result.displayName ?? "Sense nom"}
                        </td>
                        <td className="py-3 pr-3 text-slate-700">{result.email}</td>
                        <td className="py-3 pr-3">
                          <form action={addAdminUserAction}>
                            <input name="userId" type="hidden" value={result.userId} />
                            <button
                              className="rounded-md border border-action px-3 py-1.5 text-xs font-semibold text-action hover:bg-[#eef7f8] disabled:border-slate-300 disabled:text-slate-400"
                              disabled={admin?.isActive}
                              type="submit"
                            >
                              {admin?.isActive ? "Ja és administrador" : "Dona permisos"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              No s&apos;ha trobat cap compte XTEC amb aquesta cerca.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Escriu almenys 2 caràcters per trobar comptes XTEC i donar permisos
          d&apos;administració.
        </p>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-3 font-semibold">Nom</th>
              <th className="py-2 pr-3 font-semibold">Correu</th>
              <th className="py-2 pr-3 font-semibold">Creat</th>
              <th className="py-2 pr-3 font-semibold">Estat</th>
              <th className="py-2 pr-3 font-semibold">Acció</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {admins.map((admin) => {
              const isCurrentUser = admin.userId === currentUserId;

              return (
                <tr key={admin.userId}>
                  <td className="py-3 pr-3 text-slate-700">
                    {admin.displayName ?? "Sense nom"}
                  </td>
                  <td className="py-3 pr-3 text-slate-700">
                    {admin.email ?? "No disponible"}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{formatDate(admin.createdAt)}</td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          admin.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {admin.isActive ? "Actiu" : "Inactiu"}
                      </span>
                      {isCurrentUser ? (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
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
                          className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-action hover:text-action disabled:text-slate-400"
                          disabled={isCurrentUser && admin.isActive}
                          type="submit"
                        >
                          {admin.isActive ? "Desactiva" : "Reactiva"}
                        </button>
                      </form>
                      <form action={deleteAdminUserAction}>
                        <input name="userId" type="hidden" value={admin.userId} />
                        <button
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:text-slate-400"
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

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const session = await getAdminSessionState({ allowBootstrap: true });

  if (session.status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-paper">
        <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
          <div className="rounded-md border border-line bg-white p-6 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-ink">Administració</h1>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Accedeix amb un compte XTEC per gestionar el qüestionari.
            </p>
            <div className="mt-5">
              <LoginButton next="/admin" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (session.status === "forbidden") {
    return <AdminAccessDenied email={session.email} reason={session.reason} />;
  }

  if (session.status === "setup_error") {
    return <AdminSetupError />;
  }

  const [versions, admins] = await Promise.all([
    listQuestionnaireVersions(),
    listAdminUsers(),
  ]);
  const selectedQuestionnaireId = getSelectedQuestionnaireId(
    params.questionnaireId,
    versions,
  );
  const selectedDetail = selectedQuestionnaireId
    ? await getQuestionnaireVersionDetail(selectedQuestionnaireId)
    : null;
  const activeSection = getAdminSection(params);
  const parsedAdminSearch = adminUserSearchQuerySchema.safeParse(params.adminSearch);
  const adminSearchQuery = parsedAdminSearch.success
    ? parsedAdminSearch.data
    : params.adminSearch ?? "";
  const searchWasSubmitted = Boolean(params.adminSearch);
  let adminSearchResults: AdminUserSearchResult[] = [];

  if (activeSection === "admins" && parsedAdminSearch.success) {
    adminSearchResults = await searchAuthUsersForAdmin(parsedAdminSearch.data);
  }

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto w-full max-w-7xl px-6 py-8">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
            Diagnosi IA
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-semibold tracking-normal text-ink">
              Administració
            </h1>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <AdminMenu
                activeSection={activeSection}
                selectedQuestionnaireId={selectedQuestionnaireId}
              />
              <LogoutButton next="/admin" />
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Sessió iniciada com <strong>{session.user.email}</strong>
            {session.bootstrapped ? " · primer administrador creat" : null}
          </p>
        </header>

        {params.status && statusMessages[params.status] ? (
          <div className="mb-5 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900">
            {statusMessages[params.status]}
          </div>
        ) : null}

        {params.error && errorMessages[params.error] ? (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
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
              <QuestionnaireEditor detail={selectedDetail} />
            </div>
          </div>
        ) : (
          <AdminUsersPanel
            admins={admins}
            currentUserId={session.user.id}
            searchQuery={adminSearchQuery}
            searchResults={adminSearchResults}
            searchWasSubmitted={searchWasSubmitted}
          />
        )}
      </section>
    </main>
  );
}
