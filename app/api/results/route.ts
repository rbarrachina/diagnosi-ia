import { getServerInterfaceTranslator } from "@/lib/i18n/server-interface-messages";
import { readJsonRequestBody } from "@/lib/http/request";
import { getAggregatedResults, ResultsAccessError } from "@/lib/results/get-results";
import { privateResultsRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const t = await getServerInterfaceTranslator();
  try {
    const payload = privateResultsRequestSchema.parse(
      await readJsonRequestBody(request, {
        maxBytes: 4096,
      }),
    );
    const results = await getAggregatedResults(payload);

    return Response.json(results);
  } catch (error) {
    if (error instanceof ResultsAccessError) {
      return Response.json(
        { error: t("noSHanPogutValidarLesCredencialsDeResultats") },
        { status: 403 },
      );
    }

    return Response.json(
      { error: t("noSHanPogutCarregarElsResultats") },
      { status: 400 },
    );
  }
}
