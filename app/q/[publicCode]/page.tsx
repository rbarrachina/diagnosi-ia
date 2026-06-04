import { notFound } from "next/navigation";
import { QuestionnaireForm } from "@/components/questionnaire/questionnaire-form";
import { isPublicCode } from "@/lib/crypto/public-code";
import { loadPublicQuestionnaire } from "@/lib/questionnaire/load-public-questionnaire";

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

  return (
    <main className="min-h-screen bg-paper">
      <section className="mx-auto w-full max-w-4xl px-6 py-10">
        <QuestionnaireForm questionnaire={questionnaire} />
      </section>
    </main>
  );
}
