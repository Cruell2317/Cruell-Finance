import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { NextResponse, type NextRequest } from "next/server";

/** Mulai OAuth Google di server agar PKCE verifier tersimpan di cookie. */
export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl;
  const { supabase, applyCookiesTo } = createRouteHandlerClient(request);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data?.url) {
    const detail = error?.message ?? "OAuth gagal dimulai";
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback&error_detail=${encodeURIComponent(detail)}`
    );
  }

  return applyCookiesTo(NextResponse.redirect(data.url));
}
