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
import { isPublicCode } from "@/lib/crypto/public-code";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = safeRelativePath(requestUrl.searchParams.get("next"), "/crear");
  const appUrl = resolveAppUrl(request.url, process.env.NEXT_PUBLIC_APP_URL);
  const publicCode = getQuestionnairePublicCode(next);
  const policy = publicCode
    ? await (
        await import("@/lib/centres/email-policy")
      ).getCentreEmailPolicyForPublicCode(publicCode)
    : null;

  if (publicCode && !policy?.configured) {
    return NextResponse.redirect(
      new URL("/auth/error?reason=participant-domain", appUrl),
    );
  }

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
    hostedDomain: publicCode
      ? policy?.allowXtec && !policy.customDomain
        ? "xtec.cat"
        : !policy?.allowXtec && policy?.customDomain
          ? policy.customDomain
          : null
      : "xtec.cat",
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
      purpose: publicCode ? "participant" : "responsible",
      publicCode,
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

function getQuestionnairePublicCode(next: string): string | null {
  const match = /^\/q\/([^/?#]+)$/.exec(next);
  return match?.[1] && isPublicCode(match[1]) ? match[1] : null;
}
