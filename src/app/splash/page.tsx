"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { getOnboardingPath } from "@/lib/onboarding-routes";

const SPLASH_MS = 1500;

export default function SplashPage() {
  const router = useRouter();
  const { profile, user, isLoading: authLoading } = useAuth();
  const { step, isLoading: onboardingLoading } = useOnboarding();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!splashDone) return;
    if (authLoading || onboardingLoading) return;

    if (!user && !profile) {
      router.replace("/login");
      return;
    }

    router.replace(getOnboardingPath(step));
  }, [splashDone, authLoading, onboardingLoading, profile, user, step, router]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-white">
      <motion.h1
        className="text-center text-[34px] font-semibold tracking-tight text-[#1C1C1E]"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        Cruell Financial
      </motion.h1>
    </div>
  );
}
