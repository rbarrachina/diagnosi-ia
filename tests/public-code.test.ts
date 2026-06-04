import { generatePublicCode, isPublicCode, PUBLIC_CODE_ALPHABET } from "@/lib/crypto/public-code";

describe("public code generation", () => {
  it("generates readable public codes with the expected format", () => {
    for (let index = 0; index < 100; index += 1) {
      const code = generatePublicCode();

      expect(code).toMatch(/^C-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
      expect(isPublicCode(code)).toBe(true);
    }
  });

  it("excludes ambiguous characters", () => {
    expect(PUBLIC_CODE_ALPHABET).not.toMatch(/[0O1IL]/);
  });

  it("does not depend on Math.random", () => {
    const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Math.random must not be used");
    });

    expect(() => generatePublicCode()).not.toThrow();
    randomSpy.mockRestore();
  });
});
