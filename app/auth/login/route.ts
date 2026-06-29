import { NextResponse, type NextRequest } from "next/server";
import {
  buildGoogleAuthorizationUrl,
  createOAuthRandomValue,
  getGoogleOAuthConfig,
  getGoogleRedirectUri,
  isGoogleAuthEnabled,
} from "@/lib/auth/google";
import { isLocalAuthEnabled } from "@/lib/auth/local";
import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  type OAuthStateCookiePayload,
} from "@/lib/auth/oauth-state";
import {
  createSignedCookieValue,
  getAuthSessionSecret,
  shouldUseSecureCookies,
} from "@/lib/auth/session-cookie";
import { resolveAppUrl } from "@/lib/http/app-url";
import { safeRelativePath } from "@/lib/http/redirect";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = safeRelativePath(requestUrl.searchParams.get("next"), "/crear");
  const appUrl = resolveAppUrl(request.url, process.env.NEXT_PUBLIC_APP_URL);

  if (isLocalAuthEnabled()) {
    return NextResponse.redirect(new URL(next, appUrl));
  }

  if (!isGoogleAuthEnabled() || !getGoogleOAuthConfig() || !getAuthSessionSecret()) {
    return NextResponse.redirect(
      new URL("/auth/error?reason=auth-not-configured", appUrl),
    );
  }

  const state = createOAuthRandomValue();
  const nonce = createOAuthRandomValue();
  const redirectUri = getGoogleRedirectUri(request.url);
  const authorizationUrl = buildGoogleAuthorizationUrl({
    nonce,
    redirectUri,
    state,
  });
  const response = NextResponse.redirect(authorizationUrl);

  response.cookies.set(
    OAUTH_STATE_COOKIE_NAME,
    createSignedCookieValue({
      expiresAt: Date.now() + OAUTH_STATE_MAX_AGE_SECONDS * 1000,
      next,
      nonce,
      state,
    } satisfies OAuthStateCookiePayload),
    {
      httpOnly: true,
      maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
      path: "/auth",
      sameSite: "lax",
      secure: shouldUseSecureCookies(request.url),
    },
  );

  return response;
}
