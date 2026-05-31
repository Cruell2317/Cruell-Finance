"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getOnboardingPath } from "@/lib/onboarding-routes";
import { useOnboarding } from "@/context/OnboardingContext";

type AuthMode = "login" | "register";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, signInWithEmail, signUpWithEmail, isLoading } = useAuth();
  const { step, isLoading: onboardingLoading } = useOnboarding();

  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verifyNotice, setVerifyNotice] = useState(false);

  useEffect(() => {
    const detail = searchParams.get("error_detail");
    if (searchParams.get("error")) {
      setError(detail ? `Login gagal: ${detail}` : "Login gagal");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && !onboardingLoading && profile && !verifyNotice) {
      router.replace(getOnboardingPath(step));
    }
  }, [profile, step, isLoading, onboardingLoading, router, verifyNotice]);

  const handleSubmit = async () => {
    setBusy(true);
    setError("");
    setVerifyNotice(false);
    try {
      if (mode === "register") {
        if (!displayName.trim()) throw new Error("Nama wajib diisi");
        const { needsEmailVerification } = await signUpWithEmail(
          email,
          password,
          displayName
        );
        if (needsEmailVerification) {
          setVerifyNotice(true);
          return;
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
            Daftar atau masuk dengan email dan password.
          </p>

          <div className="mt-8 flex rounded-3xl border border-[#E5E5EA] bg-[#F7F7F9] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setVerifyNotice(false);
                setError("");
              }}
              className={`flex-1 rounded-2xl py-2.5 text-[15px] font-semibold ${
                mode === "login" ? "bg-white text-[#1C1C1E] shadow-sm" : "text-[#8E8E93]"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setVerifyNotice(false);
                setError("");
              }}
              className={`flex-1 rounded-2xl py-2.5 text-[15px] font-semibold ${
                mode === "register" ? "bg-white text-[#1C1C1E] shadow-sm" : "text-[#8E8E93]"
              }`}
            >
              Daftar
            </button>
          </div>

          {verifyNotice ? (
            <div className="mt-6 rounded-3xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-5 text-center">
              <p className="text-[16px] font-semibold text-[#1C1C1E]">Cek email Anda</p>
              <p className="mt-2 text-[15px] leading-relaxed text-[#8E8E93]">
                Silakan cek email Anda untuk verifikasi. Setelah diklik, Anda akan masuk ke
                aplikasi secara otomatis.
              </p>
              <Button
                type="button"
                fullWidth
                variant="dark"
                className="mt-4"
                onClick={() => {
                  setVerifyNotice(false);
                  setMode("login");
                }}
              >
                Ke halaman Login
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-3">
                {mode === "register" && (
                  <input
                    type="text"
                    placeholder="Nama lengkap"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={busy}
                    className="w-full rounded-3xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 text-[16px] outline-none focus:border-[#3A3A3C]"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-3xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 text-[16px] outline-none focus:border-[#3A3A3C]"
                />
                <input
                  type="password"
                  placeholder="Password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-3xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 text-[16px] outline-none focus:border-[#3A3A3C]"
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

              <p className="mt-4 text-center text-[12px] text-[#8E8E93]">
                Foto profil diatur di tab Profil setelah masuk.
              </p>
            </>
          )}

          {error && (
            <p className="mt-4 rounded-3xl bg-[#FF3B30]/10 px-4 py-3 text-center text-[14px] text-[#FF3B30]">
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
