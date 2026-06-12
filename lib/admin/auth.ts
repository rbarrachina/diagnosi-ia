import "server-only";

import type { User } from "@supabase/supabase-js";
import { getXtecSessionState } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/database/server";

export type AdminSessionState =
  | { status: "authenticated"; user: User & { email: string }; bootstrapped: boolean }
  | { status: "forbidden"; reason: "not_xtec" | "not_admin"; email: string | null }
  | { status: "setup_error"; reason: "admin_storage_unavailable" }
  | { status: "unauthenticated" };

export class AdminAccessError extends Error {
  constructor() {
    super("Active administrator access is required");
    this.name = "AdminAccessError";
  }
}

type AdminUserRow = {
  user_id: string;
};

async function isActiveAdminUser(userId: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .eq("is_active", true)
    .maybeSingle<AdminUserRow>();

  if (error) {
    throw new Error("Could not check administrator access");
  }

  return Boolean(data);
}

async function bootstrapFirstAdmin(userId: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("bootstrap_first_admin", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error("Could not bootstrap first administrator");
  }

  return Boolean(data);
}

export async function getAdminSessionState(options: {
  allowBootstrap?: boolean;
} = {}): Promise<AdminSessionState> {
  const session = await getXtecSessionState();

  if (session.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (session.status === "forbidden") {
    return { status: "forbidden", reason: "not_xtec", email: session.email };
  }

  try {
    if (await isActiveAdminUser(session.user.id)) {
      return {
        status: "authenticated",
        user: session.user,
        bootstrapped: false,
      };
    }

    const bootstrapped = options.allowBootstrap
      ? await bootstrapFirstAdmin(session.user.id)
      : false;

    if (bootstrapped || (await isActiveAdminUser(session.user.id))) {
      return {
        status: "authenticated",
        user: session.user,
        bootstrapped,
      };
    }
  } catch {
    return {
      status: "setup_error",
      reason: "admin_storage_unavailable",
    };
  }

  return {
    status: "forbidden",
    reason: "not_admin",
    email: session.user.email,
  };
}

export async function getRequiredAdminUser(): Promise<User & { email: string }> {
  const session = await getAdminSessionState();

  if (session.status !== "authenticated") {
    throw new AdminAccessError();
  }

  return session.user;
}
