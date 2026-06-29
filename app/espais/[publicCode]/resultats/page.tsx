import { notFound } from "next/navigation";
import {
  ResponsibleForbiddenNotice,
  XtecAccessNotice,
} from "@/components/auth/auth-actions";
import { OwnerResultsClient } from "@/components/results/owner-results-client";
import { getResponsibleSessionState } from "@/lib/auth/session";
import { isPublicCode } from "@/lib/crypto/public-code";
import { getAggregatedResultsForOwner, ResultsAccessError } from "@/lib/results/get-results";

export const dynamic = "force-dynamic";

type OwnerResultsPageProps = {
  params: Promise<{
    publicCode: string;
  }>;
};

export default async function OwnerResultsPage({ params }: OwnerResultsPageProps) {
  const { publicCode } = await params;

  if (!isPublicCode(publicCode)) {
    notFound();
  }

  const session = await getResponsibleSessionState();

  if (session.status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-paper">
        <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6">
          <XtecAccessNotice next={`/espais/${publicCode}/resultats`} />
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

  let results;

  try {
    results = await getAggregatedResultsForOwner({
      publicCode,
      ownerUserId: session.user.id,
    });
  } catch (error) {
    if (error instanceof ResultsAccessError) {
      notFound();
    }

    throw error;
  }

  return (
    <main className="min-h-screen bg-paper">
      <OwnerResultsClient publicCode={publicCode} results={results} />
    </main>
  );
}
