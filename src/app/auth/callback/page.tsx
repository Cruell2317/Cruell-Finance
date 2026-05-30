"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Menyelesaikan login...");

  useEffect(() => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const oauthError = params.get("error_description") ?? params.get("error");

    if (oauthError) {
      setMessage("Login dibatalkan.");
      router.replace("/login?error=auth_callback");
      return;
    }

    (async () => {
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) throw new Error("No session");
        }

        // Ensure public.users row exists (trigger may have missed older accounts)
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("users").upsert(
            {
              id: user.id,
              email: user.email,
              display_name:
                user.user_metadata?.full_name ??
                user.user_metadata?.name ??
                user.email?.split("@")[0] ??
                "User",
              avatar_url: user.user_metadata?.avatar_url ?? null,
            },
            { onConflict: "id", ignoreDuplicates: true }
          );
        }

        router.replace("/onboarding/pairing");
        router.refresh();
      } catch {
        router.replace("/login?error=auth_callback");
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <p className="text-center text-[15px] text-[#8E8E93]">{message}</p>
    </div>
  );
}
