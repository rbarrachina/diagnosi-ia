import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { GET as login } from "@/app/auth/login/route";
import { POST as logout } from "@/app/auth/logout/route";

const originalEnv = { ...process.env };

describe("auth redirects", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AUTH_MODE: "local",
      LOCAL_AUTH_EMAIL: "usuari.prova@xtec.cat",
      LOCAL_AUTH_USER_ID: "00000000-0000-4000-8000-000000000001",
      NEXT_PUBLIC_APP_URL: "https://example.trycloudflare.com",
    };
  });

  it("keeps local login redirects on localhost", async () => {
    const response = await login(
      new Request("http://localhost:3000/auth/login?next=/crear") as NextRequest,
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/crear");
  });

  it("keeps local logout redirects on localhost", async () => {
    const response = await logout(
      new Request("http://localhost:3000/auth/logout?next=/crear", {
        method: "POST",
      }),
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/crear");
  });

  it("uses the public app URL for public tunnel logout redirects", async () => {
    const response = await logout(
      new Request("https://example.trycloudflare.com/auth/logout?next=/crear", {
        method: "POST",
      }),
    );

    expect(response.headers.get("location")).toBe(
      "https://example.trycloudflare.com/crear",
    );
  });
});
