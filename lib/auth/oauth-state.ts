import "server-only";

export const OAUTH_STATE_COOKIE_NAME = "diagnosi_ia_oauth_state";
export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

export type OAuthStateCookiePayload = {
  expiresAt: number;
  next: string;
  nonce: string;
  state: string;
};
