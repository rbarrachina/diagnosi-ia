import { describe, expect, it } from "vitest";
import { safeRelativePath } from "@/lib/http/redirect";

describe("internal redirect destinations", () => {
  it.each([
    null,
    "",
    "crear",
    "https://example.invalid/",
    "//example.invalid/",
    "/\\example.invalid/",
    "/nested/..//example.invalid/",
    "/%2e%2e//example.invalid/",
    "/nested\\path",
    "/\n/example.invalid/",
    "/\r/example.invalid/",
    "/\t/example.invalid/",
    "/crear\u0000",
    "/crear\u007f",
  ])("rejects unsafe destination %j", (destination) => {
    expect(safeRelativePath(destination, "/crear")).toBe("/crear");
  });

  it.each([
    ["/", "/"],
    ["/crear?view=settings#email-policy", "/crear?view=settings#email-policy"],
    ["/docent/resultats/C-ABCD-EFGH", "/docent/resultats/C-ABCD-EFGH"],
    ["/q/C-ABCD-EFGH", "/q/C-ABCD-EFGH"],
    ["/nested/../crear", "/crear"],
    ["/%2e%2e/crear", "/crear"],
    ["/%2F%2Fexample.invalid", "/%2F%2Fexample.invalid"],
  ])("keeps %s within the app origin", (destination, expected) => {
    const result = safeRelativePath(destination);
    expect(result).toBe(expected);
    expect(new URL(result, "https://diagnosia.example").origin).toBe(
      "https://diagnosia.example",
    );
  });

  it("supports rejecting invalid signed state with an empty fallback", () => {
    expect(safeRelativePath("/\\example.invalid", "")).toBe("");
  });
});
