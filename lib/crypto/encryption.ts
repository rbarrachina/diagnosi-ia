import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TOKEN_ENCRYPTION_VERSION = "v1";

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export function getResultsTokenEncryptionKey(): Buffer {
  const encodedKey = process.env.RESULTS_TOKEN_ENCRYPTION_KEY;

  if (!encodedKey) {
    throw new Error("RESULTS_TOKEN_ENCRYPTION_KEY is required");
  }

  const key = decodeBase64Url(encodedKey);

  if (key.length !== 32) {
    throw new Error("RESULTS_TOKEN_ENCRYPTION_KEY must decode to 32 bytes");
  }

  return key;
}

export function encryptResultsToken(token: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    TOKEN_ENCRYPTION_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptResultsToken(encryptedToken: string, key: Buffer): string {
  const [version, encodedIv, encodedTag, encodedEncrypted] = encryptedToken.split(":");

  if (
    version !== TOKEN_ENCRYPTION_VERSION ||
    !encodedIv ||
    !encodedTag ||
    !encodedEncrypted
  ) {
    throw new Error("Invalid encrypted token format");
  }

  const decipher = createDecipheriv(ALGORITHM, key, decodeBase64Url(encodedIv));
  decipher.setAuthTag(decodeBase64Url(encodedTag));

  return Buffer.concat([
    decipher.update(decodeBase64Url(encodedEncrypted)),
    decipher.final(),
  ]).toString("utf8");
}
