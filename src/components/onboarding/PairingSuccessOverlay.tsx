"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

export function PairingSuccessOverlay({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="pairing-success"
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="flex flex-col items-center text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#34C759]/15">
              <Check className="h-10 w-10 text-[#34C759]" strokeWidth={2.5} />
            </div>
            <p className="mt-5 text-[22px] font-bold text-[#1C1C1E]">Terhubung!</p>
            <p className="mt-2 text-[15px] text-[#8E8E93]">
              Membuka dashboard...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
