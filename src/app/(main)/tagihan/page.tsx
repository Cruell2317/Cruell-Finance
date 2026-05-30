"use client";

import { useMemo } from "react";
import { PeriodGroup } from "@/components/tagihan/PeriodGroup";
import { PendingConfirmationBanner } from "@/components/payment/PendingConfirmationBanner";
import { ExportExcelButton } from "@/components/tagihan/ExportExcelButton";
import { AppHeader } from "@/components/layout/AppHeader";
import { useApp } from "@/context/AppContext";
import { parseMonthYear } from "@/lib/month-utils";

export default function TagihanPage() {
  const { periods } = useApp();

  const months = useMemo(() => {
    const unique = [...new Set(periods.map((p) => p.monthYear))];
    return unique.sort((a, b) => {
      const pa = parseMonthYear(a);
      const pb = parseMonthYear(b);
      if (pa.year !== pb.year) return pb.year - pa.year;
      return pb.month - pa.month;
    });
  }, [periods]);

  return (
    <div>
      <AppHeader title="Tagihan" subtitle="Riwayat lengkap" showProfile={false} />
      <PendingConfirmationBanner />
      <div className="mb-4 mt-2 flex items-start justify-between gap-3">
        <p className="flex-1 text-[14px] text-[#8E8E93]">
          Setoran Rp 10.000/minggu/orang. Denda Rp 5.000 jika terlambat.
        </p>
        <ExportExcelButton />
      </div>
      {periods.length === 0 ? (
        <p className="rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] p-6 text-center text-[15px] text-[#8E8E93]">
          Selesaikan onboarding Time Machine untuk membuat tagihan.
        </p>
      ) : (
        months.map((monthYear) => (
          <PeriodGroup
            key={monthYear}
            monthYear={monthYear}
            periods={periods.filter((p) => p.monthYear === monthYear)}
          />
        ))
      )}
    </div>
  );
}
