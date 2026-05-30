import type { PeriodStatus } from "@/types";

const styles: Record<PeriodStatus, string> = {
  PAID: "bg-[#E5E5EA] text-[#1C1C1E]",
  UNPAID: "bg-[#F7F7F9] text-[#8E8E93] border border-[#E5E5EA]",
  LATE: "bg-[#FF3B30]/10 text-[#FF3B30]",
};

const labels: Record<PeriodStatus, string> = {
  PAID: "Lunas",
  UNPAID: "Belum Bayar",
  LATE: "Terlambat",
};

export function StatusBadge({ status }: { status: PeriodStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
