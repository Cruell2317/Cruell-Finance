"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { publicEnvOk } from "@/lib/env";
import type { Profile } from "@/types";

interface AuthContextValue {
  profile: Profile | null;
  user: User | null;
  isLoading: boolean;
  configReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function fallbackProfile(user: User): Profile {
  return {
    id: user.id,
    email: user.email ?? "",
    displayName:
      (user.user_metadata?.full_name as string) ??
      (user.user_metadata?.name as string) ??
      user.email?.split("@")[0] ??
      "User",
    avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
    fullName: (user.user_metadata?.full_name as string) ?? null,
    coupleSpaceId: null,
    profileSetupDone: false,
    isSpaceCreator: false,
    savingStreak: 0,
  };
}

async function ensureUserRow(user: User) {
  const supabase = createClient();
  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      display_name:
        (user.user_metadata?.full_name as string) ??
        (user.user_metadata?.name as string) ??
        user.email?.split("@")[0] ??
        "User",
      avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
}

async function loadProfileFromDb(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, display_name, avatar_url, couple_space_id, profile_setup_done, is_space_creator, saving_streak"
    )
    .eq("id", userId)
    .maybeSingle();

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const configReady = publicEnvOk();

  const hydrateFromUser = useCallback(async (authUser: User) => {
    setUser(authUser);
    await ensureUserRow(authUser);
    const dbProfile = await loadProfileFromDb(authUser.id);
    setProfile(dbProfile ?? fallbackProfile(authUser));
  }, []);

  const refreshProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      setProfile(null);
      return;
    }
    await hydrateFromUser(authUser);
  }, [hydrateFromUser]);

  useEffect(() => {
    if (!configReady) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        hydrateFromUser(authUser).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await hydrateFromUser(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [configReady, hydrateFromUser]);

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
    if (data?.url) window.location.assign(data.url);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        profile,
        user,
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
