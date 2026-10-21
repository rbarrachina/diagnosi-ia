import { beforeEach, describe, expect, it, vi } from "vitest";
import { effectiveCentreEmailPolicy, isParticipantAllowedByLoginMode } from "@/lib/auth/login-mode-policy";

vi.mock("server-only", () => ({}));
const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ mysqlPool: { execute } }));
const { getLoginMode, setLoginMode } = await import("@/lib/auth/login-mode");
const { updateCentreEmailPolicyForUser } = await import("@/lib/centres/email-policy");

beforeEach(() => { execute.mockReset(); });

describe("global Google login mode", () => {
  it.each([undefined, "invalid", "INTERNAL"])("defaults safely to internal for %s", async (value) => {
    execute.mockResolvedValue([[{ setting_value: value }]]);
    expect(await getLoginMode()).toBe("internal");
  });
  it("does not default to external when the database fails", async () => {
    execute.mockRejectedValue(new Error("database unavailable"));
    await expect(getLoginMode()).rejects.toThrow("database unavailable");
  });
  it("rejects an invalid setting before writing it", async () => {
    await expect(setLoginMode("anything")).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
  });
  it("rejects a direct custom-domain write in internal mode", async () => {
    execute.mockResolvedValue([[{ setting_value: "internal" }]]);
    await expect(updateCentreEmailPolicyForUser("owner", { allowXtec: false, customDomain: "escola.cat" })).rejects.toThrow();
    expect(execute).toHaveBeenCalledTimes(1);
  });
  it("accepts a custom domain in external mode", async () => {
    execute.mockResolvedValueOnce([[{ setting_value: "external" }]]).mockResolvedValueOnce([{ affectedRows: 1 }]);
    expect(await updateCentreEmailPolicyForUser("owner", { allowXtec: false, customDomain: "escola.cat" })).toEqual({ allowXtec: false, customDomain: "escola.cat", configured: true });
  });
  it("uses XTEC without destroying stored custom policy when internal", () => {
    const policy = { allowXtec: false, customDomain: "escola.cat", configured: true };
    expect(effectiveCentreEmailPolicy(policy, "internal")).toEqual({ allowXtec: true, customDomain: null, configured: true });
    expect(effectiveCentreEmailPolicy(policy, "external")).toEqual(policy);
    expect(effectiveCentreEmailPolicy({ ...policy, configured: false }, "internal").configured).toBe(false);
  });
  it("requires both XTEC email and signed Workspace domain internally", () => {
    expect(isParticipantAllowedByLoginMode({ email: "docent@xtec.cat", hostedDomain: "xtec.cat" }, "internal")).toBe(true);
    expect(isParticipantAllowedByLoginMode({ email: "docent@xtec.cat", hostedDomain: null }, "internal")).toBe(false);
    expect(isParticipantAllowedByLoginMode({ email: "docent@escola.cat", hostedDomain: "escola.cat" }, "internal")).toBe(false);
    expect(isParticipantAllowedByLoginMode({ email: "docent@escola.cat", hostedDomain: "escola.cat" }, "external")).toBe(true);
  });
});
