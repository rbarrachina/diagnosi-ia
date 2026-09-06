"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deletePendingAdminEmailInvitation,
  deleteAdminUser,
  inviteAdminByEmail,
  setAdminUserActive,
} from "@/lib/admin/admin-users";
import { getRequiredAdminUser } from "@/lib/admin/auth";
import { getRequiredFormString, parseQuestionnaireContentFormData } from "@/lib/admin/form";
import {
  activateQuestionnaireVersion,
  AdminQuestionnaireOperationError,
  createQuestionnaireVersion,
  deleteQuestionnaireVersion,
  replaceQuestionnaireContent,
} from "@/lib/admin/questionnaires";
import {
  activateQuestionnaireVersionInputSchema,
  adminCentreDeletionInputSchema,
  adminCentreDestructiveActionInputSchema,
  adminCentreSuspensionInputSchema,
  adminEmailInvitationInputSchema,
  adminUserInputSchema,
  adminResultsMinimumSubmissionsSchema,
  communicationTemplateInputSchema,
  createQuestionnaireVersionInputSchema,
  deleteQuestionnaireVersionInputSchema,
  responsibleAccessModeSchema,
  languageSettingsInputSchema,
  setAdminUserActiveInputSchema,
} from "@/lib/validation/schemas";
import {
  setAdminResultsMinimumSubmissions,
  setResponsibleAccessMode,
} from "@/lib/auth/responsible-access";
import { setCommunicationTemplate } from "@/lib/admin/communication-settings";
import { setLanguageSettings } from "@/lib/admin/language-settings";
import {
  deleteAdminCentre,
  resetAdminCentreResponses,
  resetAdminCentreSpace,
  setAdminCentreSuspended,
} from "@/lib/admin/centre-management";

type AdminActionStatus =
  | "activated"
  | "admin-added"
  | "admin-deleted"
  | "admin-invitation-deleted"
  | "admin-updated"
  | "centre-deleted"
  | "centre-reactivated"
  | "centre-responses-reset"
  | "centre-space-reset"
  | "centre-suspended"
  | "copied"
  | "created"
  | "deleted"
  | "saved"
  | "settings-saved";

type AdminActionError =
  | "activation-confirmation"
  | "activate"
  | "admin-add"
  | "admin-delete"
  | "admin-invitation-delete"
  | "admin-update"
  | "centre-action"
  | "centre-confirmation"
  | "copy"
  | "create"
  | "create-title-exists"
  | "create-version-exists"
  | "delete"
  | "delete-confirmation"
  | "save"
  | "settings";

type AdminSection = "admins" | "centres" | "questionnaires" | "settings";

function adminPath(params: {
  error?: AdminActionError;
  hash?: string;
  centreId?: string;
  questionnaireId?: string;
  section?: AdminSection;
  status?: AdminActionStatus;
}) {
  const searchParams = new URLSearchParams();

  if (params.section) {
    searchParams.set("section", params.section);
  }

  if (params.questionnaireId) {
    searchParams.set("questionnaireId", params.questionnaireId);
  }

  if (params.centreId) {
    searchParams.set("centreId", params.centreId);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.error) {
    searchParams.set("error", params.error);
  }

  const query = searchParams.toString();
  const path = query ? `/admin?${query}` : "/admin";
  return params.hash ? `${path}#${params.hash}` : path;
}

async function requireAdminActorId() {
  const user = await getRequiredAdminUser();
  return user.id;
}

export async function createQuestionnaireVersionAction(formData: FormData) {
  await requireAdminActorId();

  let result;
  const sourceQuestionnaireId = getRequiredFormString(formData, "sourceQuestionnaireId");

  try {
    const payload = createQuestionnaireVersionInputSchema.parse({
      sourceQuestionnaireId,
      version: getRequiredFormString(formData, "version"),
      title: getRequiredFormString(formData, "title"),
      estimatedMinutes: getRequiredFormString(formData, "estimatedMinutes"),
    });
    result = await createQuestionnaireVersion(payload);
  } catch (error) {
    redirect(
      adminPath({
        error: getCreateQuestionnaireError(error),
        section: "questionnaires",
      }),
    );
  }

  revalidatePath("/admin");
  redirect(
    adminPath({
      questionnaireId: result.id,
      section: "questionnaires",
      status: sourceQuestionnaireId === "blank" ? "created" : "copied",
    }),
  );
}

