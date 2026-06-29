import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getLocalAuthUser, isLocalAuthEnabled } from "@/lib/auth/local";
import { getXtecSessionState } from "@/lib/auth/session";
import { isXtecCentreEmail } from "@/lib/auth/xtec";

const originalEnv = { ...process.env };

describe("local provisional auth", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.AUTH_MODE = "local";
    process.env.LOCAL_AUTH_USER_ID = "00000000-0000-4000-8000-000000000001";
    process.env.LOCAL_AUTH_EMAIL = "usuari.prova@xtec.cat";
  });

  it("authenticates a local XTEC user without Supabase Auth", async () => {
    const session = await getXtecSessionState();

    expect(isLocalAuthEnabled()).toBe(true);
    expect(getLocalAuthUser()).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      email: "usuari.prova@xtec.cat",
    });
    expect(session).toEqual({
      status: "authenticated",
      user: {
        id: "00000000-0000-4000-8000-000000000001",
        email: "usuari.prova@xtec.cat",
      },
    });
  });

  it("forbids local users outside the XTEC domain", async () => {
    process.env.LOCAL_AUTH_EMAIL = "usuari@example.test";

    await expect(getXtecSessionState()).resolves.toEqual({
      status: "forbidden",
      email: "usuari@example.test",
    });
  });

  it("recognizes XTEC centre account addresses", () => {
    expect(isXtecCentreEmail("a0000000@xtec.cat")).toBe(true);
    expect(isXtecCentreEmail("E1234567@xtec.cat")).toBe(true);
    expect(isXtecCentreEmail("f1234567@xtec.cat")).toBe(false);
    expect(isXtecCentreEmail("persona.prova@xtec.cat")).toBe(false);
    expect(isXtecCentreEmail("a123456@xtec.cat")).toBe(false);
  });

  it("does not enable local auth in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(isLocalAuthEnabled()).toBe(false);
    expect(getLocalAuthUser()).toBeNull();
  });

  it("documents local auth routes as redirects instead of account creation", () => {
    const loginRoute = readFileSync(
      join(process.cwd(), "app/auth/login/route.ts"),
      "utf8",
    );
    const logoutRoute = readFileSync(
      join(process.cwd(), "app/auth/logout/route.ts"),
      "utf8",
    );
    const callbackRoute = readFileSync(
      join(process.cwd(), "app/auth/callback/route.ts"),
      "utf8",
    );

    expect(loginRoute).toContain("isLocalAuthEnabled");
    expect(logoutRoute).toContain("isLocalAuthEnabled");
    expect(callbackRoute).toContain("isLocalAuthEnabled");
    expect(`${loginRoute}\n${logoutRoute}\n${callbackRoute}`).not.toContain(
      "signUp",
    );
  });
});
