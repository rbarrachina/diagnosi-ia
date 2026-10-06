import { describe, expect, it } from "vitest";
import { getBlockStage, getParticipantCompetence } from "@/lib/participants/block-stage";
import type { ParticipantBlockResult } from "@/lib/participants/types";
import type { ScaleValue } from "@/lib/results/types";

function block(values: ScaleValue[]): ParticipantBlockResult {
  return {
    position: 1,
    title: "Bloc de prova",
    score: 0,
    questions: values.map((value, index) => ({
      position: index + 1,
      blockPosition: index + 1,
      criterionPosition: 1,
      questionPosition: index + 1,
      criterionTitle: "Criteri generals",
      text: `Pregunta ${index + 1}`,
      value,
      label: "Resposta",
      randomizeOptions: false,
      options: [],
    })),
  };
}

describe("individual block stages", () => {
  it("places zero at the far left of the basic stage", () => {
    expect(getBlockStage(block([0, 0, 0, 0]))).toEqual({ position: 0, stage: "basic" });
  });

  it("keeps exact thirds in the lower stage", () => {
    expect(getBlockStage(block([1, 1, 1, 0])).stage).toBe("basic");
    expect(getBlockStage(block([1, 1, 1, 1])).stage).toBe("basic");
    expect(getBlockStage(block([2, 2, 2, 1])).stage).toBe("intermediate");
    expect(getBlockStage(block([2, 2, 2, 2])).stage).toBe("intermediate");
  });

  it("places the maximum at the far right of the advanced stage", () => {
    expect(getBlockStage(block([3, 3, 3, 3]))).toEqual({ position: 100, stage: "advanced" });
  });
});

describe("individual overall competence", () => {
  it("gives each dimension the same weight regardless of question count", () => {
    expect(getParticipantCompetence([block([0]), block([3, 3, 3, 3, 3])])).toEqual({
      position: 50,
      stage: "intermediate",
    });
  });

  it("classifies exact thirds in the lower stage without rounding dimension scores", () => {
    expect(getParticipantCompetence([block([0]), block([2])])?.stage).toBe("basic");
    expect(getParticipantCompetence([block([1]), block([3])])?.stage).toBe("intermediate");
    expect(getParticipantCompetence([block([1]), block([2, 2, 1])])?.stage).toBe("intermediate");
    expect(getParticipantCompetence([block([0]), block([1, 1, 1])])?.stage).toBe("basic");
  });

  it("handles both extremes and incomplete dimension data", () => {
    expect(getParticipantCompetence([block([0]), block([0])])).toEqual({ position: 0, stage: "basic" });
    expect(getParticipantCompetence([block([3]), block([3])])).toEqual({ position: 100, stage: "advanced" });
    expect(getParticipantCompetence([])).toBeNull();
    expect(getParticipantCompetence([block([3]), block([])])).toBeNull();
  });
});
