import {
  hasLocalSubmission,
  markLocalSubmission,
} from "@/lib/submissions/local-submission-lock";

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    values,
  };
}

describe("local submission lock", () => {
  it("marks a public questionnaire code as submitted in browser storage", () => {
    const storage = createMemoryStorage();

    expect(hasLocalSubmission("C-7KX9-M2Q8", storage)).toBe(false);

    markLocalSubmission("C-7KX9-M2Q8", storage);

    expect(hasLocalSubmission("C-7KX9-M2Q8", storage)).toBe(true);
  });

  it("scopes the lock to each public code", () => {
    const storage = createMemoryStorage();

    markLocalSubmission("C-7KX9-M2Q8", storage);

    expect(hasLocalSubmission("C-7KX9-M2Q8", storage)).toBe(true);
    expect(hasLocalSubmission("C-ABCD-2345", storage)).toBe(false);
  });

  it("stores only a boolean marker keyed by the anonymous public code", () => {
    const storage = createMemoryStorage();

    markLocalSubmission("C-7KX9-M2Q8", storage);

    expect(Array.from(storage.values.entries())).toEqual([
      ["diagnosi-ia:submitted:C-7KX9-M2Q8", "true"],
    ]);
  });
});
