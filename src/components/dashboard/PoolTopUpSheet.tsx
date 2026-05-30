"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";

export function PoolTopUpSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addPoolDeposit } = useApp();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const parsed = Number(amount.replace(/\D/g, ""));
    if (!parsed) return;
    setLoading(true);
    try {
      await addPoolDeposit(parsed, note || undefined);
      setAmount("");
      setNote("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
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
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold">Uang Lebih</h2>
              <button type="button" onClick={onClose} className="rounded-full bg-[#F7F7F9] p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-[14px] text-[#8E8E93]">
              Tambah ke pool utama tanpa mengubah jadwal mingguan.
            </p>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              placeholder="Nominal (Rp)"
              className="mt-4 w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 text-[17px] outline-none"
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan (opsional)"
              className="mt-3 w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3 outline-none"
            />
            <Button fullWidth variant="dark" className="mt-6" onClick={handleSubmit} disabled={loading}>
              {loading ? "Menyimpan..." : "Tambah ke Pool"}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
