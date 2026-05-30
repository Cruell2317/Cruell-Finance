"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getOnboardingPath } from "@/lib/onboarding-routes";
import { useOnboarding } from "@/context/OnboardingContext";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, signInWithGoogle, isLoading } = useAuth();
  const { step, isLoading: onboardingLoading } = useOnboarding();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const authError = searchParams.get("error");
    const detail = searchParams.get("error_detail");
    if (authError === "auth_callback") {
      setError(
        detail
          ? `Login gagal: ${detail}`
          : "Login gagal. Coba lagi atau buka di Chrome/Safari (bukan in-app browser)."
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && !onboardingLoading && profile) {
      router.replace(getOnboardingPath(step));
    }
  }, [profile, step, isLoading, onboardingLoading, router]);

  const handleGoogle = async () => {
    setSigningIn(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login gagal");
      setSigningIn(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-6">
      <div className="flex flex-1 flex-col justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[28px] font-bold text-[#1C1C1E]">Cruell Finance</h1>
          <p className="mt-2 text-[17px] text-[#8E8E93]">
            Masuk dengan Google untuk memulai tabungan bersama.
          </p>
          <Button
            type="button"
            fullWidth
            variant="dark"
            className="mt-10 gap-3"
            onClick={handleGoogle}
            disabled={signingIn}
          >
            {signingIn ? "Mengalihkan ke Google..." : "Sign in with Google"}
          </Button>
          {error && (
            <p className="mt-4 rounded-xl bg-[#FF3B30]/10 px-4 py-3 text-center text-[14px] text-[#FF3B30]">
              {error}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#8E8E93]">Memuat...</div>}>
      <LoginContent />
    </Suspense>
  );
}
