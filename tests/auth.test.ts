import { isXtecEmail } from "@/lib/auth/xtec";

describe("XTEC authentication rules", () => {
  it("accepts only exact @xtec.cat email addresses", () => {
    expect(isXtecEmail("persona@xtec.cat")).toBe(true);
    expect(isXtecEmail("PERSONA@XTEC.CAT")).toBe(true);
    expect(isXtecEmail("persona@institut.xtec.cat")).toBe(false);
    expect(isXtecEmail("persona@example.cat")).toBe(false);
    expect(isXtecEmail(null)).toBe(false);
  });
});
