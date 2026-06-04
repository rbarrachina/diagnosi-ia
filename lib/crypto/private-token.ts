import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const PRIVATE_TOKEN_BYTES = 32;

export function generatePrivateToken(): string {
  return randomBytes(PRIVATE_TOKEN_BYTES).toString("base64url");
}

export function hashPrivateToken(token: string, secret: string): string {
  if (!secret) {
    throw new Error("PRIVATE_TOKEN_HMAC_SECRET is required");
  }

  return createHmac("sha256", secret).update(token).digest("base64url");
}

export function verifyPrivateToken(
  token: string,
  expectedHash: string,
  secret: string,
): boolean {
  const actualHash = hashPrivateToken(token, secret);
  const actual = Buffer.from(actualHash);
  const expected = Buffer.from(expectedHash);

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
