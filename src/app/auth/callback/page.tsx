"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Menyelesaikan login...");

  useEffect(() => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    (async () => {
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("Sesi tidak tersimpan");

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          void supabase.from("users").upsert(
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

        window.location.replace("/onboarding/pairing");
      } catch (e) {
        const detail = e instanceof Error ? e.message : "Login gagal";
        window.location.replace(
          `/login?error=auth_callback&error_detail=${encodeURIComponent(detail)}`
        );
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E5E5EA] border-t-[#1C1C1E]" />
      <p className="text-center text-[15px] text-[#8E8E93]">{message}</p>
    </div>
  );
}
