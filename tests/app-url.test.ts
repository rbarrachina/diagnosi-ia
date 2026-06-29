import { describe, expect, it } from "vitest";

import { resolveAppUrl } from "@/lib/http/app-url";

describe("resolveAppUrl", () => {
  it("uses the configured production URL when present", () => {
    expect(
      resolveAppUrl("https://preview.vercel.app/api/spaces", "https://diagnosi-ia.vercel.app/"),
    ).toBe("https://diagnosi-ia.vercel.app");
  });

  it("uses the request origin when no URL is configured", () => {
    expect(resolveAppUrl("https://diagnosi-ia.vercel.app/api/spaces")).toBe(
      "https://diagnosi-ia.vercel.app",
    );
  });

  it("ignores a local configured URL for production requests", () => {
    expect(
      resolveAppUrl("https://diagnosi-ia.vercel.app/api/spaces", "http://localhost:3000"),
    ).toBe("https://diagnosi-ia.vercel.app");
  });

  it("ignores a private-network configured URL for public tunnel requests", () => {
    expect(
      resolveAppUrl(
        "https://example.trycloudflare.com/api/spaces",
        "http://192.168.1.168:3000",
      ),
    ).toBe("https://example.trycloudflare.com");
  });

  it("uses a private-network request origin even when another private URL is configured", () => {
    expect(
      resolveAppUrl(
        "http://192.168.1.200:3000/api/spaces",
        "http://192.168.1.168:3000",
      ),
    ).toBe("http://192.168.1.200:3000");
  });

  it("uses a public configured URL even when the request origin is local", () => {
    expect(
      resolveAppUrl(
        "http://localhost:3000/api/spaces",
        "https://example.trycloudflare.com",
      ),
    ).toBe("https://example.trycloudflare.com");
  });

  it("allows a local configured URL for local requests", () => {
    expect(resolveAppUrl("http://localhost:3000/api/spaces", "http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
  });

  it("falls back to the request origin when the configured URL is invalid", () => {
    expect(resolveAppUrl("https://diagnosi-ia.vercel.app/api/spaces", "not-a-url")).toBe(
      "https://diagnosi-ia.vercel.app",
    );
  });
});
