"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { getOnboardingPath } from "@/lib/onboarding-routes";

const SPLASH_MS = 2000;

export default function SplashPage() {
  const router = useRouter();
  const { profile, user, isLoading: authLoading } = useAuth();
  const { step, isLoading: onboardingLoading, isPaired } = useOnboarding();
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

    if (step === "complete" && isPaired && profile?.coupleSpaceId) {
      router.replace("/");
      return;
    }

    router.replace(getOnboardingPath(step));
  }, [
    splashDone,
    authLoading,
    onboardingLoading,
    profile,
    user,
    step,
    isPaired,
    router,
  ]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.8 }}
          className="mx-auto mb-6"
        >
          <Image
            src="/icons/icon-192.png"
            alt="Cruell Financial"
            width={96}
            height={96}
            className="mx-auto rounded-3xl border border-[#E5E5EA] shadow-sm"
            priority
            unoptimized
          />
        </motion.div>
        <motion.h1
          className="text-[34px] font-semibold tracking-tight text-[#1C1C1E]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9 }}
        >
          Cruell Financial
        </motion.h1>
      </motion.div>
    </div>
  );
}