function getCreateQuestionnaireError(error: unknown): AdminActionError {
  if (error instanceof AdminQuestionnaireOperationError) {
    if (error.reason === "duplicate_version") {
      return "create-version-exists";
    }

    if (error.reason === "duplicate_title") {
      return "create-title-exists";
    }
  }

  return "create";
}

export async function saveQuestionnaireContentAction(formData: FormData) {
  await requireAdminActorId();
  const questionnaireId = getRequiredFormString(formData, "questionnaireId");

  try {
    const payload = parseQuestionnaireContentFormData(formData);
    await replaceQuestionnaireContent(payload);
  } catch {
    redirect(
      adminPath({
        error: "save",
        hash: "questionnaire-editor-feedback",
        questionnaireId,
        section: "questionnaires",
      }),
    );
  }

  revalidatePath("/admin");
  redirect(
    adminPath({
      hash: "questionnaire-editor-feedback",
      questionnaireId,
      section: "questionnaires",
      status: "saved",
    }),
  );
}

export async function activateQuestionnaireVersionAction(formData: FormData) {
  await requireAdminActorId();
  const questionnaireId = getRequiredFormString(formData, "questionnaireId");

  if (formData.get("confirmActivation") !== "yes") {
    redirect(
      adminPath({
        error: "activation-confirmation",
        questionnaireId,
        section: "questionnaires",
      }),
    );
  }

  try {
    const payload = activateQuestionnaireVersionInputSchema.parse({ questionnaireId });
    await activateQuestionnaireVersion(payload);
  } catch {
    redirect(adminPath({ error: "activate", questionnaireId, section: "questionnaires" }));
  }

  revalidatePath("/admin");
  redirect(
    adminPath({
      questionnaireId,
      section: "questionnaires",
      status: "activated",
    }),
  );
}

export async function deleteQuestionnaireVersionAction(formData: FormData) {
  await requireAdminActorId();
  const questionnaireId = getRequiredFormString(formData, "questionnaireId");

  if (formData.get("confirmDeletion") !== "yes") {
    redirect(
      adminPath({
        error: "delete-confirmation",
        questionnaireId,
        section: "questionnaires",
      }),
    );
  }

  try {
    const payload = deleteQuestionnaireVersionInputSchema.parse({ questionnaireId });
    await deleteQuestionnaireVersion(payload);
  } catch {
    redirect(adminPath({ error: "delete", questionnaireId, section: "questionnaires" }));
  }

  revalidatePath("/admin");
  redirect(adminPath({ section: "questionnaires", status: "deleted" }));
}

export async function addAdminUserAction(formData: FormData) {
  const actorUserId = await requireAdminActorId();

  try {
    const payload = adminEmailInvitationInputSchema.parse({
      email: getRequiredFormString(formData, "email"),
    });
    await inviteAdminByEmail(payload, actorUserId);
  } catch {
    redirect(adminPath({ error: "admin-add", section: "admins" }));
  }

  revalidatePath("/admin");
  redirect(adminPath({ section: "admins", status: "admin-added" }));
}

export async function deleteAdminUserAction(formData: FormData) {
  const actorUserId = await requireAdminActorId();

  try {
    const payload = adminUserInputSchema.parse({
      userId: getRequiredFormString(formData, "userId"),
    });
    await deleteAdminUser(payload, actorUserId);
  } catch {
    redirect(adminPath({ error: "admin-delete", section: "admins" }));
  }

  revalidatePath("/admin");
  redirect(adminPath({ section: "admins", status: "admin-deleted" }));
}

export async function deletePendingAdminEmailInvitationAction(formData: FormData) {
  await requireAdminActorId();

  try {
    const payload = adminEmailInvitationInputSchema.parse({
      email: getRequiredFormString(formData, "email"),
    });
    await deletePendingAdminEmailInvitation(payload);
  } catch {
    redirect(adminPath({ error: "admin-invitation-delete", section: "admins" }));
  }

  revalidatePath("/admin");
  redirect(adminPath({ section: "admins", status: "admin-invitation-deleted" }));
}

export async function setAdminUserActiveAction(formData: FormData) {
  const actorUserId = await requireAdminActorId();

  try {
    const requestedState = getRequiredFormString(formData, "isActive");

    if (requestedState !== "true" && requestedState !== "false") {
      throw new Error("Invalid administrator state");
    }

    const payload = setAdminUserActiveInputSchema.parse({
      userId: getRequiredFormString(formData, "userId"),
      isActive: requestedState === "true",
    });
    await setAdminUserActive(payload, actorUserId);
  } catch {
    redirect(adminPath({ error: "admin-update", section: "admins" }));
  }

  revalidatePath("/admin");
  redirect(adminPath({ section: "admins", status: "admin-updated" }));
}

