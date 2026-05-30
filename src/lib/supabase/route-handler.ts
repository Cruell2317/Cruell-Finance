import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

/**
 * Supabase client untuk Route Handlers — PKCE verifier disimpan di cookie.
 */
export function createRouteHandlerClient(request: NextRequest) {
  const pendingCookies: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }> = [];

  let cookieResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options });
            request.cookies.set(name, value);
          });
          cookieResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  function applyCookiesTo(target: NextResponse) {
    pendingCookies.forEach(({ name, value, options }) =>
      target.cookies.set(name, value, options)
    );
    return target;
  }

  return { supabase, applyCookiesTo };
}
