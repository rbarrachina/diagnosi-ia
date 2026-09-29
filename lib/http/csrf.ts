import { resolveAppUrl } from "@/lib/http/app-url";

/** Browser mutations must originate from this application, including sibling hosts. */
export function isAllowedRequestOrigin(request: Request, configuredUrl?: string): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;

  let expectedOrigin: string;
  try {
    const target = new URL(resolveAppUrl(request.url, configuredUrl));
    if (target.protocol !== "https:" && target.protocol !== "http:") return false;
    expectedOrigin = target.origin;
  } catch {
    return false;
  }

  const origin = request.headers.get("origin");
  // An explicit opaque or foreign Origin must never fall back to Referer.
  if (origin !== null) return origin === expectedOrigin;

  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    const source = new URL(referer);
    return source.origin === expectedOrigin;
  } catch {
    return false;
  }
}
