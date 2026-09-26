import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LEGACY_SESSION_COOKIE_NAME } from "@/lib/auth/cookie-names";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  if (request.cookies.has(LEGACY_SESSION_COOKIE_NAME)) {
    response.cookies.delete(LEGACY_SESSION_COOKIE_NAME);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
