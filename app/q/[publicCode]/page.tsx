import { notFound } from "next/navigation";
import { LoginButton, LogoutButton } from "@/components/auth/auth-actions";
import { QuestionnaireForm } from "@/components/questionnaire/questionnaire-form";
import { getXtecSessionState } from "@/lib/auth/session";
import { isPublicCode } from "@/lib/crypto/public-code";
import { loadPublicQuestionnaire } from "@/lib/questionnaire/load-public-questionnaire";
import { hasAccountSubmittedToPublicQuestionnaire } from "@/lib/repositories/submissions";

export const dynamic = "force-dynamic";

type QuestionnairePageProps = {
  params: Promise<{
    publicCode: string;
  }>;
};

export default async function QuestionnairePage({ params }: QuestionnairePageProps) {
  const { publicCode } = await params;

  if (!isPublicCode(publicCode)) {
    notFound();
  }

  const questionnaire = await loadPublicQuestionnaire(publicCode);

  if (!questionnaire) {
    notFound();
  }

  const session = await getXtecSessionState();
  const alreadySubmitted =
    session.status === "authenticated"
      ? await hasAccountSubmittedToPublicQuestionnaire({
          accountId: session.user.id,
          publicCode,
        })
      : false;

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto w-full max-w-4xl px-6 py-10">
        {session.status === "unauthenticated" ? (
          <QuestionnaireLoginNotice publicCode={publicCode} />
        ) : session.status === "forbidden" ? (
          <QuestionnaireForbiddenNotice publicCode={publicCode} />
        ) : (
          <QuestionnaireForm
            alreadySubmitted={alreadySubmitted}
            questionnaire={questionnaire}
          />
        )}
      </section>
    </main>
  );
}

function QuestionnaireLoginNotice({ publicCode }: { publicCode: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-action">
        Accés al qüestionari
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-ink">
        Inicia sessió amb el compte XTEC
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-700">
        Cal validar un compte @xtec.cat per evitar més d’una resposta per
        persona. L’aplicació no desa el correu ni el vincula a les respostes.
      </p>
      <div className="mt-6">
        <LoginButton next={`/q/${publicCode}`} />
      </div>
    </div>
  );
}

function QuestionnaireForbiddenNotice({ publicCode }: { publicCode: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-8 text-center text-red-900 shadow-sm">
      <h1 className="text-2xl font-semibold">Accés no autoritzat</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6">
        Només es permet respondre amb un compte XTEC.
      </p>
      <div className="mt-6 flex justify-center">
        <LogoutButton next={`/q/${publicCode}`} />
      </div>
    </div>
  );
}
