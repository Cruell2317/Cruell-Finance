"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { getOnboardingPath } from "@/lib/onboarding-routes";
import { useOnboarding } from "@/context/OnboardingContext";
import { uploadAvatar } from "@/lib/storage";

type AuthMode = "login" | "register";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, signInWithEmail, signUpWithEmail, updateProfile, isLoading } =
    useAuth();
  const { step, isLoading: onboardingLoading } = useOnboarding();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarLabel, setAvatarLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const detail = searchParams.get("error_detail");
    if (searchParams.get("error")) {
      setError(detail ? `Login gagal: ${detail}` : "Login gagal");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && !onboardingLoading && profile) {
      router.replace(getOnboardingPath(step));
    }
  }, [profile, step, isLoading, onboardingLoading, router]);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarLabel(file.name);
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        if (!displayName.trim()) throw new Error("Nama wajib diisi");
        await signUpWithEmail(email, password, displayName, null);
        if (avatarFile) {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const url = await uploadAvatar(user.id, avatarFile);
            await updateProfile(displayName.trim(), url);
          }
        }
      } else {
        await signInWithEmail(email, password);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Autentikasi gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-6">
      <div className="flex flex-1 flex-col justify-center pb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[28px] font-bold text-[#1C1C1E]">Cruell Financial</h1>
          <p className="mt-2 text-[17px] text-[#8E8E93]">
            Daftar atau masuk dengan akun Google (email) & password.
          </p>

          <div className="mt-8 flex rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-xl py-2.5 text-[15px] font-semibold ${
                mode === "login" ? "bg-white text-[#1C1C1E] shadow-sm" : "text-[#8E8E93]"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-xl py-2.5 text-[15px] font-semibold ${
                mode === "register" ? "bg-white text-[#1C1C1E] shadow-sm" : "text-[#8E8E93]"
              }`}
            >
              Daftar
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {mode === "register" && (
              <>
                <input
                  type="text"
                  placeholder="Nama (ditampilkan di app)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 text-[16px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-2xl border border-dashed border-[#E5E5EA] py-3 text-[14px] text-[#8E8E93]"
                >
                  {avatarLabel ? "Foto profil terpilih ✓" : "Foto profil (galeri HP, opsional)"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleAvatar(e)}
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email akun Google"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 text-[16px] outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 text-[16px] outline-none"
            />
          </div>

          <Button
            type="button"
            fullWidth
            variant="dark"
            className="mt-4"
            onClick={() => void handleSubmit()}
            disabled={busy || !email || !password}
          >
            {busy ? "Memproses..." : mode === "register" ? "Daftar" : "Login"}
          </Button>

          {error && (
            <p className="mt-4 rounded-xl bg-[#FF3B30]/10 px-4 py-3 text-center text-[14px] text-[#FF3B30]">
              {error}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#8E8E93]">Memuat...</div>}>
      <LoginContent />
    </Suspense>
  );
}
