import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ mysqlPool: {} }));

const {
  centreEmailPolicySchema,
  isEmailAllowedByCentrePolicy,
} = await import("@/lib/centres/email-policy");

describe("centre email policy", () => {
  it("normalizes a custom domain and accepts an exact match", () => {
    const policy = centreEmailPolicySchema.parse({
      allowXtec: false,
      customDomain: " Escola.CAT ",
    });

    expect(policy.customDomain).toBe("escola.cat");
    expect(
      isEmailAllowedByCentrePolicy("docent@escola.cat", {
        ...policy,
        configured: true,
      }),
    ).toBe(true);
  });

  it("does not authorize subdomains automatically", () => {
    expect(
      isEmailAllowedByCentrePolicy("docent@subdomini.escola.cat", {
        allowXtec: false,
        customDomain: "escola.cat",
        configured: true,
      }),
    ).toBe(false);
  });

  it("supports XTEC and a custom domain together", () => {
    const policy = {
      allowXtec: true,
      customDomain: "escola.cat",
      configured: true,
    };

    expect(isEmailAllowedByCentrePolicy("docent@xtec.cat", policy)).toBe(true);
    expect(isEmailAllowedByCentrePolicy("docent@escola.cat", policy)).toBe(true);
  });

  it("requires at least one option and a valid custom domain", () => {
    expect(() =>
      centreEmailPolicySchema.parse({ allowXtec: false, customDomain: null }),
    ).toThrow();
    expect(() =>
      centreEmailPolicySchema.parse({ allowXtec: false, customDomain: "@escola.cat" }),
    ).toThrow();
  });

  it("rejects access until onboarding has configured the policy", () => {
    expect(
      isEmailAllowedByCentrePolicy("docent@xtec.cat", {
        allowXtec: true,
        customDomain: null,
        configured: false,
      }),
    ).toBe(false);
  });
});
