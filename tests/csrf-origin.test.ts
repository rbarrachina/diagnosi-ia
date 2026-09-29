// @vitest-environment node
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowedRequestOrigin } from "@/lib/http/csrf";
import { config, proxy } from "@/proxy";

const origin = "https://diagnosia.edigital.cat";
afterEach(() => vi.unstubAllEnvs());
function request(headers: Record<string, string> = {}, method = "POST") {
  return new NextRequest(`${origin}/api/spaces`, { method, headers });
}

describe("CSRF origin validation", () => {
  it.each(["POST", "PUT", "PATCH", "DELETE"])("allows same-origin %s", (method) => {
    expect(isAllowedRequestOrigin(request({ Origin: origin }, method))).toBe(true);
  });

  it.each([
    "https://other.edigital.cat", "https://evil.invalid", "null",
    "http://diagnosia.edigital.cat", "https://diagnosia.edigital.cat:444",
    "https://diagnosia.edigital.cat.evil.invalid", "https://diagnosia.edigital.cat/path",
    "https://user@diagnosia.edigital.cat", `${origin}, https://evil.invalid`,
  ])("rejects foreign, opaque or malformed Origin %s even with a good Referer", (source) => {
    expect(isAllowedRequestOrigin(request({ Origin: source, Referer: `${origin}/crear` }))).toBe(false);
  });

  it("uses a same-origin Referer only when Origin is absent", () => {
    expect(isAllowedRequestOrigin(request({ Referer: `${origin}/crear?view=fitxa` }))).toBe(true);
    expect(isAllowedRequestOrigin(request({ Referer: "https://other.edigital.cat/" }))).toBe(false);
    expect(isAllowedRequestOrigin(request({ Referer: "invalid" }))).toBe(false);
    expect(isAllowedRequestOrigin(request())).toBe(false);
  });

  it("uses the configured public origin behind Apache rather than forwarded client values", () => {
    const incoming = new NextRequest("http://127.0.0.1:3000/api/spaces", {
      method: "POST", headers: { Origin: origin, "X-Forwarded-Host": "evil.invalid" },
    });
    expect(isAllowedRequestOrigin(incoming, origin)).toBe(true);
    const malicious = new NextRequest("http://127.0.0.1:3000/api/spaces", {
      method: "POST", headers: { Origin: "https://evil.invalid", "X-Forwarded-Host": "evil.invalid" },
    });
    expect(isAllowedRequestOrigin(malicious, origin)).toBe(false);
  });

  it("supports the exact local origin without trusting another local port", () => {
    const incoming = new NextRequest("http://localhost:3000/auth/logout", {
      method: "POST", headers: { Origin: "http://localhost:3000" },
    });
    expect(isAllowedRequestOrigin(incoming, "http://localhost:3000")).toBe(true);
    expect(isAllowedRequestOrigin(new NextRequest(incoming.url, {
      method: "POST", headers: { Origin: "http://localhost:3001" },
    }), "http://localhost:3000")).toBe(false);
  });

  it.each(["GET", "HEAD", "OPTIONS"])("preserves %s and the OAuth callback", (method) => {
    expect(isAllowedRequestOrigin(request({ Origin: "https://accounts.google.com" }, method))).toBe(true);
  });

  it.each([
    "/api/spaces", "/api/spaces/C-7KX9-M2Q8/reset", "/api/spaces/C-7KX9-M2Q8/results-token",
    "/api/centres/confirm", "/api/centres/refresh", "/api/centres/email-policy",
    "/api/submissions", "/api/reports/pdf/owner", "/api/docent/results/pdf",
    "/api/admin/results/pdf", "/api/language", "/auth/logout", "/admin",
  ])("blocks foreign origins before forwarding %s to the handler", async (path) => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", origin);
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: path })).toBe(true);
    const response = await proxy(new NextRequest(`${origin}${path}`, {
      method: "POST", headers: { Origin: "https://other.edigital.cat", Cookie: "test=fake" },
    }));
    expect(response.status).toBe(403);
    expect(response.headers.get("x-middleware-next")).toBeNull();
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(await response.text()).not.toContain("other.edigital.cat");
  });

  it("forwards an allowed mutation with the existing CSP intact", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", origin);
    const response = await proxy(request({ Origin: origin }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("Content-Security-Policy")).toContain("'nonce-");
  });
});
