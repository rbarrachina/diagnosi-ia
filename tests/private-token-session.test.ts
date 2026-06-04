import { readPrivateTokenFromLocation } from "@/lib/results/private-token-session";

function createStorage(initialValue?: string): Storage {
  const values = new Map<string, string>();

  if (initialValue) {
    values.set("diagnosi-ia:results-token:C-7KX9-M2Q8", initialValue);
  }

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  } as Storage;
}

describe("readPrivateTokenFromLocation", () => {
  it("reads the token from the hash, stores it for the tab and clears the URL", () => {
    const storage = createStorage();
    const replaceState = vi.fn();

    const token = readPrivateTokenFromLocation(
      "C-7KX9-M2Q8",
      {
        hash: "#token=private-token",
        pathname: "/resultats/C-7KX9-M2Q8",
      } as Location,
      { replaceState } as unknown as History,
      storage,
    );

    expect(token).toBe("private-token");
    expect(storage.getItem("diagnosi-ia:results-token:C-7KX9-M2Q8")).toBe("private-token");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/resultats/C-7KX9-M2Q8");
  });

  it("reuses the token from session storage when the URL has no hash", () => {
    const storage = createStorage("stored-token");
    const replaceState = vi.fn();

    const token = readPrivateTokenFromLocation(
      "C-7KX9-M2Q8",
      {
        hash: "",
        pathname: "/resultats/C-7KX9-M2Q8",
      } as Location,
      { replaceState } as unknown as History,
      storage,
    );

    expect(token).toBe("stored-token");
    expect(replaceState).not.toHaveBeenCalled();
  });
});
