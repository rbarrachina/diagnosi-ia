import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const setCookie = vi.fn();
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      body,
      cookies: { set: setCookie },
      status: init?.status ?? 200,
    }),
  },
}));

const { POST } = await import("@/app/api/language/route");

beforeEach(() => setCookie.mockClear());

describe("language selection route", () => {
  it("stores a valid explicit language in a functional cookie", async () => {
    const response = await POST(new Request("http://localhost/api/language", {
      body: JSON.stringify({ language: "ES" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }));

    expect(response.status).toBe(200);
    expect(setCookie).toHaveBeenCalledWith("diagnosi-language", "ES", expect.objectContaining({ httpOnly: true, sameSite: "lax" }));
  });

  it("rejects unsupported languages and additional fields", async () => {
    const response = await POST(new Request("http://localhost/api/language", {
      body: JSON.stringify({ language: "EN", browserLanguage: "en" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }));

    expect(response.status).toBe(400);
    expect(setCookie).not.toHaveBeenCalled();
  });
});
