import { randomInt } from "node:crypto";
import {
  PUBLIC_CODE_ALPHABET,
  PUBLIC_CODE_PATTERN,
} from "@/lib/validation/public-code";

export { PUBLIC_CODE_ALPHABET, PUBLIC_CODE_PATTERN };

export function generatePublicCode(): string {
  const chars = Array.from({ length: 8 }, () =>
    PUBLIC_CODE_ALPHABET[randomInt(PUBLIC_CODE_ALPHABET.length)],
  ).join("");

  return `C-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export function isPublicCode(value: string): boolean {
  return PUBLIC_CODE_PATTERN.test(value);
}
