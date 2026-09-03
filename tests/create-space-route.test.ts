import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CentreProfile } from "@/lib/centres/types";

const mocks = vi.hoisted(() => ({
  session: vi.fn(), register: vi.fn(), create: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getResponsibleSessionState: mocks.session }));
vi.mock("@/lib/centres/centre-profiles", () => ({ registerResponsibleCentreAccount: mocks.register }));
vi.mock("@/lib/spaces/create-space", () => ({
  createDiagnosticSpace: mocks.create,
  OwnerSpaceAlreadyExistsError: class extends Error {},
}));
const { POST } = await import("@/app/api/spaces/route");
const user = { id: "responsible-1", email: "docent.prova@xtec.cat", displayName: "Prova" };
let centre: CentreProfile;
const request = () => new Request("https://diagnosi.example.org/api/spaces", { method: "POST" });

beforeEach(() => {
  vi.clearAllMocks();
  centre = {
    id: "00000000-0000-4000-8000-000000000001", email: user.email,
    accountDisplayName: user.displayName, displayName: user.displayName,
    officialCode: null, officialName: null, municipality: null,
    territorialArea: null, educationalService: null, sourceStatus: "not_found",
    lastAttemptAt: null, lastSuccessAt: null,
    profileConfirmedAt: "2026-09-03", emailPolicyConfiguredAt: "2026-09-03",
    allowXtec: true, customDomain: null,
  };
  mocks.session.mockResolvedValue({ status: "authenticated", user });
  mocks.register.mockResolvedValue(centre);
  mocks.create.mockResolvedValue({ publicCode: "C-AAAA-AAAA", totalSubmissions: 0 });
});

describe("create space API", () => {
  it("creates a space linked to the authorized XTEC responsible's profile", async () => {
    expect((await POST(request())).status).toBe(201);
    expect(mocks.register).toHaveBeenCalledWith(user);
    expect(mocks.create).toHaveBeenCalledWith(expect.any(String), user.id, centre.id);
  });

  it("does not create an orphan when profile registration is denied", async () => {
    mocks.register.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each(["profileConfirmedAt", "emailPolicyConfiguredAt"] as const)(
    "rejects direct creation until %s is completed",
    async (field) => {
      centre[field] = null;
      expect((await POST(request())).status).toBe(409);
      expect(mocks.create).not.toHaveBeenCalled();
    },
  );

  it.each([
    { session: { status: "unauthenticated" }, status: 401 },
    { session: { status: "forbidden", reason: "not_centre_xtec" }, status: 403 },
  ])("rejects an unauthorized session ($status) before registering data", async ({ session, status }) => {
    mocks.session.mockResolvedValue(session);
    expect((await POST(request())).status).toBe(status);
    expect(mocks.register).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
