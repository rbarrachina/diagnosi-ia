import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/database/server";
import type { AdminUserSearchResult, AdminUserSummary } from "@/lib/admin/types";
import { isXtecEmail } from "@/lib/auth/xtec";
import {
  adminUserInputSchema,
  adminUserSearchQuerySchema,
  setAdminUserActiveInputSchema,
  type AdminUserInput,
  type AdminUserSearchQuery,
  type SetAdminUserActiveInput,
} from "@/lib/validation/schemas";

type AdminUserRow = {
  user_id: string;
  role: "admin";
  is_active: boolean;
  created_at: string;
  created_by: string | null;
};

const AUTH_SEARCH_PAGE_SIZE = 100;
const MAX_AUTH_SEARCH_PAGES = 10;
const MAX_AUTH_SEARCH_RESULTS = 20;

function metadataText(user: User, keys: string[]) {
  for (const key of keys) {
    const value = user.user_metadata?.[key];

    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return null;
}

function getDisplayName(user: User) {
  const directName = metadataText(user, ["full_name", "name", "display_name"]);

  if (directName) {
    return directName;
  }

  const givenName = metadataText(user, ["given_name"]);
  const familyName = metadataText(user, ["family_name"]);
  const combinedName = [givenName, familyName].filter(Boolean).join(" ").trim();

  return combinedName || null;
}

function searchableText(user: User) {
  return [
    user.email,
    getDisplayName(user),
    metadataText(user, ["given_name"]),
    metadataText(user, ["family_name"]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function mapAuthUser(user: User): AdminUserSearchResult | null {
  if (!isXtecEmail(user.email)) {
    return null;
  }

  return {
    userId: user.id,
    displayName: getDisplayName(user),
    email: user.email,
  };
}

function mapAdminUser(
  row: AdminUserRow,
  profile?: AdminUserSearchResult | null,
): AdminUserSummary {
  return {
    userId: row.user_id,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    createdBy: row.created_by,
    displayName: profile?.displayName ?? null,
    email: profile?.email ?? null,
  };
}

export class AdminUserOperationError extends Error {
  constructor(message = "Could not manage administrator") {
    super(message);
    this.name = "AdminUserOperationError";
  }
}

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, role, is_active, created_at, created_by")
    .order("created_at", { ascending: true })
    .returns<AdminUserRow[]>();

  if (error || !data) {
    throw new AdminUserOperationError("Could not list administrators");
  }

  const profiles = await Promise.all(
    data.map(async (row) => {
      const { data: authData, error: authError } =
        await supabase.auth.admin.getUserById(row.user_id);

      if (authError || !authData.user) {
        return [row.user_id, null] as const;
      }

      return [row.user_id, mapAuthUser(authData.user)] as const;
    }),
  );
  const profileByUserId = new Map(profiles);

  return data.map((row) => mapAdminUser(row, profileByUserId.get(row.user_id)));
}

export async function searchAuthUsersForAdmin(
  query: AdminUserSearchQuery,
): Promise<AdminUserSearchResult[]> {
  const parsedQuery = adminUserSearchQuerySchema.parse(query).toLowerCase();
  const supabase = createSupabaseAdminClient();
  const results = new Map<string, AdminUserSearchResult>();

  for (let page = 1; page <= MAX_AUTH_SEARCH_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: AUTH_SEARCH_PAGE_SIZE,
    });

    if (error) {
      throw new AdminUserOperationError("Could not search users");
    }

    const users = data.users ?? [];

    for (const user of users) {
      const result = mapAuthUser(user);

      if (result && searchableText(user).includes(parsedQuery)) {
        results.set(result.userId, result);
      }

      if (results.size >= MAX_AUTH_SEARCH_RESULTS) {
        return [...results.values()];
      }
    }

    if (users.length < AUTH_SEARCH_PAGE_SIZE) {
      break;
    }
  }

  return [...results.values()];
}

export async function addOrReactivateAdminUser(
  input: AdminUserInput,
  actorUserId: string,
): Promise<AdminUserSummary> {
  const payload = adminUserInputSchema.parse(input);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .upsert(
      {
        user_id: payload.userId,
        role: "admin",
        is_active: true,
        created_by: actorUserId,
      },
      { onConflict: "user_id" },
    )
    .select("user_id, role, is_active, created_at, created_by")
    .single<AdminUserRow>();

  if (error || !data) {
    throw new AdminUserOperationError();
  }

  return mapAdminUser(data);
}

export async function deleteAdminUser(
  input: AdminUserInput,
  actorUserId: string,
): Promise<void> {
  const payload = adminUserInputSchema.parse(input);

  if (payload.userId === actorUserId) {
    throw new AdminUserOperationError("Administrators cannot remove themselves");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .delete()
    .eq("user_id", payload.userId)
    .select("user_id")
    .single<{ user_id: string }>();

  if (error || !data) {
    throw new AdminUserOperationError();
  }
}

export async function setAdminUserActive(
  input: SetAdminUserActiveInput,
  actorUserId: string,
): Promise<AdminUserSummary> {
  const payload = setAdminUserActiveInputSchema.parse(input);

  if (payload.userId === actorUserId && !payload.isActive) {
    throw new AdminUserOperationError("Administrators cannot deactivate themselves");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .update({
      is_active: payload.isActive,
    })
    .eq("user_id", payload.userId)
    .select("user_id, role, is_active, created_at, created_by")
    .single<AdminUserRow>();

  if (error || !data) {
    throw new AdminUserOperationError();
  }

  return mapAdminUser(data);
}
