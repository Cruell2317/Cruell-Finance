"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { getOnboardingPath } from "@/lib/onboarding-routes";

export default function SplashPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuth();
  const { step, isLoading: onboardingLoading } = useOnboarding();

  useEffect(() => {
    if (authLoading || onboardingLoading) return;

    if (profile) {
      router.replace(getOnboardingPath(step));
      return;
    }

    const timer = setTimeout(() => {
      router.replace("/login");
    }, 1500);

    return () => clearTimeout(timer);
  }, [profile, step, authLoading, onboardingLoading, router]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-gradient-to-b from-white to-[#F7F7F9]">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <motion.h1
          className="text-[32px] font-semibold tracking-tight text-[#1C1C1E]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Cruell Finance
        </motion.h1>
        <motion.p
          className="mt-2 text-[15px] text-[#8E8E93]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          Tabungan bersama
        </motion.p>
      </motion.div>
    </div>
  );
}
