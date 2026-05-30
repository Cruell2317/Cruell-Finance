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
  try {
    const supabase = createClient();
    await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email,
        display_name:
          (user.user_metadata?.full_name as string) ??
          user.email?.split("@")[0] ??
          "User",
        avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
  } catch {
    /* RLS/network — fallback profile tetap dipakai */
  }
}

async function loadProfileFromDb(userId: string): Promise<Profile | null> {
  try {
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
  } catch {
    return null;
  }
}

function applyUser(authUser: User) {
  return { user: authUser, profile: fallbackProfile(authUser) };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const configReady = publicEnvOk();

  const syncDbProfile = useCallback(async (authUser: User) => {
    await ensureUserRow(authUser);
    const dbProfile = await loadProfileFromDb(authUser.id);
    if (dbProfile) setProfile(dbProfile);
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
    const next = applyUser(authUser);
    setUser(next.user);
    setProfile(next.profile);
    await syncDbProfile(authUser);
  }, [syncDbProfile]);

  useEffect(() => {
    if (!configReady) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    let done = false;

    const finish = () => {
      if (!done) {
        done = true;
        setIsLoading(false);
      }
    };

    const timeout = window.setTimeout(finish, 2500);

    const applySession = (authUser: User) => {
      const next = applyUser(authUser);
      setUser(next.user);
      setProfile(next.profile);
      finish();
      void syncDbProfile(authUser);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        applySession(session.user);
        return;
      }
      supabase.auth.getUser().then(({ data: { user: authUser } }) => {
        if (authUser) applySession(authUser);
        else finish();
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const next = applyUser(session.user);
        setUser(next.user);
        setProfile(next.profile);
        void syncDbProfile(session.user);
      } else if (_event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [configReady, syncDbProfile]);

  const signInWithGoogle = useCallback(async () => {
    // OAuth harus dimulai di server (/auth/google) agar PKCE verifier ada di cookie
    window.location.assign("/auth/google");
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
