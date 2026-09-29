// @vitest-environment node
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxy, config } from "@/proxy";
import { LEGACY_SESSION_COOKIE_NAME } from "@/lib/auth/cookie-names";

afterEach(() => vi.unstubAllEnvs());

describe("enforced content security policy", () => {
  it("overwrites untrusted CSP values and forwards the same fresh nonce to Next.js", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const request = new NextRequest("https://diagnosia.example/", {
      headers: {
        "x-nonce": "attacker-nonce",
        "Content-Security-Policy": "script-src 'unsafe-inline'",
        "Content-Security-Policy-Report-Only": "default-src *",
      },
    });
    const response = await proxy(request);
    const policy = response.headers.get("Content-Security-Policy")!;
    const nonce = response.headers.get("x-middleware-request-x-nonce")!;
    expect(Buffer.from(nonce, "base64")).toHaveLength(32);
    expect(nonce).not.toBe("attacker-nonce");
    expect(policy).toContain(`'nonce-${nonce}'`);
    expect(response.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
    expect(response.headers.get("x-middleware-request-content-security-policy-report-only")).toBeNull();
    expect(response.headers.get("Content-Security-Policy-Report-Only")).toBeNull();
    expect(policy.match(/script-src[^;]+/)?.[0]).toContain("'strict-dynamic'");
    expect(policy.match(/script-src[^;]+/)?.[0]).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).toContain("connect-src 'self';");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");

    const nextResponse = await proxy(request);
    expect(nextResponse.headers.get("Content-Security-Policy")).not.toBe(policy);
  });

  it("permits development debugging and hot reload only in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await proxy(new NextRequest("http://localhost:3000/"));
    const policy = response.headers.get("Content-Security-Policy")!;
    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("connect-src 'self' ws: wss:");
  });

  it("continues deleting the legacy shared session cookie", async () => {
    const response = await proxy(new NextRequest("https://diagnosia.example/", {
      headers: { Cookie: `${LEGACY_SESSION_COOKIE_NAME}=old-session` },
    }));
    expect(response.cookies.get(LEGACY_SESSION_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(LEGACY_SESSION_COOKIE_NAME)?.expires).toEqual(new Date(0));
  });

  it.each([
    "/", "/auth/error", "/q/C-TEST-TEST", "/docent", "/crear", "/admin",
    "/resultats/compartit/C-TEST-TEST", "/api/reports/pdf", "/missing-page",
    "/missing-page.svg", "/_next/static-lookalike", "/favicon.ico/extra",
  ])("covers %s even when it is requested as a prefetch", (url) => {
    expect(unstable_doesMiddlewareMatch({
      config, nextConfig: {}, url,
      headers: { "next-router-prefetch": "1", purpose: "prefetch" },
    })).toBe(true);
  });

  it.each(["/_next/static/chunk.js", "/_next/image", "/favicon.ico", "/icon.svg"])(
    "excludes static resource %s", (url) => {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
    },
  );
});
