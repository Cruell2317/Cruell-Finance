"use client";

import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { getOnboardingPath } from "@/lib/onboarding-routes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const { profile, user, isLoading: authLoading } = useAuth();
  const { step, isLoading: onboardingLoading } = useOnboarding();
  const router = useRouter();
  const pathname = usePathname();

  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isAuthed = Boolean(user || profile);

  useEffect(() => {
    if (authLoading || onboardingLoading) return;
    if (!isAuthed) {
      router.replace("/login");
      return;
    }

    const targetPath = getOnboardingPath(step);

    if (step !== "complete") {
      if (pathname !== targetPath) {
        router.replace(targetPath);
      }
      return;
    }

    if (isOnboardingRoute) {
      router.replace("/");
    }
  }, [
    profile,
    user,
    step,
    authLoading,
    onboardingLoading,
    isAuthed,
    isOnboardingRoute,
    router,
    pathname,
  ]);

  if (authLoading || onboardingLoading || (isAuthed && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5E5EA] border-t-[#1C1C1E]" />
      </div>
    );
  }

  if (!isAuthed) {
    return null;
  }

  if (step !== "complete" && pathname !== getOnboardingPath(step)) {
    return null;
  }

  return <>{children}</>;
}
