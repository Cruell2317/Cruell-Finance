"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { fetchCoupleSpaceData } from "@/lib/db/fetch-space-data";
import { isValidPairingCode, normalizePairingCode } from "@/lib/pairing";
import { broadcastCoupleEvent } from "@/lib/realtime/couple-channels";
import type { CoupleMember, CoupleSpace, OnboardingStep } from "@/types";

interface OnboardingContextValue {
  step: OnboardingStep;
  coupleSpace: CoupleSpace | null;
  members: CoupleMember[];
  isPaired: boolean;
  isLoading: boolean;
  createCoupleSpace: () => Promise<{ code: string }>;
  joinCoupleSpace: (code: string) => Promise<void>;
  completeProfileSetup: (displayName: string, avatarUrl: string | null) => Promise<void>;
  setStartDate: (month: number, year: number) => Promise<void>;
  completeTargetStep: (input?: {
    name: string;
    imageUrl: string;
    targetAmount: number;
  }) => Promise<void>;
  skipTargetStep: () => Promise<void>;
  refresh: () => Promise<void>;
  disconnectCoupleSpace: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { profile, user, refreshProfile } = useAuth();
  const [coupleSpace, setCoupleSpace] = useState<CoupleSpace | null>(null);
  const [members, setMembers] = useState<CoupleMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadState = useCallback(async () => {
    if (!profile) {
      setCoupleSpace(null);
      setMembers([]);
      setIsLoading(false);
      return;
    }

    if (!profile.coupleSpaceId) {
      setCoupleSpace(null);
      setMembers([]);
      setIsLoading(false);
      return;
    }

    const data = await fetchCoupleSpaceData(profile.coupleSpaceId);
    setCoupleSpace(data.coupleSpace);
    setMembers(data.members);
    setIsLoading(false);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    loadState().finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    const timeout = window.setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [loadState]);

  const isPaired = members.length >= 2;

  const step: OnboardingStep = useMemo(() => {
    if (!profile) {
      return user ? "pairing" : "login";
    }
    if (!profile.coupleSpaceId || !isPaired) return "pairing";
    if (!profile.profileSetupDone) return "profile";
    if (
      !coupleSpace?.startMonth ||
      !coupleSpace?.startYear ||
      coupleSpace.startMonth === null
    )
      return "start-date";
    if (!coupleSpace.onboardingComplete) return "target";
    return "complete";
  }, [profile, user, isPaired, coupleSpace]);

  const createCoupleSpace = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_couple_space");
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    await refreshProfile();
    await loadState();
    return { code: row.pairing_code as string };
  }, [refreshProfile, loadState]);

  const joinCoupleSpace = useCallback(
    async (rawCode: string) => {
      const code = normalizePairingCode(rawCode);
      if (!isValidPairingCode(code)) throw new Error("Kode harus 6 karakter");
      const supabase = createClient();
      const { data: spaceId, error } = await supabase.rpc("join_couple_space", {
        p_code: code,
      });
      if (error) throw error;
      await refreshProfile();
      await loadState();
      const sid = spaceId as string;
      if (sid) {
        await broadcastCoupleEvent(sid, { type: "paired", spaceId: sid });
      }
    },
    [refreshProfile, loadState]
  );

  const disconnectCoupleSpace = useCallback(async () => {
    const spaceId = profile?.coupleSpaceId;
    const supabase = createClient();
    const { error } = await supabase.rpc("disconnect_couple_space");
    if (error) throw error;
    if (spaceId) {
      await broadcastCoupleEvent(spaceId, { type: "disconnected", spaceId });
    }
    await refreshProfile();
    await loadState();
  }, [profile?.coupleSpaceId, refreshProfile, loadState]);

  const completeProfileSetup = useCallback(
    async (displayName: string, avatarUrl: string | null) => {
      if (!profile) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
          profile_setup_done: true,
        })
        .eq("id", profile.id);
      if (error) throw error;
      await refreshProfile();
      await loadState();
    },
    [profile, refreshProfile, loadState]
  );

  const setStartDate = useCallback(
    async (month: number, year: number) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("activate_time_machine", {
        p_start_month: month,
        p_start_year: year,
      });
      if (error) throw error;
      await loadState();
    },
    [loadState]
  );

  const finishOnboarding = useCallback(
    async (target?: { name: string; imageUrl: string; targetAmount: number }) => {
      if (!profile?.coupleSpaceId) return;
      const supabase = createClient();

      if (target) {
        const { error: tErr } = await supabase.from("targets").insert({
          couple_space_id: profile.coupleSpaceId,
          created_by: profile.id,
          target_name: target.name,
          target_amount: target.targetAmount,
          image_url: target.imageUrl,
        });
        if (tErr) throw tErr;
      }

      const { error } = await supabase
        .from("couple_spaces")
        .update({ onboarding_complete: true })
        .eq("id", profile.coupleSpaceId);
      if (error) throw error;
      await loadState();
    },
    [profile, loadState]
  );

  return (
    <OnboardingContext.Provider
      value={{
        step,
        coupleSpace,
        members,
        isPaired,
        isLoading,
        createCoupleSpace,
        joinCoupleSpace,
        completeProfileSetup,
        setStartDate,
        completeTargetStep: finishOnboarding,
        skipTargetStep: () => finishOnboarding(),
        refresh: loadState,
        disconnectCoupleSpace,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
