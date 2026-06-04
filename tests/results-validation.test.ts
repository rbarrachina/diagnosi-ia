import { privateResultsRequestSchema } from "@/lib/validation/schemas";

describe("private results payload validation", () => {
  it("accepts public code and private token only", () => {
    expect(() =>
      privateResultsRequestSchema.parse({
        publicCode: "C-7KX9-M2Q8",
        privateToken: "a".repeat(43),
      }),
    ).not.toThrow();
  });

  it("rejects missing token, invalid code and additional fields", () => {
    expect(() =>
      privateResultsRequestSchema.parse({
        publicCode: "C-7KX9-M2Q8",
      }),
    ).toThrow();

    expect(() =>
      privateResultsRequestSchema.parse({
        publicCode: "centre-identified",
        privateToken: "a".repeat(43),
      }),
    ).toThrow();

    expect(() =>
      privateResultsRequestSchema.parse({
        publicCode: "C-7KX9-M2Q8",
        privateToken: "a".repeat(43),
        includeRows: true,
      }),
    ).toThrow();
  });
});
