import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OwnerResultsClient } from "@/components/results/owner-results-client";
import type { AggregatedResults } from "@/lib/results/types";

vi.mock("@/components/results/results-dashboard", () => ({
  ResultsDashboard: ({ introContent }: { introContent?: ReactNode }) => (
    <div>{introContent}</div>
  ),
}));

const results = {} as AggregatedResults;
const sharedResultsUrl =
  "http://localhost:3000/resultats/compartit/C-TEST-1234#token=test";

describe("owner results client", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("shows result sharing inside the results view and copies its private link", async () => {
    render(
      <OwnerResultsClient
        publicCode="C-TEST-1234"
        results={results}
        sharedResultsUrl={sharedResultsUrl}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Comparteix els resultats" }),
    ).toBeVisible();
    expect(screen.getByDisplayValue(sharedResultsUrl)).toHaveAccessibleName(
      "Enllaç privat compartit de resultats",
    );

    fireEvent.click(screen.getByRole("button", { name: "Copia" }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sharedResultsUrl);
    });
  });

  it("regenerates the private result link from the results view", async () => {
    const regeneratedUrl =
      "http://localhost:3000/resultats/compartit/C-TEST-1234#token=new";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sharedResultsUrl: regeneratedUrl }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <OwnerResultsClient
        publicCode="C-TEST-1234"
        results={results}
        sharedResultsUrl={sharedResultsUrl}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Regenerar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/spaces/C-TEST-1234/results-token",
        { method: "POST" },
      );
      expect(screen.getByDisplayValue(regeneratedUrl)).toBeVisible();
    });
  });
});
