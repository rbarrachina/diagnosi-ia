import {
  generatePrivateToken,
  hashPrivateToken,
  verifyPrivateToken,
} from "@/lib/crypto/private-token";
import {
  decryptResultsToken,
  encryptResultsToken,
  getResultsTokenEncryptionKey,
} from "@/lib/crypto/encryption";

describe("private token handling", () => {
  it("generates a base64url token from at least 32 random bytes", () => {
    const token = generatePrivateToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(43);
  });

  it("stores only a deterministic HMAC and validates with constant-time comparison", () => {
    const secret = "test-secret-with-enough-entropy-for-unit-tests";
    const token = generatePrivateToken();
    const hmac = hashPrivateToken(token, secret);

    expect(hmac).not.toBe(token);
    expect(hashPrivateToken(token, secret)).toBe(hmac);
    expect(verifyPrivateToken(token, hmac, secret)).toBe(true);
    expect(verifyPrivateToken(`${token}x`, hmac, secret)).toBe(false);
  });

  it("requires a server secret", () => {
    expect(() => hashPrivateToken("token", "")).toThrow(
      "PRIVATE_TOKEN_HMAC_SECRET is required",
    );
  });

  it("encrypts recoverable result tokens without storing plaintext", () => {
    const token = generatePrivateToken();
    const key = Buffer.alloc(32, 7);
    const encrypted = encryptResultsToken(token, key);

    expect(encrypted).not.toContain(token);
    expect(decryptResultsToken(encrypted, key)).toBe(token);
  });

  it("requires a 32-byte result token encryption key", () => {
    const originalKey = process.env.RESULTS_TOKEN_ENCRYPTION_KEY;
    process.env.RESULTS_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString("base64url");

    expect(getResultsTokenEncryptionKey()).toHaveLength(32);

    process.env.RESULTS_TOKEN_ENCRYPTION_KEY = Buffer.alloc(16, 1).toString("base64url");
    expect(() => getResultsTokenEncryptionKey()).toThrow(
      "RESULTS_TOKEN_ENCRYPTION_KEY must decode to 32 bytes",
    );

    if (originalKey === undefined) {
      delete process.env.RESULTS_TOKEN_ENCRYPTION_KEY;
    } else {
      process.env.RESULTS_TOKEN_ENCRYPTION_KEY = originalKey;
    }
  });
});
