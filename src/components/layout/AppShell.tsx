"use client";

import { BottomNav } from "./BottomNav";
import { OverdueBanner } from "./OverdueBanner";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { useApp } from "@/context/AppContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { overdueCount, isBannerDismissed } = useApp();
  const hasBanner = overdueCount > 0 && !isBannerDismissed;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <OverdueBanner />
      <main
        className={`px-4 pb-28 ${
          hasBanner
            ? "pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))]"
            : "pt-[max(1rem,env(safe-area-inset-top))]"
        }`}
      >
        {children}
      </main>
      <BottomNav />
      <PWAInstallPrompt />
    </div>
  );
}
