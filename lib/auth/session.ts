import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseAuthServerClient } from "@/lib/database/auth-server";
import { isXtecUser } from "@/lib/auth/xtec";

export type XtecSessionState =
  | { status: "authenticated"; user: User & { email: string } }
  | { status: "forbidden"; email: string | null }
  | { status: "unauthenticated" };

export async function getXtecSessionState(): Promise<XtecSessionState> {
  let user = null;

  try {
    const supabase = await createSupabaseAuthServerClient();
    const response = await supabase.auth.getUser();
    user = response.data.user;
  } catch {
    return { status: "unauthenticated" };
  }

  if (!user) {
    return { status: "unauthenticated" };
  }

  if (!isXtecUser(user)) {
    return { status: "forbidden", email: user.email ?? null };
  }

  return { status: "authenticated", user };
}

export async function getRequiredXtecUser(): Promise<User & { email: string }> {
  const session = await getXtecSessionState();

  if (session.status !== "authenticated") {
    throw new Error("Authenticated XTEC user is required");
  }

  return session.user;
}
