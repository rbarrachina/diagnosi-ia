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
