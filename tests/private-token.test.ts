import {
  generatePrivateToken,
  hashPrivateToken,
  verifyPrivateToken,
} from "@/lib/crypto/private-token";

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
});
