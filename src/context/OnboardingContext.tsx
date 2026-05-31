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
  joinCoupleSpaceInstant: (code: string) => Promise<boolean>;
  cancelCoupleSpace: () => Promise<void>;
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
    if (!profile) return user ? "pairing" : "login";
    if (!profile.coupleSpaceId || !isPaired) return "pairing";
    if (!coupleSpace?.onboardingComplete) return "pairing";
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

  const joinCoupleSpaceInstant = useCallback(
    async (rawCode: string): Promise<boolean> => {
      const code = normalizePairingCode(rawCode);
      if (!isValidPairingCode(code)) {
        throw new Error("Kode harus 6 karakter");
      }

      const supabase = createClient();
      const { data, error } = await supabase.rpc("join_couple_space_instant", {
        p_code: code,
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string } | null;
      if (!result?.success) {
        throw new Error(result?.error ?? "Kode pairing tidak valid");
      }

      await refreshProfile();
      await loadState();
      return true;
    },
    [refreshProfile, loadState]
  );

  const cancelCoupleSpace = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.rpc("cancel_couple_space");
    if (error) throw error;
    await refreshProfile();
    await loadState();
  }, [refreshProfile, loadState]);

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

  return (
    <OnboardingContext.Provider
      value={{
        step,
        coupleSpace,
        members,
        isPaired,
        isLoading,
        createCoupleSpace,
        joinCoupleSpaceInstant,
        cancelCoupleSpace,
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
