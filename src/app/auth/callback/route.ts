import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthDetail = searchParams.get("error_description");

  if (oauthError) {
    const detail = oauthDetail ?? oauthError;
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback&error_detail=${encodeURIComponent(detail)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback&error_detail=${encodeURIComponent("Kode login tidak ditemukan")}`
    );
  }

  let response = NextResponse.redirect(`${origin}/onboarding/pairing`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback&error_detail=${encodeURIComponent(error.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email,
        display_name:
          (user.user_metadata?.full_name as string) ??
          user.email?.split("@")[0] ??
          "User",
        avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
  }

  return response;
}
