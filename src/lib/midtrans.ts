import Midtrans from "midtrans-client";
import { env } from "@/lib/env";

export type VaBank = "bca" | "bni" | "bri" | "permata";

export const VA_BANKS: { id: VaBank; label: string }[] = [
  { id: "bca", label: "BCA" },
  { id: "bni", label: "BNI" },
  { id: "bri", label: "BRI" },
  { id: "permata", label: "Permata" },
];

export function createMidtransCore() {
  return new Midtrans.CoreApi({
    isProduction: env.midtransIsProduction(),
    serverKey: env.midtransServerKey(),
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
  });
}

export async function chargeQris(params: {
  orderId: string;
  amount: number;
  customerName: string;
}) {
  const core = createMidtransCore();
  return core.charge({
    payment_type: "qris",
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName,
    },
    qris: { acquirer: "gopay" },
  });
}

export async function chargeVirtualAccount(params: {
  orderId: string;
  amount: number;
  customerName: string;
  bank: VaBank;
}) {
  const core = createMidtransCore();
  return core.charge({
    payment_type: "bank_transfer",
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName,
    },
    bank_transfer: {
      bank: params.bank,
    },
  });
}

export function extractQrisUrl(charge: Record<string, unknown>): string | null {
  const actions = charge.actions as Array<{ name: string; url: string }> | undefined;
  return actions?.find((a) => a.name === "generate-qr-code")?.url ?? null;
}

export function extractVirtualAccount(charge: Record<string, unknown>): {
  bank: string;
  vaNumber: string;
} | null {
  const vaNumbers = charge.va_numbers as Array<{
    bank: string;
    va_number: string;
  }> | undefined;
  const first = vaNumbers?.[0];
  if (!first) return null;
  return { bank: first.bank.toUpperCase(), vaNumber: first.va_number };
}
