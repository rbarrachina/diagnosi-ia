import { beforeEach, describe, expect, it, vi } from "vitest";

import { lookupCentreOpenData } from "@/lib/centres/open-data";
import { canHaveCentreProfile } from "@/lib/centres/access";

describe("centre open data lookup", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows an administrator to have a profile with a personal XTEC email", () => {
    expect(canHaveCentreProfile("persona@xtec.cat")).toBe(false);
    expect(canHaveCentreProfile("persona@xtec.cat", true)).toBe(true);
    expect(canHaveCentreProfile("a8075669@xtec.cat")).toBe(true);
  });

  it("returns the selected centre fields and educational service", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              codi_centre: "08075669",
              denominaci_completa: "Institut Escola El Til·ler",
              nom_municipi: "Barcelona",
              nom_delegaci: "Consorci d'Educació de Barcelona",
              nom_dm: "Sant Andreu",
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            services: [
              {
                name: "CRP Sant Andreu",
                district: "Sant Andreu",
                municipalities: ["Barcelona"],
              },
            ],
          }),
          { status: 200 },
        ),
      );

    await expect(lookupCentreOpenData("a8075669@xtec.cat")).resolves.toEqual({
      status: "ok",
      data: {
        officialCode: "08075669",
        officialName: "Institut Escola El Til·ler",
        municipality: "Barcelona",
        territorialArea: "Consorci d'Educació de Barcelona",
        educationalService: "CRP Sant Andreu",
      },
    });
  });

  it("distinguishes a missing centre from an unavailable API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    await expect(lookupCentreOpenData("a0000000@xtec.cat")).resolves.toEqual({
      status: "not_found",
    });

    fetchMock.mockResolvedValueOnce(new Response("error", { status: 503 }));
    await expect(lookupCentreOpenData("a0000000@xtec.cat")).resolves.toEqual({
      status: "unavailable",
    });
  });
});
