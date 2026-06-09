import "server-only";

import { createSupabaseAdminClient } from "@/lib/database/server";
import {
  buildOwnerResultsUrl,
  buildSharedResultsUrl,
  decryptStoredResultsToken,
  generateResultsToken,
} from "@/lib/results/results-token";

type OwnerSpaceRow = {
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
};

function mapOwnerSpace(
  row: OwnerSpaceRow,
  appUrl: string,
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
  };
}

export async function listOwnerSpaces(
  ownerUserId: string,
  appUrl: string,
): Promise<OwnerDiagnosticSpace[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("diagnostic_spaces")
    .select(
      "public_code, is_active, created_at, results_token_enabled, results_token_encrypted",
    )
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false })
    .returns<OwnerSpaceRow[]>();

  if (error || !data) {
    throw new Error("Could not load owner spaces");
  }

  return data.map((space) => mapOwnerSpace(space, appUrl));
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
      "public_code, is_active, created_at, results_token_enabled, results_token_encrypted",
    )
    .eq("owner_user_id", ownerUserId)
    .eq("public_code", publicCode)
    .maybeSingle<OwnerSpaceRow>();

  if (error) {
    throw new Error("Could not load owner space");
  }

  return data ? mapOwnerSpace(data, appUrl) : null;
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
