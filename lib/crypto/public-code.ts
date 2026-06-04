import { randomInt } from "node:crypto";

export const PUBLIC_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const PUBLIC_CODE_PATTERN =
  /^C-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

export function generatePublicCode(): string {
  const chars = Array.from({ length: 8 }, () =>
    PUBLIC_CODE_ALPHABET[randomInt(PUBLIC_CODE_ALPHABET.length)],
  ).join("");

  return `C-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export function isPublicCode(value: string): boolean {
  return PUBLIC_CODE_PATTERN.test(value);
}
