"use client";

import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { getOnboardingPath } from "@/lib/onboarding-routes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const MAIN_APP_PATHS = ["/", "/tagihan", "/profil", "/target", "/settings", "/checkout"];

function isMainAppPath(pathname: string) {
  return MAIN_APP_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`))
  );
}

function LoadingScreen({ message = "Memuat..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5E5EA] border-t-[#1C1C1E]" />
      <p className="text-[14px] text-[#8E8E93]">{message}</p>
    </div>
  );
}

/** Guard ringan untuk halaman onboarding — jangan sign-out agresif. */
function OnboardingRouteGuard({ children }: { children: ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const isAuthed = Boolean(user || profile);

  if (!ready && isLoading) {
    return <LoadingScreen message="Menyelesaikan login..." />;
  }

  if (!isAuthed && ready) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <p className="text-[15px] text-[#8E8E93]">Sesi belum aktif. Coba login ulang.</p>
        <a
          href="/login"
          className="rounded-2xl bg-[#1C1C1E] px-6 py-3 text-[15px] font-semibold text-white"
        >
          Ke halaman login
        </a>
      </div>
    );
  }

  return <>{children}</>;
}

/** Guard untuk app utama — arahkan ke onboarding jika belum selesai. */
function MainAppGuard({ children }: { children: ReactNode }) {
  const { profile, user, isLoading: authLoading } = useAuth();
  const { step } = useOnboarding();
  const router = useRouter();
  const pathname = usePathname();
  const [bootDone, setBootDone] = useState(false);

  const isAuthed = Boolean(user || profile);

  useEffect(() => {
    const t = window.setTimeout(() => setBootDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!bootDone || authLoading) return;
    if (!isAuthed) {
      router.replace("/login");
      return;
    }
    if (step !== "complete") {
      router.replace(getOnboardingPath(step));
    }
  }, [bootDone, authLoading, isAuthed, step, router]);

  if ((!bootDone || authLoading) && !isAuthed) {
    return <LoadingScreen />;
  }

  if (!isAuthed) return null;

  if (step !== "complete" && isMainAppPath(pathname)) {
    return <LoadingScreen message="Menyiapkan akun..." />;
  }

  return <>{children}</>;
}

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/onboarding")) {
    return <OnboardingRouteGuard>{children}</OnboardingRouteGuard>;
  }

  return <MainAppGuard>{children}</MainAppGuard>;
}
