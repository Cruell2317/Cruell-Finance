"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useOnboarding } from "@/context/OnboardingContext";
import { useRouter } from "next/navigation";
import { getOnboardingPath } from "@/lib/onboarding-routes";

const PRESETS = [
  { name: "Tabungan Masa Depan (15 Tahun)", amount: "" },
  { name: "Kejutan Spesial", amount: "" },
];

export default function TargetSetupPage() {
  const router = useRouter();
  const { completeTargetStep, skipTargetStep } = useOnboarding();
  const [name, setName] = useState(PRESETS[0].name);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const parsed = Number(amount.replace(/\D/g, ""));
      if (name.trim() && parsed > 0) {
        await completeTargetStep({
          name: name.trim(),
          imageUrl:
            "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop",
          targetAmount: parsed,
        });
      } else {
        await skipTargetStep();
      }
      router.push(getOnboardingPath("complete"));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    await skipTargetStep();
    router.push(getOnboardingPath("complete"));
    setLoading(false);
  };

  return (
    <OnboardingShell
      step="target"
      title="Target Pertama"
      description="Opsional — apa tujuan utama tabungan kalian?"
    >
      <div className="space-y-3">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setName(p.name)}
            className={`w-full rounded-2xl border px-4 py-3 text-left text-[15px] ${
              name === p.name
                ? "border-[#1C1C1E] bg-[#F7F7F9] font-semibold text-[#1C1C1E]"
                : "border-[#E5E5EA] text-[#8E8E93]"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama target"
        className="mt-4 w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 text-[17px] outline-none focus:border-[#8E8E93]"
      />
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Nominal target (Rp) — kosongkan untuk skip"
        inputMode="numeric"
        className="mt-3 w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 text-[17px] outline-none focus:border-[#8E8E93]"
      />

      <Button fullWidth variant="dark" className="mt-8" onClick={handleSubmit} disabled={loading}>
        {loading ? "Menyimpan..." : "Selesai & Masuk Dashboard"}
      </Button>
      <button
        type="button"
        onClick={handleSkip}
        disabled={loading}
        className="mt-4 w-full text-center text-[15px] font-medium text-[#8E8E93]"
      >
        Lewati dulu
      </button>
    </OnboardingShell>
  );
}
