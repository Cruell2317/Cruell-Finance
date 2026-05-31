"use client";

import { motion } from "framer-motion";
import { Copy, Heart, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useOnboarding } from "@/context/OnboardingContext";
import { subscribeCoupleChannel } from "@/lib/realtime/couple-channels";
import { useRouter } from "next/navigation";

type Mode = "choose" | "create" | "join";

export default function PairingPage() {
  const router = useRouter();
  const {
    coupleSpace,
    members,
    isPaired,
    createCoupleSpace,
    joinCoupleSpace,
    refresh,
    finalizePairing,
  } = useOnboarding();

  const [mode, setMode] = useState<Mode>(coupleSpace ? "create" : "choose");
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState(coupleSpace?.pairingCode ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!coupleSpace?.id) return;
    return subscribeCoupleChannel(coupleSpace.id, async (event) => {
      if (event.type === "paired") {
        await refresh();
        await finalizePairing();
        router.replace("/");
      }
    });
  }, [coupleSpace?.id, refresh, finalizePairing, router]);

  useEffect(() => {
    if (isPaired) {
      void finalizePairing().then(() => router.replace("/"));
    }
  }, [isPaired, finalizePairing, router]);

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
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kode tidak valid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-white px-6">
      <h1 className="text-center text-[26px] font-bold text-[#1C1C1E]">Hubungkan Ruang</h1>
      <p className="mt-2 text-center text-[15px] text-[#8E8E93]">
        Nama & avatar dari registrasi dipakai otomatis.
      </p>

      {mode === "choose" && (
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => setMode("create")}
            className="flex w-full items-center gap-4 rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] p-4 text-left"
          >
            <Heart className="h-6 w-6" />
            <div>
              <p className="font-semibold">Create Space</p>
              <p className="text-[13px] text-[#8E8E93]">Kode 6 digit instan</p>
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
              <p className="text-[13px] text-[#8E8E93]">Masukkan kode partner</p>
            </div>
          </button>
        </div>
      )}

      {mode === "create" && !generatedCode && (
        <Button fullWidth variant="dark" className="mt-8" onClick={handleCreate} disabled={loading}>
          {loading ? "Membuat..." : "Buat & Tampilkan Kode"}
        </Button>
      )}

      {mode === "create" && generatedCode && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
          <Card className="bg-white text-center">
            <p className="text-[14px] text-[#8E8E93]">Kode ruang</p>
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
            Menunggu partner ({members.length}/2) — sinkron realtime
          </p>
        </motion.div>
      )}

      {mode === "join" && (
        <div className="mt-8 space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="6 digit"
            className="w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-4 text-center font-mono text-[28px] font-bold tracking-widest outline-none"
          />
          <Button fullWidth variant="dark" onClick={handleJoin} disabled={loading}>
            {loading ? "Menghubungkan..." : "Join — masuk Dashboard"}
          </Button>
          <button type="button" onClick={() => setMode("choose")} className="w-full text-[#8E8E93]">
            Kembali
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 text-center text-[14px] text-[#FF3B30]">{error}</p>
      )}
    </div>
  );
}
