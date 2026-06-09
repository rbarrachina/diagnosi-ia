import "server-only";

import { headers } from "next/headers";
import { resolveAppUrl } from "@/lib/http/app-url";

export async function getServerAppUrl(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("host");

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }

  const proto = headerStore.get("x-forwarded-proto") ?? "http";

  return resolveAppUrl(`${proto}://${host}/`, process.env.NEXT_PUBLIC_APP_URL);
}
