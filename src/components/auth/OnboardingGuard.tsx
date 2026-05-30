"use client";

import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { getOnboardingPath } from "@/lib/onboarding-routes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const { profile, isLoading: authLoading } = useAuth();
  const { step, isLoading: onboardingLoading } = useOnboarding();
  const router = useRouter();
  const pathname = usePathname();

  const isOnboardingRoute = pathname.startsWith("/onboarding");

  useEffect(() => {
    if (authLoading || onboardingLoading) return;
    if (!profile) {
      router.replace("/login");
      return;
    }

    const targetPath = getOnboardingPath(step);

    if (step !== "complete") {
      if (!isOnboardingRoute || pathname !== targetPath) {
        router.replace(targetPath);
      }
      return;
    }

    if (isOnboardingRoute) {
      router.replace("/");
    }
  }, [
    profile,
    step,
    authLoading,
    onboardingLoading,
    isOnboardingRoute,
    router,
    pathname,
  ]);

  if (authLoading || onboardingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5E5EA] border-t-[#1C1C1E]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5E5EA] border-t-[#1C1C1E]" />
      </div>
    );
  }

  if (step !== "complete" && !isOnboardingRoute) return null;

  return <>{children}</>;
}
