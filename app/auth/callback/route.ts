import { NextResponse, type NextRequest } from "next/server";
import {
  exchangeGoogleAuthorizationCode,
  getGoogleOAuthConfig,
  getGoogleRedirectUri,
  googleTokenInfoToAppUser,
  isGoogleAuthEnabled,
  verifyGoogleIdToken,
} from "@/lib/auth/google";
import { isLocalAuthEnabled } from "@/lib/auth/local";
import {
  createSessionCookieValue,
  getAuthSessionSecret,
  getSessionMaxAgeSeconds,
  parseSignedCookieValue,
  SESSION_COOKIE_NAME,
  shouldUseSecureCookies,
} from "@/lib/auth/session-cookie";
import {
  OAUTH_STATE_COOKIE_NAME,
  type OAuthStateCookiePayload,
} from "@/lib/auth/oauth-state";
import { resolveAppUrl } from "@/lib/http/app-url";
import { safeRelativePath } from "@/lib/http/redirect";
import { isXtecEmail } from "@/lib/auth/xtec";

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

  const statePayload = parseSignedCookieValue<OAuthStateCookiePayload>(
    request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value,
  );
  const state = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorRedirect = new URL("/auth/error", appUrl);

  if (
    error ||
    !code ||
    !state ||
    !statePayload ||
    statePayload.expiresAt <= Date.now() ||
    statePayload.state !== state
  ) {
    const response = NextResponse.redirect(errorRedirect);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return response;
  }

  try {
    const idToken = await exchangeGoogleAuthorizationCode({
      code,
      redirectUri: getGoogleRedirectUri(request.url),
    });
    const tokenInfo = await verifyGoogleIdToken({
      idToken,
      nonce: statePayload.nonce,
    });
    const user = googleTokenInfoToAppUser(tokenInfo);

    if (!isXtecEmail(user.email)) {
      const response = NextResponse.redirect(
        new URL("/auth/error?reason=xtec", appUrl),
      );
      response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    const response = NextResponse.redirect(new URL(statePayload.next, appUrl));
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    response.cookies.set(SESSION_COOKIE_NAME, createSessionCookieValue(user), {
      httpOnly: true,
      maxAge: getSessionMaxAgeSeconds(),
      path: "/",
      sameSite: "lax",
      secure: shouldUseSecureCookies(request.url),
    });
    return response;
  } catch {
    const response = NextResponse.redirect(errorRedirect);
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}
