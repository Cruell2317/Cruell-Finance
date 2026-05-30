"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatRupiah, getPeriodAmount } from "@/lib/utils";
import type { SavingsPeriod } from "@/types";
import { useRouter } from "next/navigation";

export function PeriodDetailSheet({
  period,
  isOwn,
  onClose,
}: {
  period: SavingsPeriod;
  isOwn: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { getPeriodTransaction, getPeriodPendingTransaction } = useApp();
  const amount = getPeriodAmount(period);
  const tx = getPeriodTransaction(period.id);
  const pendingTx = getPeriodPendingTransaction(period.id);
  const canPay =
    isOwn &&
    (period.status === "UNPAID" || period.status === "LATE") &&
    !pendingTx;

  const handlePay = () => {
    onClose();
    router.push(
      `/checkout?periods=${period.id}&label=${encodeURIComponent(`${period.monthYear} M${period.weekNumber}`)}`
    );
  };

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/30"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3"
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E5E5EA]" />
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[22px] font-bold">
                Minggu {period.weekNumber}, {period.monthYear}
              </h2>
              <p className="text-[14px] text-[#8E8E93]">{period.userDisplayName}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full bg-[#F7F7F9] p-2">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-3 rounded-2xl bg-[#F7F7F9] p-4">
            <div className="flex justify-between">
              <span className="text-[#8E8E93]">Status</span>
              <StatusBadge status={period.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-[#8E8E93]">Jatuh tempo</span>
              <span className="font-medium">{formatDate(period.dueDate)}</span>
            </div>
            {isOwn && (
              <>
                <div className="flex justify-between">
                  <span className="text-[#8E8E93]">Pokok</span>
                  <span>{formatRupiah(period.baseAmount)}</span>
                </div>
                {period.penaltyAmount > 0 && (
                  <div className="flex justify-between text-[#FF3B30]">
                    <span>Denda</span>
                    <span>{formatRupiah(period.penaltyAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#E5E5EA] pt-2 font-bold">
                  <span>Total</span>
                  <span>{formatRupiah(amount)}</span>
                </div>
              </>
            )}
          </div>

          {isOwn && period.status === "PAID" && tx && (
            <div className="mt-4 rounded-2xl border border-[#E5E5EA] p-4 text-[14px]">
              <p className="text-[#8E8E93]">Pembayaran sukses</p>
              <p className="mt-1 font-medium">{formatDate(tx.createdAt)}</p>
              <p>{tx.paymentMethod}</p>
              <p className="font-mono text-[12px] text-[#8E8E93]">
                {tx.midtransOrderId ?? tx.id}
              </p>
            </div>
          )}

          {!isOwn && (
            <p className="mt-4 text-center text-[14px] text-[#8E8E93]">
              Detail transaksi partner disembunyikan untuk privasi.
            </p>
          )}

          {isOwn && pendingTx && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-[14px] text-amber-900">
              Menunggu konfirmasi pasangan
            </div>
          )}

          {canPay && (
            <Button fullWidth variant="dark" className="mt-6" onClick={handlePay}>
              BAYAR SEKARANG
            </Button>
          )}
        </motion.div>
      </>
    </AnimatePresence>
  );
}
