import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { LEGACY_SESSION_COOKIE_NAME } from "@/lib/auth/cookie-names";

export async function proxy(request: NextRequest) {
  const nonce = randomBytes(32).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    // Recharts and questionnaire progress use calculated inline styles.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join("; ");
  const headers = new Headers(request.headers);
  // Replace client-supplied values before Next.js extracts the script nonce.
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  headers.delete("Content-Security-Policy-Report-Only");

  const response = NextResponse.next({
    request: { headers },
  });
  response.headers.set("Content-Security-Policy", policy);

  if (request.cookies.has(LEGACY_SESSION_COOKIE_NAME)) {
    response.cookies.delete(LEGACY_SESSION_COOKIE_NAME);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static(?:/|$)|_next/image(?:/|$)|favicon\\.ico$|icon\\.svg$).*)",
  ],
};
