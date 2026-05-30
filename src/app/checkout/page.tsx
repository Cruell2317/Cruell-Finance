"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  QrCode,
  Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { VaDisplayCard } from "@/components/payment/VaDisplayCard";
import { useApp } from "@/context/AppContext";
import { VA_BANKS, type VaBank } from "@/lib/midtrans";
import {
  getAvailableVaBanks,
  hasManualPaymentConfigured,
} from "@/lib/payment-banks";
import { uploadPaymentProof } from "@/lib/storage";
import { formatRupiah } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type PayMode = "qris" | "va" | "midtrans_qris" | "midtrans_va";
type Step = "method" | "pay" | "waiting" | "done";

function CheckoutContent() {
  const router = useRouter();
  const { profile } = useAuth();
  const {
    paymentSettings,
    submitManualPaymentClaim,
  } = useApp();
  const searchParams = useSearchParams();
  const periodIds = (searchParams.get("periods") ?? "").split(",").filter(Boolean);
  const label = searchParams.get("label") ?? "Pembayaran";

  const [step, setStep] = useState<Step>("method");
  const [mode, setMode] = useState<PayMode>("qris");
  const [vaKey, setVaKey] = useState<string>("vaBca");
  const [midtransBank, setMidtransBank] = useState<VaBank>("bca");
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [va, setVa] = useState<{ bank: string; vaNumber: string } | null>(null);
  const [orderId, setOrderId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const vaBanks = useMemo(
    () => getAvailableVaBanks(paymentSettings),
    [paymentSettings]
  );
  const manualReady = hasManualPaymentConfigured(paymentSettings);
  const hasQris = Boolean(paymentSettings?.qrisImageUrl);
  const useMidtrans = Boolean(paymentSettings?.useMidtrans);

  useEffect(() => {
    if (!periodIds.length) return;
    fetch(`/api/payments/preview?periodIds=${periodIds.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.amount != null) setAmount(d.amount);
      })
      .finally(() => setLoading(false));
  }, [periodIds.join(",")]);

  useEffect(() => {
    if (hasQris) setMode("qris");
    else if (vaBanks.length) {
      setMode("va");
      setVaKey(vaBanks[0]!.key);
    } else if (useMidtrans) setMode("midtrans_qris");
  }, [hasQris, vaBanks.length, useMidtrans]);

  const selectedVa = vaBanks.find((b) => b.key === vaKey) ?? vaBanks[0];
  const amountLabel = formatRupiah(amount);

  const handleMidtransPay = async () => {
    setPaying(true);
    setError("");
    try {
      const isVa = mode === "midtrans_va";
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodIds,
          paymentMethod: isVa ? "va" : "qris",
          bank: midtransBank,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat pembayaran");
      setOrderId(data.orderId);
      setQrUrl(data.qrUrl ?? null);
      setVa(data.va ?? null);
      setStep("pay");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setPaying(false);
    }
  };

  const handleClaimPaid = async () => {
    if (!profile) return;
    setPaying(true);
    setError("");
    try {
      let proofUrl: string | null = null;
      if (proofFile) {
        proofUrl = await uploadPaymentProof(profile.id, proofFile);
      }
      const methodLabel =
        mode === "qris"
          ? "QRIS Manual"
          : mode === "va" && selectedVa
            ? `VA ${selectedVa.label}`
            : mode.startsWith("midtrans")
              ? "Midtrans"
              : "Manual";
      const id = await submitManualPaymentClaim(periodIds, methodLabel, proofUrl);
      setOrderId(id);
      setStep("waiting");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setPaying(false);
    }
  };

  const showManualPayStep =
    step === "pay" && (mode === "qris" || mode === "va");

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <header className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          onClick={() => {
            if (step === "pay" || step === "waiting") setStep("method");
            else router.back();
          }}
          className="rounded-full bg-[#F7F7F9] p-2.5"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[20px] font-bold text-[#1C1C1E]">Checkout</h1>
      </header>

      <main className="px-4 pb-8">
        <p className="text-[15px] text-[#8E8E93]">{label}</p>
        {!loading && (
          <p className="mt-1 text-[32px] font-bold tracking-tight text-[#1C1C1E]">
            {amountLabel}
          </p>
        )}

        {loading && (
          <p className="mt-8 text-center text-[#8E8E93]">Memuat...</p>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-[#FF3B30]/10 px-4 py-3 text-[14px] text-[#FF3B30]">
            {error}
          </p>
        )}

        {step === "method" && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-3"
          >
            {!manualReady && !useMidtrans && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[14px] text-amber-900">
                Pembayaran belum diatur.{" "}
                <Link href="/settings/pembayaran" className="font-semibold underline">
                  Atur QRIS & VA
                </Link>{" "}
                dulu di pengaturan.
              </div>
            )}

            {hasQris && (
              <button
                type="button"
                onClick={() => setMode("qris")}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                  mode === "qris"
                    ? "border-[#1C1C1E] bg-[#F7F7F9] ring-1 ring-[#1C1C1E]"
                    : "border-[#E5E5EA]"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C1C1E] text-white">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">QRIS</p>
                  <p className="text-[13px] text-[#8E8E93]">Scan QR yang diupload</p>
                </div>
              </button>
            )}

            {vaBanks.length > 0 && (
              <button
                type="button"
                onClick={() => setMode("va")}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                  mode === "va"
                    ? "border-[#1C1C1E] bg-[#F7F7F9] ring-1 ring-[#1C1C1E]"
                    : "border-[#E5E5EA]"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7F7F9]">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Transfer Bank / VA</p>
                  <p className="text-[13px] text-[#8E8E93]">
                    {vaBanks.map((b) => b.shortLabel).join(" · ")}
                  </p>
                </div>
              </button>
            )}

            {useMidtrans && (
              <>
                <p className="pt-2 text-[12px] font-medium uppercase tracking-wide text-[#8E8E93]">
                  Otomatis (Midtrans)
                </p>
                <button
                  type="button"
                  onClick={() => setMode("midtrans_qris")}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left ${
                    mode === "midtrans_qris"
                      ? "border-[#1C1C1E] bg-[#F7F7F9]"
                      : "border-[#E5E5EA]"
                  }`}
                >
                  <QrCode className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">QRIS Midtrans</p>
                    <p className="text-[13px] text-[#8E8E93]">Konfirmasi otomatis</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("midtrans_va")}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left ${
                    mode === "midtrans_va"
                      ? "border-[#1C1C1E] bg-[#F7F7F9]"
                      : "border-[#E5E5EA]"
                  }`}
                >
                  <Building2 className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">VA Midtrans</p>
                    <p className="text-[13px] text-[#8E8E93]">Nomor VA dinamis</p>
                  </div>
                </button>
              </>
            )}

            {mode === "va" && vaBanks.length > 1 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {vaBanks.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => setVaKey(b.key)}
                    className={`rounded-xl border py-2.5 text-[13px] font-semibold ${
                      vaKey === b.key
                        ? "border-[#1C1C1E] text-white"
                        : "border-[#E5E5EA]"
                    }`}
                    style={
                      vaKey === b.key
                        ? { backgroundColor: b.color, borderColor: b.color }
                        : undefined
                    }
                  >
                    {b.shortLabel}
                  </button>
                ))}
              </div>
            )}

            {mode === "midtrans_va" && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {VA_BANKS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setMidtransBank(b.id)}
                    className={`rounded-xl border py-3 text-[15px] font-semibold ${
                      midtransBank === b.id
                        ? "border-[#1C1C1E] bg-[#1C1C1E] text-white"
                        : "border-[#E5E5EA]"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}

            <Button
              fullWidth
              variant="dark"
              className="mt-4"
              disabled={paying || (!manualReady && !useMidtrans)}
              onClick={() => {
                if (mode.startsWith("midtrans")) handleMidtransPay();
                else setStep("pay");
              }}
            >
              {paying ? "Memproses..." : "Lanjut bayar"}
            </Button>
          </motion.div>
        )}

        {showManualPayStep && paymentSettings && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <p className="rounded-xl bg-[#F7F7F9] px-4 py-3 text-[14px] text-[#3C3C43]">
              {paymentSettings.paymentInstructions}
            </p>

            {mode === "qris" && paymentSettings.qrisImageUrl && (
              <div className="rounded-3xl border border-[#E5E5EA] bg-white p-4 shadow-sm">
                <p className="mb-3 text-center text-[13px] font-medium text-[#8E8E93]">
                  Scan QRIS — transfer {amountLabel}
                </p>
                <div className="relative mx-auto aspect-square w-full max-w-[280px]">
                  <Image
                    src={paymentSettings.qrisImageUrl}
                    alt="QRIS"
                    fill
                    className="rounded-2xl object-contain"
                    unoptimized
                  />
                </div>
                <p className="mt-3 text-center text-[12px] text-[#8E8E93]">
                  a.n. {paymentSettings.accountHolderName}
                </p>
              </div>
            )}

            {mode === "va" && selectedVa && (
              <VaDisplayCard
                bank={selectedVa}
                accountNumber={selectedVa.accountNumber}
                holderName={paymentSettings.accountHolderName}
                amountLabel={amountLabel}
              />
            )}

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#E5E5EA] p-4">
              <Upload className="h-5 w-5 text-[#8E8E93]" />
              <span className="text-[14px] text-[#8E8E93]">
                {proofFile ? proofFile.name : "Lampirkan bukti transfer (opsional)"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <Button
              fullWidth
              variant="dark"
              disabled={paying}
              onClick={handleClaimPaid}
            >
              {paying ? "Mengirim..." : "Saya sudah transfer"}
            </Button>
          </motion.div>
        )}

        {step === "pay" && mode.startsWith("midtrans") && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] p-6"
          >
            {mode === "midtrans_qris" && qrUrl && (
              <div className="relative mx-auto h-64 w-64">
                <Image src={qrUrl} alt="QRIS" fill className="object-contain" unoptimized />
              </div>
            )}
            {mode === "midtrans_va" && va && (
              <div className="text-center">
                <p className="text-[13px] text-[#8E8E93]">Transfer ke VA</p>
                <p className="mt-2 font-semibold">{va.bank}</p>
                <p className="mt-2 font-mono text-[26px] font-bold">{va.vaNumber}</p>
              </div>
            )}
            <p className="mt-6 text-center text-[13px] text-[#8E8E93]">
              Status & streak diperbarui otomatis setelah Midtrans konfirmasi.
            </p>
            <Button fullWidth variant="dark" className="mt-4" onClick={() => router.push("/tagihan")}>
              Ke Tagihan
            </Button>
          </motion.div>
        )}

        {step === "waiting" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 rounded-3xl bg-[#F7F7F9] p-8 text-center"
          >
            <Clock className="mx-auto h-14 w-14 text-amber-500" />
            <p className="mt-4 text-[20px] font-bold">Menunggu konfirmasi</p>
            <p className="mt-2 text-[15px] text-[#8E8E93]">
              Pasangan perlu menekan &quot;Konfirmasi pembayaran&quot; di halaman Tagihan.
            </p>
            {orderId && (
              <p className="mt-4 font-mono text-[12px] text-[#8E8E93]">Ref: {orderId}</p>
            )}
            <Button fullWidth variant="dark" className="mt-6" onClick={() => router.push("/tagihan")}>
              Ke Tagihan
            </Button>
          </motion.div>
        )}

        {step === "done" && (
          <div className="mt-8 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <p className="mt-4 text-[20px] font-bold">Selesai</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[#8E8E93]">Memuat checkout...</div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