export async function setResponsibleAccessModeAction(formData: FormData) {
  await requireAdminActorId();

  try {
    const mode = responsibleAccessModeSchema.parse(
      getRequiredFormString(formData, "responsibleAccessMode"),
    );
    const minimumSubmissions = adminResultsMinimumSubmissionsSchema.parse(
      getRequiredFormString(formData, "minimumResponseCount"),
    );
    const communicationTemplate = communicationTemplateInputSchema.parse({
      subject: getRequiredFormString(formData, "communicationSubject"),
      body: getRequiredFormString(formData, "communicationBody"),
    });
    const languageSettings = languageSettingsInputSchema.parse({
      selectorVisible: formData.get("languageSelectorVisible") === "on",
      visibleLanguageCodes: formData
        .getAll("visibleLanguageCodes")
        .filter((value): value is string => typeof value === "string"),
    });
    await setResponsibleAccessMode(mode);
    await setAdminResultsMinimumSubmissions(minimumSubmissions);
    await setCommunicationTemplate(communicationTemplate);
    await setLanguageSettings(languageSettings);
  } catch {
    redirect(adminPath({ error: "settings", section: "settings" }));
  }

  revalidatePath("/", "layout");
  redirect(adminPath({ section: "settings", status: "settings-saved" }));
}

export async function setAdminCentreSuspendedAction(formData: FormData) {
  const actorUserId = await requireAdminActorId();
  const rawCentreId = String(formData.get("centreId") ?? "");
  let suspended = false;

  try {
    const rawSuspended = getRequiredFormString(formData, "suspended");
    const payload = adminCentreSuspensionInputSchema.parse({
      centreId: rawCentreId,
      suspended: rawSuspended === "true",
    });
    if (rawSuspended !== "true" && rawSuspended !== "false") throw new Error();
    await setAdminCentreSuspended({ ...payload, actorUserId });
    suspended = payload.suspended;
  } catch {
    redirect(adminPath({ centreId: rawCentreId, error: "centre-action", section: "centres" }));
  }

  revalidatePath("/admin");
  redirect(
    adminPath({
      centreId: rawCentreId,
      section: "centres",
      status: suspended ? "centre-suspended" : "centre-reactivated",
    }),
  );
}

export async function resetAdminCentreResponsesAction(formData: FormData) {
  const actorUserId = await requireAdminActorId();
  const rawCentreId = String(formData.get("centreId") ?? "");

  try {
    const payload = adminCentreDestructiveActionInputSchema.parse({
      centreId: rawCentreId,
      confirmed: formData.get("confirmation") === "confirmed",
    });
    await resetAdminCentreResponses({ actorUserId, centreId: payload.centreId });
  } catch {
    redirect(adminPath({ centreId: rawCentreId, error: "centre-confirmation", section: "centres" }));
  }

  revalidatePath("/admin");
  redirect(adminPath({ centreId: rawCentreId, section: "centres", status: "centre-responses-reset" }));
}

export async function resetAdminCentreSpaceAction(formData: FormData) {
  const actorUserId = await requireAdminActorId();
  const rawCentreId = String(formData.get("centreId") ?? "");

  try {
    const payload = adminCentreDestructiveActionInputSchema.parse({
      centreId: rawCentreId,
      confirmed: formData.get("confirmation") === "confirmed",
    });
    await resetAdminCentreSpace({ actorUserId, centreId: payload.centreId });
  } catch {
    redirect(adminPath({ centreId: rawCentreId, error: "centre-confirmation", section: "centres" }));
  }

  revalidatePath("/admin");
  redirect(adminPath({ centreId: rawCentreId, section: "centres", status: "centre-space-reset" }));
}

export async function deleteAdminCentreAction(formData: FormData) {
  const actorUserId = await requireAdminActorId();
  const rawCentreId = String(formData.get("centreId") ?? "");

  try {
    const payload = adminCentreDeletionInputSchema.parse({
      centreId: rawCentreId,
      confirmation: getRequiredFormString(formData, "confirmation"),
    });
    await deleteAdminCentre({ ...payload, actorUserId });
  } catch {
    redirect(adminPath({ centreId: rawCentreId, error: "centre-confirmation", section: "centres" }));
  }

  revalidatePath("/admin");
  redirect(adminPath({ section: "centres", status: "centre-deleted" }));
}
