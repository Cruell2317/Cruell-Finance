"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { MONTH_NAMES_ID } from "@/lib/month-utils";
import { useRouter } from "next/navigation";
import { getOnboardingPath } from "@/lib/onboarding-routes";

const YEARS = [2024, 2025, 2026, 2027];

export default function StartDatePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { setStartDate, coupleSpace } = useOnboarding();
  const now = new Date();
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(2026);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await setStartDate(month, year);
      router.push(getOnboardingPath("target"));
    } finally {
      setLoading(false);
    }
  };

  if (coupleSpace?.startMonth && coupleSpace?.startYear) {
    return (
      <OnboardingShell step="start-date" title="Time Machine" description="Tagihan sudah di-generate oleh partner.">
        <Button fullWidth variant="dark" onClick={() => router.push(getOnboardingPath("target"))}>
          Lanjut
        </Button>
      </OnboardingShell>
    );
  }

  if (!profile?.isSpaceCreator) {
    return (
      <OnboardingShell step="start-date" title="Menunggu Partner" description="Pembuat ruang sedang mengatur tanggal mulai tabungan.">
        <p className="text-center text-[15px] text-[#8E8E93]">Halaman akan lanjut otomatis setelah Time Machine diaktifkan.</p>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step="start-date"
      title="Time Machine"
      description="Pilih bulan & tahun mulai tabungan. Tagihan retroaktif akan dibuat otomatis hingga bulan ini — semua status Belum Bayar."
    >
      <div className="space-y-6">
        <div>
          <label className="text-[14px] font-medium text-[#8E8E93]">Bulan</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-2 w-full appearance-none rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 text-[17px] text-[#1C1C1E] outline-none"
          >
            {MONTH_NAMES_ID.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[14px] font-medium text-[#8E8E93]">Tahun</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-2 w-full appearance-none rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 text-[17px] text-[#1C1C1E] outline-none"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] p-4">
          <p className="text-[14px] text-[#8E8E93]">
            Mulai: <strong className="text-[#1C1C1E]">{MONTH_NAMES_ID[month - 1]} {year}</strong>
          </p>
          <p className="mt-2 text-[13px] text-[#8E8E93]">
            Sistem akan generate 4 minggu × 2 orang per bulan hingga{" "}
            {MONTH_NAMES_ID[now.getMonth()]} {now.getFullYear()}.
          </p>
        </div>
      </div>

      <Button
        fullWidth
        variant="dark"
        className="mt-8"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Membuat tagihan..." : "Generate Tagihan"}
      </Button>
    </OnboardingShell>
  );
}
