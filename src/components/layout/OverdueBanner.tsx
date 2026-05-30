"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function OverdueBanner() {
  const { overdueCount, isBannerDismissed, dismissBanner } = useApp();
  const show = overdueCount > 0 && !isBannerDismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed left-0 right-0 top-0 z-50 mx-auto max-w-md px-4 pt-[max(0.5rem,env(safe-area-inset-top))]"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-[#FF3B30] px-4 py-3 text-white shadow-sm">
            <AlertTriangle className="h-5 w-5 shrink-0" strokeWidth={2.5} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-tight">
                {overdueCount} tagihan menunggak
              </p>
              <p className="text-[13px] opacity-90">
                Segera bayar sebelum denda bertambah
              </p>
            </div>
            <button
              type="button"
              onClick={dismissBanner}
              className="shrink-0 rounded-full p-1.5 hover:bg-white/20 active:bg-white/30"
              aria-label="Tutup notifikasi"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
