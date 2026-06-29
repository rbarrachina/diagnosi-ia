import { NextResponse } from "next/server";
import { isLocalAuthEnabled } from "@/lib/auth/local";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { resolveAppUrl } from "@/lib/http/app-url";
import { safeRelativePath } from "@/lib/http/redirect";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const next = safeRelativePath(requestUrl.searchParams.get("next"), "/");
  const appUrl = resolveAppUrl(request.url, process.env.NEXT_PUBLIC_APP_URL);
  const redirectUrl = new URL(next, appUrl);

  if (isLocalAuthEnabled()) {
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
