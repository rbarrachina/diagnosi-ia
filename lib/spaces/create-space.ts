import "server-only";

import { generatePublicCode } from "@/lib/crypto/public-code";
import { createSupabaseAdminClient } from "@/lib/database/server";
import {
  buildOwnerResultsUrl,
  buildSharedResultsUrl,
  generateResultsToken,
} from "@/lib/results/results-token";

const MAX_PUBLIC_CODE_ATTEMPTS = 8;

export class OwnerSpaceAlreadyExistsError extends Error {
  constructor() {
    super("Owner already has a diagnostic space");
    this.name = "OwnerSpaceAlreadyExistsError";
  }
}

export type CreatedDiagnosticSpace = {
  publicCode: string;
  sharedResultsUrl: string;
  ownerResultsUrl: string;
  publicUrl: string;
  totalSubmissions: number;
};

export async function createDiagnosticSpace(
  appUrl: string,
  ownerUserId: string,
): Promise<CreatedDiagnosticSpace> {
  const supabase = createSupabaseAdminClient();

  const { data: existingSpace, error: existingSpaceError } = await supabase
    .from("diagnostic_spaces")
    .select("public_code")
    .eq("owner_user_id", ownerUserId)
    .maybeSingle<{ public_code: string }>();

  if (existingSpaceError) {
    throw new Error("Could not check existing diagnostic space");
  }

  if (existingSpace) {
    throw new OwnerSpaceAlreadyExistsError();
  }

  const { data: questionnaire, error: questionnaireError } = await supabase
    .from("questionnaires")
    .select("id")
    .eq("is_active", true)
    .single<{ id: string }>();

  if (questionnaireError || !questionnaire) {
    throw new Error("Active questionnaire version not found");
  }

  const resultsToken = generateResultsToken();

  for (let attempt = 0; attempt < MAX_PUBLIC_CODE_ATTEMPTS; attempt += 1) {
    const publicCode = generatePublicCode();
    const { error } = await supabase.from("diagnostic_spaces").insert({
      public_code: publicCode,
      private_token_hmac: resultsToken.hash,
      results_token_hash: resultsToken.hash,
      results_token_encrypted: resultsToken.encrypted,
      results_token_created_at: new Date().toISOString(),
      owner_user_id: ownerUserId,
      questionnaire_id: questionnaire.id,
    });

    if (!error) {
      return {
        publicCode,
        publicUrl: `${appUrl}/q/${publicCode}`,
        sharedResultsUrl: buildSharedResultsUrl(appUrl, publicCode, resultsToken.token),
        ownerResultsUrl: buildOwnerResultsUrl(appUrl, publicCode),
        totalSubmissions: 0,
      };
    }

    if (error.code !== "23505") {
      throw new Error("Could not create diagnostic space");
    }
  }

  throw new Error("Could not generate a unique public code");
}
