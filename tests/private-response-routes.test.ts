// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  results: vi.fn(), adminResults: vi.fn(), pdf: vi.fn(), admin: vi.fn(),
  session: vi.fn(), regenerate: vi.fn(), reset: vi.fn(),
}));
vi.mock("@/lib/i18n/server-interface-messages", () => ({
  getServerInterfaceTranslator: async () => (key: string) => key,
}));
vi.mock("@/lib/results/get-results", () => ({
  ResultsAccessError: class extends Error {},
  getAggregatedResults: mocks.results,
  getAggregatedResultsForQuestionnaireVersion: mocks.adminResults,
}));
vi.mock("@/lib/pdf/render-report", () => ({ renderDiagnosticReportPdf: mocks.pdf }));
vi.mock("@/lib/admin/auth", () => ({
  AdminAccessError: class extends Error {}, getRequiredAdminUser: mocks.admin,
}));
vi.mock("@/lib/auth/session", () => ({ getResponsibleSessionState: mocks.session }));
vi.mock("@/lib/spaces/manage-spaces", () => ({
  regenerateOwnerResultsToken: mocks.regenerate, resetOwnerDiagnosticSpace: mocks.reset,
}));

import { ResultsAccessError } from "@/lib/results/get-results";
import { AdminAccessError } from "@/lib/admin/auth";
import { POST as results } from "@/app/api/results/route";
import { POST as sharedPdf } from "@/app/api/reports/pdf/route";
import { POST as adminPdf } from "@/app/api/admin/results/pdf/route";
import { POST as regenerate } from "@/app/api/spaces/[publicCode]/results-token/route";
import { POST as reset } from "@/app/api/spaces/[publicCode]/reset/route";

const publicCode = "C-7KX9-M2Q8";
const credentials = { publicCode, privateToken: "a".repeat(43) };
const aggregate = { publicCode, questionnaireVersion: "2026.2", totalSubmissions: 10 };
const privateLink = { privateResultsUrl: "https://test.invalid/resultats#test-only-token" };
const params = { params: Promise.resolve({ publicCode }) };
function request(body: unknown = {}) {
  return new Request("https://test.invalid/api/results", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
function expectNoStore(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.results.mockResolvedValue(aggregate);
  mocks.adminResults.mockResolvedValue(aggregate);
  mocks.pdf.mockResolvedValue(Buffer.from("test-only-pdf"));
  mocks.admin.mockResolvedValue({ id: "test-admin" });
  mocks.session.mockResolvedValue({ status: "authenticated", user: { id: "test-owner" } });
  mocks.regenerate.mockResolvedValue(privateLink);
  mocks.reset.mockResolvedValue(privateLink);
});

describe("sensitive HTTP responses cannot be stored in caches", () => {
  it("preserves the shared aggregate JSON while preventing caching", async () => {
    const response = await results(request(credentials));
    expect(response.status).toBe(200);
    expectNoStore(response);
    expect(await response.json()).toEqual(aggregate);
    expect(mocks.results).toHaveBeenCalledWith(credentials);
  });

  it.each([
    { name: "shared", handler: sharedPdf, body: credentials },
    { name: "admin", handler: adminPdf, body: { scope: "all", questionnaireId: "002" } },
  ])("keeps the $name PDF downloadable without HTTP caching", async ({ handler, body }) => {
    const response = await handler(request(body));
    expect(response.status).toBe(200);
    expectNoStore(response);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toMatch(/^attachment; filename=".*\.pdf"$/);
    expect(await response.text()).toBe("test-only-pdf");
  });

  it.each([{ handler: results }, { handler: sharedPdf }])(
    "prevents caching a rejected shared token", async ({ handler }) => {
      mocks.results.mockRejectedValue(new ResultsAccessError());
      const response = await handler(request(credentials));
      expect(response.status).toBe(403);
      expectNoStore(response);
      expect(mocks.pdf).not.toHaveBeenCalled();
    },
  );

  it("prevents caching malformed JSON request errors before reading results", async () => {
    const response = await results(request({}));
    expect(response.status).toBe(400);
    expectNoStore(response);
    expect(mocks.results).not.toHaveBeenCalled();
  });

  it("prevents caching an unauthorized admin PDF response", async () => {
    mocks.admin.mockRejectedValue(new AdminAccessError());
    const response = await adminPdf(request({ scope: "all", questionnaireId: "002" }));
    expect(response.status).toBe(403);
    expectNoStore(response);
    expect(mocks.adminResults).not.toHaveBeenCalled();
  });

  it("protects the minimum-response threshold error without generating an admin PDF", async () => {
    mocks.adminResults.mockResolvedValue({ ...aggregate, totalSubmissions: 0 });
    const response = await adminPdf(request({
      scope: "centre", questionnaireId: "002", centreId: "00000000-0000-4000-8000-000000000001",
    }));
    expect(response.status).toBe(409);
    expectNoStore(response);
    expect(mocks.pdf).not.toHaveBeenCalled();
  });

  it.each([{ handler: regenerate }, { handler: reset }])(
    "protects a returned private link without changing ownership validation", async ({ handler }) => {
      const response = await handler(request(), params);
      expect(response.status).toBe(200);
      expectNoStore(response);
      expect(await response.json()).toEqual(privateLink);
      const operation = handler === regenerate ? mocks.regenerate : mocks.reset;
      expect(operation).toHaveBeenCalledWith(expect.objectContaining({ ownerUserId: "test-owner", publicCode }));
    },
  );

  it.each([{ handler: regenerate }, { handler: reset }])(
    "protects an unauthenticated private-link response without mutating data", async ({ handler }) => {
      mocks.session.mockResolvedValue({ status: "unauthenticated" });
      const response = await handler(request(), params);
      expect(response.status).toBe(401);
      expectNoStore(response);
      expect(mocks.regenerate).not.toHaveBeenCalled();
      expect(mocks.reset).not.toHaveBeenCalled();
    },
  );
});
