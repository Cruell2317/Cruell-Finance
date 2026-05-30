"use client";

import { motion } from "framer-motion";
import { Copy, Heart, Link2, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useOnboarding } from "@/context/OnboardingContext";
import { useRouter } from "next/navigation";
import { getOnboardingPath } from "@/lib/onboarding-routes";

type Mode = "choose" | "create" | "join";

export default function PairingPage() {
  const router = useRouter();
  const {
    coupleSpace,
    members,
    isPaired,
    createCoupleSpace,
    joinCoupleSpace,
  } = useOnboarding();

  const [mode, setMode] = useState<Mode>(coupleSpace ? "create" : "choose");
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState(coupleSpace?.pairingCode ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const { code: newCode } = await createCoupleSpace();
      setGeneratedCode(newCode);
      setMode("create");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat ruang");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setLoading(true);
    setError("");
    try {
      await joinCoupleSpace(code);
      router.push(getOnboardingPath("profile"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kode tidak valid");
    } finally {
      setLoading(false);
    }
  };

  if (isPaired) {
    return (
      <OnboardingShell
        step="pairing"
        title="Terhubung!"
        description="Akun pasangan berhasil dihubungkan."
      >
        <Card className="bg-white">
          <div className="flex justify-center gap-6 py-4">
            {members.map((m) => (
              <div key={m.userId} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E5E5EA] text-lg font-bold">
                  {m.displayName.charAt(0)}
                </div>
                <p className="mt-2 text-[14px] font-semibold">{m.displayName}</p>
              </div>
            ))}
          </div>
        </Card>
        <Button
          fullWidth
          variant="dark"
          className="mt-6"
          onClick={() => router.push(getOnboardingPath("profile"))}
        >
          Lanjut Setup Profil
        </Button>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step="pairing"
      title="Hubungkan Akun"
      description="Dashboard terkunci sampai 2 akun terhubung dalam satu Couple Space."
    >
      {mode === "choose" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setMode("create")}
            className="flex w-full items-center gap-4 rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] p-4 text-left"
          >
            <Heart className="h-6 w-6" />
            <div>
              <p className="font-semibold">Create Space</p>
              <p className="text-[13px] text-[#8E8E93]">Dapat kode undangan 6 digit</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className="flex w-full items-center gap-4 rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] p-4 text-left"
          >
            <Link2 className="h-6 w-6" />
            <div>
              <p className="font-semibold">Join Space</p>
              <p className="text-[13px] text-[#8E8E93]">Masukkan kode dari partner</p>
            </div>
          </button>
        </div>
      )}

      {mode === "create" && !generatedCode && (
        <Button fullWidth variant="dark" onClick={handleCreate} disabled={loading}>
          {loading ? "Membuat..." : "Buat Couple Space"}
        </Button>
      )}

      {mode === "create" && generatedCode && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="bg-white text-center">
            <Users className="mx-auto h-10 w-10 text-[#8E8E93]" />
            <p className="mt-3 text-[14px] text-[#8E8E93]">Kode undangan</p>
            <p className="mt-2 font-mono text-[40px] font-bold tracking-[0.2em]">
              {generatedCode}
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="mt-4 inline-flex items-center gap-2 text-[15px] text-[#8E8E93]"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Tersalin!" : "Salin"}
            </button>
          </Card>
          <p className="mt-4 text-center text-[14px] text-[#8E8E93]">
            Menunggu partner ({members.length}/2)
          </p>
        </motion.div>
      )}

      {mode === "join" && (
        <div className="space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="6 digit"
            className="w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-4 text-center font-mono text-[28px] font-bold tracking-widest outline-none"
          />
          <Button fullWidth variant="dark" onClick={handleJoin} disabled={loading}>
            {loading ? "Menghubungkan..." : "Join Space"}
          </Button>
          <button type="button" onClick={() => setMode("choose")} className="w-full text-[#8E8E93]">
            Kembali
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-center text-[14px] text-[#FF3B30]">{error}</p>}
    </OnboardingShell>
  );
}
