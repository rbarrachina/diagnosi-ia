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
import { registerResponsibleCentreAccount } from "@/lib/centres/centre-profiles";
import {
  getCentreEmailPolicyForPublicCode,
  isEmailAllowedByCentrePolicy,
} from "@/lib/centres/email-policy";
import { hasAccountSubmittedToPublicQuestionnaire } from "@/lib/repositories/submissions";
import {
  canAttemptParticipantCode,
  clearParticipantCodeFailures,
  recordParticipantCodeFailure,
} from "@/lib/participants/access-rate-limit";
import {
  getResponsibleAccessDecision,
  getResponsiblePortalStatus,
} from "@/lib/auth/responsible-access";

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

  if (
    statePayload.purpose === "participant" &&
    (await getResponsiblePortalStatus()) === "closed"
  ) {
    const response = NextResponse.redirect(
      new URL("/auth/error?reason=service-closed", appUrl),
    );
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    response.cookies.delete(SESSION_COOKIE_NAME);
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

    let isParticipantAllowed = statePayload.purpose !== "participant";
    if (statePayload.purpose === "participant" && !statePayload.publicCode) {
      isParticipantAllowed = true;
    } else if (statePayload.purpose === "participant" && statePayload.publicCode) {
      if (canAttemptParticipantCode(user.id)) {
        const alreadyParticipated = await hasAccountSubmittedToPublicQuestionnaire({
          accountId: user.id,
          publicCode: statePayload.publicCode,
        });
        const participantPolicy = alreadyParticipated
          ? null
          : await getCentreEmailPolicyForPublicCode(statePayload.publicCode);
        isParticipantAllowed =
          alreadyParticipated ||
          Boolean(
            participantPolicy &&
              isEmailAllowedByCentrePolicy(user.email, participantPolicy),
          );
      }
      if (isParticipantAllowed) clearParticipantCodeFailures(user.id);
      else recordParticipantCodeFailure(user.id);
    }

    if (
      (statePayload.purpose === "participant" && !isParticipantAllowed) ||
      (statePayload.purpose !== "participant" && !isXtecEmail(user.email))
    ) {
      const response = NextResponse.redirect(
        new URL(
          statePayload.purpose === "participant"
            ? "/auth/error?reason=participant-access"
            : "/auth/error?reason=xtec",
          appUrl,
        ),
      );
      response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    if (
      statePayload.purpose !== "participant" &&
      isResponsiblePortalDestination(statePayload.next)
    ) {
      const decision = await getResponsibleAccessDecision(user);

      if (!decision.allowed) {
        const response = NextResponse.redirect(
          new URL(
            decision.reason === "prelaunch"
              ? "/auth/error?reason=centre-access-closed"
              : decision.reason === "suspended"
                ? "/auth/error?reason=centre-suspended"
                : decision.reason === "not_centre_xtec"
                  ? "/auth/error?reason=centre-account-required"
                  : "/auth/error?reason=xtec",
            appUrl,
          ),
        );
        response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
        response.cookies.delete(SESSION_COOKIE_NAME);
        return response;
      }
    }

    if (
      statePayload.purpose !== "participant" &&
      (statePayload.next === "/crear" || statePayload.next.startsWith("/espais/"))
    ) {
      await registerResponsibleCentreAccount(user, {
        refresh: true,
      });
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

function isResponsiblePortalDestination(next: string): boolean {
  return next === "/crear" || next.startsWith("/espais/");
}
