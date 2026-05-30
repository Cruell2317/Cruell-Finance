"use client";

import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import {
  subscribeCoupleChannel,
  type CoupleBroadcastEvent,
} from "@/lib/realtime/couple-channels";
import { getOnboardingPath } from "@/lib/onboarding-routes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Mendengarkan broadcast pairing / unpair di seluruh app. */
export function CoupleRealtimeListener() {
  const { profile, refreshProfile } = useAuth();
  const { refresh, step } = useOnboarding();
  const router = useRouter();
  const spaceId = profile?.coupleSpaceId;

  useEffect(() => {
    if (!spaceId) return;

    const handle = async (event: CoupleBroadcastEvent) => {
      if (event.type === "paired") {
        await refreshProfile();
        await refresh();
        if (step === "pairing") {
          router.replace(getOnboardingPath("profile"));
        }
        return;
      }

      if (event.type === "disconnected") {
        await refreshProfile();
        await refresh();
        router.replace("/onboarding/pairing");
      }
    };

    return subscribeCoupleChannel(spaceId, (e) => {
      void handle(e);
    });
  }, [spaceId, refresh, refreshProfile, router, step]);

  return null;
}
