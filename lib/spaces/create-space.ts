import "server-only";

import { generatePrivateToken, hashPrivateToken } from "@/lib/crypto/private-token";
import { generatePublicCode } from "@/lib/crypto/public-code";
import { createSupabaseAdminClient } from "@/lib/database/server";
import { QUESTIONNAIRE_VERSION } from "@/lib/validation/schemas";

const MAX_PUBLIC_CODE_ATTEMPTS = 8;

export type CreatedDiagnosticSpace = {
  publicCode: string;
  privateToken: string;
  publicUrl: string;
  privateResultsUrl: string;
};

export async function createDiagnosticSpace(
  appUrl: string,
): Promise<CreatedDiagnosticSpace> {
  const supabase = createSupabaseAdminClient();
  const tokenSecret = process.env.PRIVATE_TOKEN_HMAC_SECRET;

  if (!tokenSecret) {
    throw new Error("PRIVATE_TOKEN_HMAC_SECRET is required");
  }

  const { data: questionnaire, error: questionnaireError } = await supabase
    .from("questionnaires")
    .select("id")
    .eq("version", QUESTIONNAIRE_VERSION)
    .eq("is_active", true)
    .single<{ id: string }>();

  if (questionnaireError || !questionnaire) {
    throw new Error("Active questionnaire version not found");
  }

  const privateToken = generatePrivateToken();
  const privateTokenHmac = hashPrivateToken(privateToken, tokenSecret);

  for (let attempt = 0; attempt < MAX_PUBLIC_CODE_ATTEMPTS; attempt += 1) {
    const publicCode = generatePublicCode();
    const { error } = await supabase.from("diagnostic_spaces").insert({
      public_code: publicCode,
      private_token_hmac: privateTokenHmac,
      questionnaire_id: questionnaire.id,
    });

    if (!error) {
      return {
        publicCode,
        privateToken,
        publicUrl: `${appUrl}/q/${publicCode}`,
        privateResultsUrl: `${appUrl}/resultats/${publicCode}#token=${privateToken}`,
      };
    }

    if (error.code !== "23505") {
      throw new Error("Could not create diagnostic space");
    }
  }

  throw new Error("Could not generate a unique public code");
}
