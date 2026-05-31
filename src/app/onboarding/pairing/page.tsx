"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, Heart, Link2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useOnboarding } from "@/context/OnboardingContext";
import { isValidPairingCode, normalizePairingCode } from "@/lib/pairing";
import { subscribeSpaceMemberChanges } from "@/lib/realtime/space-members";
import { useRouter } from "next/navigation";

type Mode = "choose" | "create" | "join";

export default function PairingPage() {
  const router = useRouter();
  const {
    coupleSpace,
    members,
    isPaired,
    createCoupleSpace,
    joinCoupleSpaceInstant,
    cancelCoupleSpace,
    refresh,
  } = useOnboarding();

  const [mode, setMode] = useState<Mode>("choose");
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [cancellingCreate, setCancellingCreate] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const lockedCodeRef = useRef("");

  useEffect(() => {
    if (coupleSpace?.pairingCode) {
      setGeneratedCode(coupleSpace.pairingCode);
      setMode("create");
    }
  }, [coupleSpace?.pairingCode]);

  const goDashboard = useCallback(() => {
    router.replace("/");
  }, [router]);

  useEffect(() => {
    if (!coupleSpace?.id) return;
    return subscribeSpaceMemberChanges(coupleSpace.id, () => {
      void refresh().then(() => {
        /* refresh updates members — effect below handles redirect */
      });
    });
  }, [coupleSpace?.id, refresh]);

  useEffect(() => {
    if (isPaired && coupleSpace?.onboardingComplete) {
      goDashboard();
    }
  }, [isPaired, coupleSpace?.onboardingComplete, goDashboard]);

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      const { code: newCode } = await createCoupleSpace();
      setGeneratedCode(newCode);
      setMode("create");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat ruang");
    } finally {
      setCreating(false);
    }
  };

  const handleCancelCreate = async () => {
    setCancellingCreate(true);
    setError("");
    try {
      await cancelCoupleSpace();
      setGeneratedCode("");
      setMode("choose");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membatalkan");
    } finally {
      setCancellingCreate(false);
    }
  };

  const handleJoin = async () => {
    const normalized = normalizePairingCode(code);
    if (!isValidPairingCode(normalized)) {
      setError("Kode harus 6 karakter");
      return;
    }

    lockedCodeRef.current = normalized;
    setConnecting(true);
    setError("");

    try {
      const ok = await joinCoupleSpaceInstant(normalized);
      if (ok) {
        goDashboard();
        return;
      }
      setError("Gagal menghubungkan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kode tidak valid");
    } finally {
      setConnecting(false);
    }
  };

  const handleCancelJoin = () => {
    setConnecting(false);
    setError("");
  };

  const resetToChoose = () => {
    if (connecting) return;
    setMode("choose");
    setCode("");
    setError("");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-white px-6">
      <h1 className="text-center text-[26px] font-bold text-[#1C1C1E]">Hubungkan Ruang</h1>
      <p className="mt-2 text-center text-[15px] text-[#8E8E93]">
        Satu klik — satu proses server, tanpa delay.
      </p>

      <AnimatePresence mode="wait">
        {mode === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-8 space-y-3"
          >
            <button
              type="button"
              onClick={() => setMode("create")}
              className="flex w-full items-center gap-4 rounded-3xl border border-[#E5E5EA] bg-[#F7F7F9] p-4 text-left active:bg-[#E5E5EA]"
            >
              <Heart className="h-6 w-6 shrink-0" />
              <div>
                <p className="font-semibold">Create Space</p>
                <p className="text-[13px] text-[#8E8E93]">Kode 6 digit</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("join")}
              className="flex w-full items-center gap-4 rounded-3xl border border-[#E5E5EA] bg-[#F7F7F9] p-4 text-left active:bg-[#E5E5EA]"
            >
              <Link2 className="h-6 w-6 shrink-0" />
              <div>
                <p className="font-semibold">Join Space</p>
                <p className="text-[13px] text-[#8E8E93]">Masukkan kode partner</p>
              </div>
            </button>
          </motion.div>
        )}

        {mode === "create" && !generatedCode && (
          <motion.div
            key="create-init"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 space-y-3"
          >
            <Button fullWidth variant="dark" onClick={handleCreate} disabled={creating}>
              {creating ? "Membuat..." : "Buat & Tampilkan Kode"}
            </Button>
            <Button fullWidth variant="secondary" onClick={resetToChoose} disabled={creating}>
              Batal
            </Button>
          </motion.div>
        )}

        {mode === "create" && generatedCode && (
          <motion.div
            key="create-code"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8"
          >
            <Card className="bg-white text-center">
              <p className="text-[14px] text-[#8E8E93]">Kode ruang</p>
              <p className="mt-2 font-mono text-[40px] font-bold tracking-[0.2em] text-[#1C1C1E]">
                {generatedCode}
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
                className="mt-4 inline-flex items-center gap-2 text-[15px] text-[#8E8E93]"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Tersalin!" : "Salin"}
              </button>
            </Card>
            <p className="mt-4 text-center text-[14px] text-[#8E8E93]">
              Menunggu partner ({members.length}/2) — realtime DB
            </p>
            <Button
              fullWidth
              variant="secondary"
              className="mt-4"
              onClick={() => void handleCancelCreate()}
              disabled={cancellingCreate}
            >
              {cancellingCreate ? "Membatalkan..." : "Batal"}
            </Button>
          </motion.div>
        )}

        {mode === "join" && (
          <motion.div
            key="join"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-8 space-y-4"
          >
            <div className="relative">
              <input
                value={connecting ? lockedCodeRef.current : code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={connecting}
                placeholder="6 digit"
                className={`w-full rounded-3xl border px-4 py-4 text-center font-mono text-[28px] font-bold tracking-widest outline-none ${
                  connecting
                    ? "cursor-not-allowed border-[#E5E5EA] bg-[#F7F7F9] text-[#8E8E93]"
                    : "border-[#E5E5EA] bg-[#F7F7F9] text-[#1C1C1E]"
                }`}
              />
              {connecting && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/50">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1C1C1E]" />
                </div>
              )}
            </div>

            {connecting ? (
              <Button fullWidth variant="secondary" onClick={handleCancelJoin}>
                Batal
              </Button>
            ) : (
              <>
                <Button
                  fullWidth
                  variant="dark"
                  onClick={() => void handleJoin()}
                  disabled={code.length < 6}
                >
                  Hubungkan
                </Button>
                <Button fullWidth variant="secondary" onClick={resetToChoose}>
                  Batal
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-[14px] text-[#FF3B30]"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
