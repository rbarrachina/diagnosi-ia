import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/database/auth-server";
import { safeRelativePath } from "@/lib/http/redirect";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const next = safeRelativePath(requestUrl.searchParams.get("next"), "/");
  const supabase = await createSupabaseAuthServerClient();

  await supabase.auth.signOut();

  redirect(next);
}
