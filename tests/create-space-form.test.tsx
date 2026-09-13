import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CreateSpaceForm,
  type CreatedSpaceResponse,
} from "@/components/create-space/create-space-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const space: CreatedSpaceResponse = {
  publicCode: "C-TEST-1234",
  questionnaireTitle: "Diagnosi IA",
  questionnaireVersion: "2026.2",
  publicUrl: "http://localhost:3000/q/C-TEST-1234",
  sharedResultsUrl:
    "http://localhost:3000/resultats/compartit/C-TEST-1234#token=test",
  ownerResultsUrl: "/espais/C-TEST-1234/resultats",
  questionnairePreviewUrl: "/espais/C-TEST-1234/questionari",
  totalSubmissions: 4,
};

describe("create space form", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("separates questionnaire sharing, result sharing and destructive actions", () => {
    render(
      <CreateSpaceForm
        centreName="Institut Escola El Til·ler"
        communicationTemplate={{ subject: "Assumpte", body: "Cos" }}
        existingSpace={space}
        responsibleEmail="a8075669@xtec.cat"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Comparteix el qüestionari" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Comparteix els resultats" }),
    ).toBeVisible();
    expect(screen.getByText("Opcional")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Vols començar de nou?" }),
    ).toBeVisible();
    expect(screen.getByDisplayValue(space.publicUrl)).toHaveAccessibleName(
      "Enllaç públic per al professorat",
    );
    expect(screen.getByDisplayValue(space.sharedResultsUrl!)).toHaveAccessibleName(
      "Enllaç privat compartit de resultats",
    );
  });

  it("explains the email handoff before opening Gmail", () => {
    render(
      <CreateSpaceForm
        centreName="Institut Escola El Til·ler"
        communicationTemplate={{ subject: "Assumpte", body: "Cos" }}
        existingSpace={space}
        responsibleEmail="a8075669@xtec.cat"
      />,
    );

    const emailButton = screen.getByRole("button", { name: "Envia el correu" });
    expect(emailButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(emailButton);

    expect(emailButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Obre Gmail" })).toBeVisible();
    expect(screen.getByText("a8075669@xtec.cat")).toBeVisible();
  });
});
