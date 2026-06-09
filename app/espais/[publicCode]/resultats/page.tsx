import { notFound } from "next/navigation";
import { XtecAccessNotice, XtecForbiddenNotice } from "@/components/auth/auth-actions";
import { OwnerResultsClient } from "@/components/results/owner-results-client";
import { getXtecSessionState } from "@/lib/auth/session";
import { isPublicCode } from "@/lib/crypto/public-code";
import { getServerAppUrl } from "@/lib/http/server-app-url";
import { getAggregatedResultsForOwner, ResultsAccessError } from "@/lib/results/get-results";
import { getOwnerSpace } from "@/lib/spaces/manage-spaces";

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

  const session = await getXtecSessionState();

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
          <XtecForbiddenNotice />
        </section>
      </main>
    );
  }

  const appUrl = await getServerAppUrl();
  let results;
  let ownerSpace;

  try {
    [results, ownerSpace] = await Promise.all([
      getAggregatedResultsForOwner({
        publicCode,
        ownerUserId: session.user.id,
      }),
      getOwnerSpace(session.user.id, publicCode, appUrl),
    ]);
  } catch (error) {
    if (error instanceof ResultsAccessError) {
      notFound();
    }

    throw error;
  }

  if (!ownerSpace) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper">
      <OwnerResultsClient
        initialSharedResultsUrl={ownerSpace.sharedResultsUrl}
        publicCode={publicCode}
        results={results}
      />
    </main>
  );
}
