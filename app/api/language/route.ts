import { NextResponse } from "next/server";
import { z } from "zod";
import { isLanguageCode } from "@/lib/i18n/languages";
import { LANGUAGE_COOKIE_NAME } from "@/lib/i18n/locale";

const languageSelectionSchema = z
  .object({ language: z.string().refine(isLanguageCode) })
  .strict();

export async function POST(request: Request) {
  const parsed = languageSelectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(LANGUAGE_COOKIE_NAME, parsed.data.language, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
