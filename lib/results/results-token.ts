import { decryptResultsToken, encryptResultsToken, getResultsTokenEncryptionKey } from "@/lib/crypto/encryption";
import {
  generatePrivateToken,
  hashPrivateToken,
  verifyPrivateToken,
} from "@/lib/crypto/private-token";

export type GeneratedResultsToken = {
  token: string;
  hash: string;
  encrypted: string;
};

function getTokenSecret(): string {
  const tokenSecret = process.env.PRIVATE_TOKEN_HMAC_SECRET;

  if (!tokenSecret) {
    throw new Error("PRIVATE_TOKEN_HMAC_SECRET is required");
  }

  return tokenSecret;
}

export function generateResultsToken(): GeneratedResultsToken {
  const token = generatePrivateToken();
  const hash = hashPrivateToken(token, getTokenSecret());
  const encrypted = encryptResultsToken(token, getResultsTokenEncryptionKey());

  return {
    token,
    hash,
    encrypted,
  };
}

export function verifyResultsToken(token: string, expectedHash: string): boolean {
  return verifyPrivateToken(token, expectedHash, getTokenSecret());
}

export function decryptStoredResultsToken(encryptedToken: string | null): string | null {
  if (!encryptedToken) {
    return null;
  }

  return decryptResultsToken(encryptedToken, getResultsTokenEncryptionKey());
}

export function buildSharedResultsUrl(appUrl: string, publicCode: string, token: string): string {
  return `${appUrl}/resultats/compartit/${publicCode}#token=${token}`;
}

export function buildOwnerResultsUrl(appUrl: string, publicCode: string): string {
  return `${appUrl}/espais/${publicCode}/resultats`;
}
