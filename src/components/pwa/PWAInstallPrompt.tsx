"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "cruell-pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const ua = navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    if (ios) setVisible(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md px-4"
        >
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-3">
                <Image
                  src="/icons/icon-128.png"
                  alt="Cruell Financial"
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-xl border border-[#E5E5EA]"
                  unoptimized
                />
                <div>
                  <p className="font-bold text-[#1C1C1E]">Pasang di HP</p>
                  <p className="text-[13px] text-[#8E8E93]">
                    Buka seperti aplikasi native
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-full p-1 text-[#8E8E93]"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              {deferred && !isIos && (
                <button
                  type="button"
                  onClick={install}
                  className="flex-1 rounded-xl bg-[#1C1C1E] py-2.5 text-[14px] font-semibold text-white"
                >
                  Pasang sekarang
                </button>
              )}
              <Link
                href="/panduan"
                className="flex-1 rounded-xl border border-[#E5E5EA] py-2.5 text-center text-[14px] font-semibold"
                onClick={dismiss}
              >
                Panduan lengkap
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
