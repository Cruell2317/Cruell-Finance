"use client";

import { useEffect } from "react";

/**
 * Supabase kadang mengembalikan ?code= ke Site URL (/) bukan /auth/callback.
 * Alihkan ke halaman callback agar PKCE exchange jalan.
 */
export function AuthCodeRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const { pathname, search, hash } = window.location;
    if (pathname === "/auth/callback") return;

    const params = new URLSearchParams(search);
    const hasCode = params.has("code");
    const hasToken = params.has("access_token") || hash.includes("access_token");

    if (!hasCode && !hasToken) return;

    const target = `/auth/callback${search}${hash}`;
    window.location.replace(target);
  }, []);

  return null;
}
