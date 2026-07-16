import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuestionnaireForm } from "@/components/questionnaire/questionnaire-form";
import type { PublicQuestionnaire } from "@/lib/questionnaire/types";

const questionnaire: PublicQuestionnaire = {
  publicCode: "C-TEST-1234",
  questionnaireVersion: "2026.2",
  estimatedMinutes: 10,
  blocks: [
    {
      id: "01",
      position: 1,
      title: "Bloc de prova",
      questions: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          position: 1,
          blockPosition: 1,
          text: "Pregunta de prova",
        },
      ],
    },
  ],
};

describe("questionnaire introduction", () => {
  it("presents metadata and the previous-submission notice as information", () => {
    window.scrollTo = vi.fn();

    render(
      <QuestionnaireForm alreadySubmitted questionnaire={questionnaire} />,
    );

    const versionMetadata = screen
      .getByText("Versió del qüestionari:")
      .closest("div");
    const timeMetadata = screen.getByText("Temps estimat:").closest("div");
    const submittedNotice = screen.getByRole("status");

    expect(versionMetadata).not.toHaveClass("rounded-md", "border", "bg-sky-50");
    expect(timeMetadata).not.toHaveClass("rounded-md", "border", "bg-sky-50");
    expect(submittedNotice).toHaveTextContent("✅");
    expect(submittedNotice).toHaveTextContent(
      "Aquest usuari ja ha respost l'enquesta i no la pot tornar a fer.",
    );
    expect(submittedNotice).not.toHaveClass(
      "rounded-md",
      "border",
      "bg-amber-50",
    );
    expect(
      screen.getByRole("button", { name: "Comença el qüestionari" }),
    ).toBeDisabled();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
