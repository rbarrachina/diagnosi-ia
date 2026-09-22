import { beforeEach, describe, expect, it } from "vitest";
import { initializeVisualPreferences } from "@/lib/ui/initialize-visual-preferences";

describe("visual preferences initializer", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-centre-sidebar");
    document.documentElement.removeAttribute("data-admin-sidebar");
    document.documentElement.style.colorScheme = "";
  });

  it("restores theme and sidebar preferences before hydration", () => {
    const values: Record<string, string> = {
      "diagnosi-theme": "dark",
      "diagnosi-ia:centre-sidebar-expanded": "false",
      "diagnosi-ia:admin-sidebar-expanded": "true",
    };
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: (key: string) => values[key] ?? null },
    });

    initializeVisualPreferences();

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.dataset.centreSidebar).toBe("collapsed");
    expect(document.documentElement.dataset.adminSidebar).toBe("expanded");
  });

  it("uses safe defaults when browser storage is unavailable", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => { throw new Error("storage unavailable"); } },
    });

    initializeVisualPreferences();

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.dataset.centreSidebar).toBe("expanded");
    expect(document.documentElement.dataset.adminSidebar).toBe("expanded");
  });
});
