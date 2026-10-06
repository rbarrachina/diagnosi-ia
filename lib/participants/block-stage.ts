import type { ParticipantBlockResult } from "@/lib/participants/types";

export type BlockStage = "basic" | "intermediate" | "advanced";

export function getParticipantCompetence(blocks: ParticipantBlockResult[]): {
  position: number;
  stage: BlockStage;
} | null {
  if (blocks.length === 0 || blocks.some((block) => block.questions.length === 0)) return null;

  const average = blocks.reduce((sum, block) => {
    const total = block.questions.reduce((value, question) => value + question.value, 0);
    return sum + total / block.questions.length;
  }, 0) / blocks.length;

  return {
    position: average / 3 * 100,
    stage: average <= 1 ? "basic" : average <= 2 ? "intermediate" : "advanced",
  };
}

export function getBlockStage(block: ParticipantBlockResult): {
  position: number;
  stage: BlockStage;
} {
  const maximum = block.questions.length * 3;
  const total = block.questions.reduce((sum, question) => sum + question.value, 0);

  if (maximum === 0) return { position: 0, stage: "basic" };

  return {
    position: (total / maximum) * 100,
    stage: total * 3 <= maximum
      ? "basic"
      : total * 3 <= maximum * 2
        ? "intermediate"
        : "advanced",
  };
}
