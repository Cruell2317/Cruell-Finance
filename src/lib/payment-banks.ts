import type { PaymentSettings, VaBankOption } from "@/types";

export const VA_BANK_OPTIONS: VaBankOption[] = [
  { key: "vaBca", label: "BCA", shortLabel: "BCA", color: "#00529C" },
  { key: "vaBni", label: "BNI", shortLabel: "BNI", color: "#F15A22" },
  { key: "vaBri", label: "BRI", shortLabel: "BRI", color: "#00529F" },
  { key: "vaMandiri", label: "Mandiri", shortLabel: "MDR", color: "#F9B233" },
  { key: "vaPermata", label: "Permata", shortLabel: "PRM", color: "#00A651" },
  { key: "vaCimb", label: "CIMB Niaga", shortLabel: "CIMB", color: "#790008" },
];

export function getAvailableVaBanks(settings: PaymentSettings | null): Array<
  VaBankOption & { accountNumber: string }
> {
  if (!settings) return [];
  return VA_BANK_OPTIONS.filter((b) => {
    const num = settings[b.key];
    return num && String(num).trim().length > 0;
  }).map((b) => ({
    ...b,
    accountNumber: String(settings[b.key]).trim(),
  }));
}

export function hasManualPaymentConfigured(settings: PaymentSettings | null): boolean {
  if (!settings) return false;
  if (settings.qrisImageUrl) return true;
  return getAvailableVaBanks(settings).length > 0;
}
