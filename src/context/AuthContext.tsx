"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { publicEnvOk } from "@/lib/env";
import type { Profile } from "@/types";

interface AuthContextValue {
  profile: Profile | null;
  isLoading: boolean;
  configReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfileFromDb(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, display_name, avatar_url, couple_space_id, profile_setup_done, is_space_creator, saving_streak"
    )
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email ?? "",
    displayName: data.display_name ?? "",
    avatarUrl: data.avatar_url,
    fullName: data.display_name,
    coupleSpaceId: data.couple_space_id,
    profileSetupDone: data.profile_setup_done,
    isSpaceCreator: data.is_space_creator,
    savingStreak: data.saving_streak ?? 0,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const configReady = publicEnvOk();

  const refreshProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      return;
    }
    const p = await loadProfileFromDb(user.id);
    setProfile(p);
  }, []);

  useEffect(() => {
    if (!configReady) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfileFromDb(session.user.id).then(setProfile);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setProfile(await loadProfileFromDb(session.user.id));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [configReady]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
    if (data?.url) {
      window.location.assign(data.url);
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        configReady,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
