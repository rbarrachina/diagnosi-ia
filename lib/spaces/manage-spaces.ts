import "server-only";

import { generatePublicCode } from "@/lib/crypto/public-code";
import { createSupabaseAdminClient } from "@/lib/database/server";
import {
  buildOwnerResultsUrl,
  buildSharedResultsUrl,
  decryptStoredResultsToken,
  generateResultsToken,
} from "@/lib/results/results-token";

const MAX_RESET_CODE_ATTEMPTS = 8;

type OwnerSpaceRow = {
  id: string;
  public_code: string;
  is_active: boolean;
  created_at: string;
  results_token_enabled: boolean;
  results_token_encrypted: string | null;
};

export type OwnerDiagnosticSpace = {
  publicCode: string;
  isActive: boolean;
  createdAt: string;
  publicUrl: string;
  ownerResultsUrl: string;
  sharedResultsUrl: string | null;
  resultsTokenEnabled: boolean;
  totalSubmissions: number;
};

export type ResetOwnerDiagnosticSpaceResult = {
  publicCode: string;
  publicUrl: string;
  ownerResultsUrl: string;
  sharedResultsUrl: string;
  totalSubmissions: number;
};

function mapOwnerSpace(
  row: OwnerSpaceRow,
  appUrl: string,
  totalSubmissions: number,
): OwnerDiagnosticSpace {
  const token = decryptStoredResultsToken(row.results_token_encrypted);

  return {
    publicCode: row.public_code,
    isActive: row.is_active,
    createdAt: row.created_at,
    publicUrl: `${appUrl}/q/${row.public_code}`,
    ownerResultsUrl: buildOwnerResultsUrl(appUrl, row.public_code),
    sharedResultsUrl: token ? buildSharedResultsUrl(appUrl, row.public_code, token) : null,
    resultsTokenEnabled: row.results_token_enabled,
    totalSubmissions,
  };
}

async function countSpaceSubmissions(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  spaceId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("diagnostic_space_id", spaceId);

  if (error || count === null) {
    throw new Error("Could not count owner space submissions");
  }

  return count;
}

export async function listOwnerSpaces(
  ownerUserId: string,
  appUrl: string,
): Promise<OwnerDiagnosticSpace[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("diagnostic_spaces")
    .select(
      "id, public_code, is_active, created_at, results_token_enabled, results_token_encrypted",
    )
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false })
    .returns<OwnerSpaceRow[]>();

  if (error || !data) {
    throw new Error("Could not load owner spaces");
  }

  const spacesWithCounts = await Promise.all(
    data.map(async (space) => ({
      space,
      totalSubmissions: await countSpaceSubmissions(supabase, space.id),
    })),
  );

  return spacesWithCounts.map(({ space, totalSubmissions }) =>
    mapOwnerSpace(space, appUrl, totalSubmissions),
  );
}

export async function getOwnerSpace(
  ownerUserId: string,
  publicCode: string,
  appUrl: string,
): Promise<OwnerDiagnosticSpace | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("diagnostic_spaces")
    .select(
      "id, public_code, is_active, created_at, results_token_enabled, results_token_encrypted",
    )
    .eq("owner_user_id", ownerUserId)
    .eq("public_code", publicCode)
    .maybeSingle<OwnerSpaceRow>();

  if (error) {
    throw new Error("Could not load owner space");
  }

  if (!data) {
    return null;
  }

  const totalSubmissions = await countSpaceSubmissions(supabase, data.id);

  return mapOwnerSpace(data, appUrl, totalSubmissions);
}

export async function regenerateOwnerResultsToken(params: {
  ownerUserId: string;
  publicCode: string;
  appUrl: string;
}): Promise<{ sharedResultsUrl: string }> {
  const supabase = createSupabaseAdminClient();
  const resultsToken = generateResultsToken();

  const { data, error } = await supabase
    .from("diagnostic_spaces")
    .update({
      private_token_hmac: resultsToken.hash,
      results_token_hash: resultsToken.hash,
      results_token_encrypted: resultsToken.encrypted,
      results_token_enabled: true,
      results_token_created_at: new Date().toISOString(),
      results_token_expires_at: null,
    })
    .eq("owner_user_id", params.ownerUserId)
    .eq("public_code", params.publicCode)
    .select("public_code")
    .maybeSingle<{ public_code: string }>();

  if (error || !data) {
    throw new Error("Could not regenerate results token");
  }

  return {
    sharedResultsUrl: buildSharedResultsUrl(
      params.appUrl,
      data.public_code,
      resultsToken.token,
    ),
  };
}

export async function resetOwnerDiagnosticSpace(params: {
  ownerUserId: string;
  publicCode: string;
  appUrl: string;
}): Promise<ResetOwnerDiagnosticSpaceResult> {
  const supabase = createSupabaseAdminClient();

  for (let attempt = 0; attempt < MAX_RESET_CODE_ATTEMPTS; attempt += 1) {
    const newPublicCode = generatePublicCode();
    const resultsToken = generateResultsToken();

    const { data, error } = await supabase.rpc("reset_owner_diagnostic_space", {
        p_owner_user_id: params.ownerUserId,
        p_current_public_code: params.publicCode,
        p_new_public_code: newPublicCode,
        p_results_token_hash: resultsToken.hash,
        p_results_token_encrypted: resultsToken.encrypted,
      });
    const rows = data as Array<{ public_code: string }> | null;

    if (!error && rows?.[0]) {
      return {
        publicCode: rows[0].public_code,
        publicUrl: `${params.appUrl}/q/${rows[0].public_code}`,
        ownerResultsUrl: buildOwnerResultsUrl(params.appUrl, rows[0].public_code),
        sharedResultsUrl: buildSharedResultsUrl(
          params.appUrl,
          rows[0].public_code,
          resultsToken.token,
        ),
        totalSubmissions: 0,
      };
    }

    if (error?.code !== "23505") {
      throw new Error("Could not reset diagnostic space");
    }
  }

  throw new Error("Could not generate a unique public code");
}
