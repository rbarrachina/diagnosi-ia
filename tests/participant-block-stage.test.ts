import { describe, expect, it } from "vitest";
import { getBlockStage } from "@/lib/participants/block-stage";
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

  it("uses exact thirds at both stage boundaries", () => {
    expect(getBlockStage(block([1, 1, 1, 0])).stage).toBe("basic");
    expect(getBlockStage(block([1, 1, 1, 1])).stage).toBe("intermediate");
    expect(getBlockStage(block([2, 2, 2, 1])).stage).toBe("intermediate");
    expect(getBlockStage(block([2, 2, 2, 2])).stage).toBe("advanced");
  });

  it("places the maximum at the far right of the advanced stage", () => {
    expect(getBlockStage(block([3, 3, 3, 3]))).toEqual({ position: 100, stage: "advanced" });
  });
});
