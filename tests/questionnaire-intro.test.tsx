import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuestionnaireForm } from "@/components/questionnaire/questionnaire-form";
import type { PublicQuestionnaire } from "@/lib/questionnaire/types";

const questionnaire: PublicQuestionnaire = {
  centreName: "Institut de Prova",
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
          text: "Descripció breu: Pregunta de prova",
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

  it("uses the shared application surface and response option styles", () => {
    window.scrollTo = vi.fn();

    const { container } = render(
      <QuestionnaireForm questionnaire={questionnaire} />,
    );

    expect(container.querySelector("section")).toHaveClass(
      "questionnaire-panel",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Comença el qüestionari" }),
    );

    expect(screen.getByRole("group", { name: /Pregunta de prova/ })).toHaveClass(
      "questionnaire-question",
    );
    expect(screen.getByText("1.1. Descripció breu")).toHaveClass(
      "text-xs",
      "text-action",
    );
    expect(screen.getByText("Pregunta de prova")).toHaveClass(
      "text-base",
      "font-semibold",
    );
    expect(screen.getByLabelText("Gens / No ho faig").closest("label")).toHaveClass(
      "questionnaire-scale-option",
      "rounded-xl",
    );
    expect(screen.getByRole("progressbar", { name: "Progrés del qüestionari" }))
      .toHaveAttribute("aria-valuenow", "50");
  });
});
