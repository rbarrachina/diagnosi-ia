import type { CSSProperties } from "react";
import type { ScaleValue } from "./scale";

export type AnswerColors = readonly [string, string, string, string];

export const DEFAULT_ANSWER_COLORS: AnswerColors = ["#ef7777", "#e7a64b", "#9fba55", "#42b873"];
export const ANSWER_PALETTE_PATTERN = /^#[0-9a-f]{6}(,#[0-9a-f]{6}){3}$/i;

export function readAnswerColors(value?: string | null): AnswerColors {
  if (!value || !ANSWER_PALETTE_PATTERN.test(value)) return DEFAULT_ANSWER_COLORS;
  const [first, second, third, fourth] = value.toLowerCase().split(",");
  return [first, second, third, fourth];
}

export function answerColorStyle(colors: AnswerColors | undefined, score: ScaleValue): CSSProperties | undefined {
  const color = colors?.[score];
  return color ? { "--questionnaire-scale-color": color } as CSSProperties : undefined;
}
