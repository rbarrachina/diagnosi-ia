import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/database/auth-server";
import { safeRelativePath } from "@/lib/http/redirect";
import { isXtecUser } from "@/lib/auth/xtec";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeRelativePath(requestUrl.searchParams.get("next"), "/espais");
  const supabase = await createSupabaseAuthServerClient();

  if (!code) {
    redirect("/auth/error");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect("/auth/error");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isXtecUser(user)) {
    await supabase.auth.signOut();
    redirect("/auth/error?reason=xtec");
  }

  redirect(next);
}
