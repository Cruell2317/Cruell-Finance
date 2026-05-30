"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

async function waitForSession(
  supabase: ReturnType<typeof createClient>,
  maxMs = 12000
) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return session;
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Menyelesaikan login...");

  useEffect(() => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    (async () => {
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            const retrySession = await waitForSession(supabase, 3000);
            if (!retrySession) throw error;
          }
        }

        let session = await waitForSession(supabase);
        if (!session) throw new Error("Sesi tidak tersimpan. Coba login lagi.");

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
                (user.user_metadata?.name as string) ??
                user.email?.split("@")[0] ??
                "User",
              avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
            },
            { onConflict: "id", ignoreDuplicates: true }
          );
        }

        setMessage("Berhasil! Mengalihkan...");
        window.location.href = "/onboarding/pairing";
      } catch (e) {
        const detail = e instanceof Error ? e.message : "Login gagal";
        window.location.href = `/login?error=auth_callback&error_detail=${encodeURIComponent(detail)}`;
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#E5E5EA] border-t-[#1C1C1E]" />
      <p className="text-center text-[15px] text-[#8E8E93]">{message}</p>
    </div>
  );
}
