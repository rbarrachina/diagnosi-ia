import type { ParticipantBlockResult } from "@/lib/participants/types";

export type BlockStage = "basic" | "intermediate" | "advanced";

export function getBlockStage(block: ParticipantBlockResult): {
  position: number;
  stage: BlockStage;
} {
  const maximum = block.questions.length * 3;
  const total = block.questions.reduce((sum, question) => sum + question.value, 0);

  if (maximum === 0) return { position: 0, stage: "basic" };

  return {
    position: (total / maximum) * 100,
    stage: total * 3 < maximum
      ? "basic"
      : total * 3 < maximum * 2
        ? "intermediate"
        : "advanced",
  };
}
