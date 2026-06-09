import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/database/auth-server";
import { resolveAppUrl } from "@/lib/http/app-url";
import { safeRelativePath } from "@/lib/http/redirect";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = safeRelativePath(requestUrl.searchParams.get("next"), "/espais");
  const appUrl = resolveAppUrl(request.url, process.env.NEXT_PUBLIC_APP_URL);
  let supabase;

  try {
    supabase = await createSupabaseAuthServerClient();
  } catch {
    redirect("/auth/error");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect("/auth/error");
  }

  redirect(data.url);
}
