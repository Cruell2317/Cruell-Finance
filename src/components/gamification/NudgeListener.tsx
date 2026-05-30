"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { NudgePayload } from "@/types";

export function NudgeListener() {
  const { profile } = useAuth();
  const [nudge, setNudge] = useState<NudgePayload | null>(null);

  useEffect(() => {
    if (!profile?.coupleSpaceId) return;

    const supabase = createClient();
    const channel = supabase.channel(`nudge-${profile.coupleSpaceId}`);

    channel
      .on("broadcast", { event: "nudge" }, ({ payload }) => {
        const p = payload as NudgePayload;
        if (p.fromUserId === profile.id) return;
        setNudge(p);
        setTimeout(() => setNudge(null), 5000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  return (
    <AnimatePresence>
      {nudge && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed left-0 right-0 top-0 z-[100] mx-auto max-w-md px-4 pt-[max(0.5rem,env(safe-area-inset-top))]"
        >
          <div className="rounded-2xl border border-[#E5E5EA] bg-[#1C1C1E] px-4 py-3 text-white shadow-lg">
            <p className="text-[15px] font-semibold">{nudge.message}</p>
            <p className="text-[13px] opacity-80">
              {nudge.monthYear} · Minggu {nudge.weekNumber}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
