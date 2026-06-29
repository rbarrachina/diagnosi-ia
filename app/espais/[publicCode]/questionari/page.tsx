import { notFound } from "next/navigation";
import {
  ResponsibleForbiddenNotice,
  XtecAccessNotice,
} from "@/components/auth/auth-actions";
import { QuestionnaireForm } from "@/components/questionnaire/questionnaire-form";
import { getResponsibleSessionState } from "@/lib/auth/session";
import { isPublicCode } from "@/lib/crypto/public-code";
import { getServerAppUrl } from "@/lib/http/server-app-url";
import { loadPublicQuestionnaire } from "@/lib/questionnaire/load-public-questionnaire";
import { getOwnerSpace } from "@/lib/spaces/manage-spaces";

export const dynamic = "force-dynamic";

type OwnerQuestionnairePreviewPageProps = {
  params: Promise<{
    publicCode: string;
  }>;
};

export default async function OwnerQuestionnairePreviewPage({
  params,
}: OwnerQuestionnairePreviewPageProps) {
  const { publicCode } = await params;

  if (!isPublicCode(publicCode)) {
    notFound();
  }

  const session = await getResponsibleSessionState();

  if (session.status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-paper">
        <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6">
          <XtecAccessNotice next={`/espais/${publicCode}/questionari`} />
        </section>
      </main>
    );
  }

  if (session.status === "forbidden") {
    return (
      <main className="min-h-screen bg-paper">
        <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6">
          <ResponsibleForbiddenNotice reason={session.reason} />
        </section>
      </main>
    );
  }

  const ownerSpace = await getOwnerSpace(
    session.user.id,
    publicCode,
    await getServerAppUrl(),
  );

  if (!ownerSpace) {
    notFound();
  }

  const questionnaire = await loadPublicQuestionnaire(publicCode);

  if (!questionnaire) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-4">
          <a
            className="inline-flex rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-action hover:text-action"
            href="/crear"
          >
            Torna a la gestió
          </a>
        </div>
        <QuestionnaireForm mode="readOnly" questionnaire={questionnaire} />
      </section>
    </main>
  );
}
