export const PRIVATE_CACHE_CONTROL = "private, no-store, max-age=0";

export function privateJson(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", PRIVATE_CACHE_CONTROL);
  return Response.json(data, { ...init, headers });
}
