import { NextResponse } from "next/server";
import { isLocalAuthEnabled, LOCAL_SIGNED_OUT_COOKIE_NAME } from "@/lib/auth/local";
import {
  LEGACY_SESSION_COOKIE_NAME,
  PARTICIPANT_SESSION_COOKIE_NAME,
  RESPONSIBLE_SESSION_COOKIE_NAME,
} from "@/lib/auth/session-cookie";
import { resolveAppUrl } from "@/lib/http/app-url";
import { safeRelativePath } from "@/lib/http/redirect";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const next = safeRelativePath(requestUrl.searchParams.get("next"), "/");
  const appUrl = resolveAppUrl(request.url, process.env.NEXT_PUBLIC_APP_URL);
  const redirectUrl = new URL(next, appUrl);

  if (isLocalAuthEnabled()) {
    const response = NextResponse.redirect(redirectUrl, 303);
    response.cookies.set(LOCAL_SIGNED_OUT_COOKIE_NAME, "1", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: request.url.startsWith("https://"),
    });
    return response;
  }

  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.delete(RESPONSIBLE_SESSION_COOKIE_NAME);
  response.cookies.delete(PARTICIPANT_SESSION_COOKIE_NAME);
  response.cookies.delete(LEGACY_SESSION_COOKIE_NAME);
  return response;
}
