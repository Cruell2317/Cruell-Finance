"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { getOnboardingPath } from "@/lib/onboarding-routes";

const INTRO_DURATION = 0.8;
const HOLD_MS = 700;
const OUTRO_DURATION = 0.55;

export default function SplashPage() {
  const router = useRouter();
  const { profile, user, isLoading: authLoading } = useAuth();
  const { step, isLoading: onboardingLoading } = useOnboarding();
  const [showSplash, setShowSplash] = useState(true);
  const [holdComplete, setHoldComplete] = useState(false);
  const routedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setHoldComplete(true), INTRO_DURATION * 1000 + HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  const navigateNext = useCallback(() => {
    if (routedRef.current) return;
    routedRef.current = true;
    if (!user && !profile) {
      router.replace("/login");
      return;
    }
    router.replace(getOnboardingPath(step));
  }, [profile, user, step, router]);

  useEffect(() => {
    if (!holdComplete || authLoading || onboardingLoading) return;
    if (!showSplash) return;
    setShowSplash(false);
  }, [holdComplete, authLoading, onboardingLoading, showSplash]);

  const handleExitComplete = () => {
    if (!showSplash) navigateNext();
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
        {showSplash && (
          <motion.div
            key="cruell-splash"
            className="flex min-h-screen items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: INTRO_DURATION, ease: [0.22, 1, 0.36, 1] },
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              transition: { duration: OUTRO_DURATION, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <h1 className="text-center text-[34px] font-semibold tracking-tight text-[#1C1C1E]">
              Cruell Financial
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
