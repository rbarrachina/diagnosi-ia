import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import type { AggregatedResults } from "@/lib/results/types";

const results: AggregatedResults = {
  publicCode: "C-TEST-1234", questionnaireVersion: "2026.2",
  generatedAt: "2026-10-23T12:00:00Z", totalSubmissions: 0,
  globalAverage: null, lowResponseWarning: false, scale: [], blocks: [],
  interpretation: "", strengths: [], improvementAreas: [],
};

describe("integrated results panels", () => {
  it("opens one panel at a time and lets the active control close it", () => {
    render(<ResultsDashboard showDimensionScales results={results} isDownloading={false}
      onDownloadPdf={vi.fn()} detailsLabel="Comparteix els resultats"
      detailsContent={<p>Contingut compartició</p>} />);
    const charts = screen.getByRole("button", { name: "Altres gràfics" });
    const dimensions = screen.getByRole("button", { name: "Detall dimensions" });
    const sharing = screen.getByRole("button", { name: "Comparteix els resultats" });
    [charts, dimensions, sharing].forEach(button => expect(button).toHaveAttribute("aria-expanded", "false"));
    fireEvent.click(charts);
    expect(charts).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(dimensions);
    expect(charts).toHaveAttribute("aria-expanded", "false");
    expect(dimensions).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(sharing);
    expect(dimensions).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Contingut compartició")).toBeVisible();
    fireEvent.click(sharing);
    expect(sharing).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Contingut compartició")).not.toBeVisible();
  });
});
