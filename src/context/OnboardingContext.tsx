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
  joinCoupleSpace: (
    code: string,
    opts?: { isAborted?: () => boolean }
  ) => Promise<void>;
  cancelCoupleSpace: () => Promise<void>;
  refresh: () => Promise<void>;
  disconnectCoupleSpace: () => Promise<void>;
  finalizePairing: () => Promise<void>;
}

function throwIfAborted(isAborted?: () => boolean) {
  if (isAborted?.()) throw new Error("ABORTED");
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

  const finalizePairing = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.rpc("finalize_couple_pairing");
    if (error) throw error;
    await refreshProfile();
    await loadState();
  }, [refreshProfile, loadState]);

  useEffect(() => {
    if (!isPaired || !profile?.coupleSpaceId) return;
    if (coupleSpace?.onboardingComplete) return;
    void finalizePairing().catch(() => {});
  }, [isPaired, profile?.coupleSpaceId, coupleSpace?.onboardingComplete, finalizePairing]);

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
    async (rawCode: string, opts?: { isAborted?: () => boolean }) => {
      const code = normalizePairingCode(rawCode);
      if (!isValidPairingCode(code)) throw new Error("Kode harus 6 karakter");
      throwIfAborted(opts?.isAborted);

      const supabase = createClient();
      const { data: spaceId, error } = await supabase.rpc("join_couple_space", {
        p_code: code,
      });
      if (error) throw error;
      throwIfAborted(opts?.isAborted);

      await refreshProfile();
      throwIfAborted(opts?.isAborted);
      await loadState();
      throwIfAborted(opts?.isAborted);
      await finalizePairing();
      throwIfAborted(opts?.isAborted);

      const sid = spaceId as string;
      if (sid) {
        await broadcastCoupleEvent(sid, { type: "paired", spaceId: sid });
      }
    },
    [refreshProfile, loadState, finalizePairing]
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
        joinCoupleSpace,
        cancelCoupleSpace,
        refresh: loadState,
        disconnectCoupleSpace,
        finalizePairing,
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
