"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatRupiah } from "@/lib/utils";

export function PendingConfirmationBanner() {
  const { profile } = useAuth();
  const { pendingPaymentClaims, confirmManualPayment } = useApp();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState("");

  const forPartner = pendingPaymentClaims.filter(
    (c) => c.paidBy !== profile?.id
  );

  if (!forPartner.length) return null;

  const handleConfirm = async (orderId: string) => {
    setConfirming(orderId);
    setError("");
    try {
      await confirmManualPayment(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal konfirmasi");
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div className="mb-4 space-y-3">
      {forPartner.map((claim) => (
        <motion.div
          key={claim.orderId}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">Menunggu konfirmasi</p>
              <p className="mt-1 text-[14px] text-amber-800">
                {claim.paidByName} mengklaim sudah bayar{" "}
                <span className="font-bold">{formatRupiah(claim.totalAmount)}</span>
              </p>
              <p className="mt-1 text-[13px] text-amber-700">
                {claim.periodLabels.join(", ")} · {claim.paymentMethod}
              </p>
            </div>
          </div>
          <Button
            fullWidth
            variant="dark"
            className="mt-3 gap-2"
            disabled={confirming === claim.orderId}
            onClick={() => handleConfirm(claim.orderId)}
          >
            <CheckCircle2 className="h-5 w-5" />
            {confirming === claim.orderId
              ? "Mengonfirmasi..."
              : "Konfirmasi pembayaran"}
          </Button>
        </motion.div>
      ))}
      {error && (
        <p className="rounded-xl bg-[#FF3B30]/10 px-3 py-2 text-[13px] text-[#FF3B30]">
          {error}
        </p>
      )}
    </div>
  );
}
