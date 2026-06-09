import { getXtecSessionState } from "@/lib/auth/session";
import { isPublicCode } from "@/lib/crypto/public-code";
import { resolveAppUrl } from "@/lib/http/app-url";
import { resetOwnerDiagnosticSpace } from "@/lib/spaces/manage-spaces";

export const runtime = "nodejs";

type ResetSpaceRouteProps = {
  params: Promise<{
    publicCode: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: ResetSpaceRouteProps,
): Promise<Response> {
  try {
    const { publicCode } = await params;

    if (!isPublicCode(publicCode)) {
      return Response.json({ error: "Codi públic invàlid." }, { status: 400 });
    }

    const session = await getXtecSessionState();

    if (session.status === "unauthenticated") {
      return Response.json({ error: "Cal iniciar sessió." }, { status: 401 });
    }

    if (session.status === "forbidden") {
      return Response.json(
        { error: "Només es permet l’accés amb un compte XTEC." },
        { status: 403 },
      );
    }

    const result = await resetOwnerDiagnosticSpace({
      ownerUserId: session.user.id,
      publicCode,
      appUrl: resolveAppUrl(request.url, process.env.NEXT_PUBLIC_APP_URL),
    });

    return Response.json(result);
  } catch {
    return Response.json(
      { error: "No s'ha pogut reiniciar el qüestionari." },
      { status: 400 },
    );
  }
}
