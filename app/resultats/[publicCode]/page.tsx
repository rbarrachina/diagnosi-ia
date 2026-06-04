import { notFound } from "next/navigation";
import { ResultsClient } from "@/components/results/results-client";
import { isPublicCode } from "@/lib/crypto/public-code";

type ResultsPageProps = {
  params: Promise<{
    publicCode: string;
  }>;
};

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { publicCode } = await params;

  if (!isPublicCode(publicCode)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper">
      <ResultsClient publicCode={publicCode} />
    </main>
  );
}
