"use client";

import { motion } from "framer-motion";
import { Flame, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatRupiah } from "@/lib/utils";

export function BalanceCard() {
  const { poolBalance, currentMonth, members } = useApp();
  const { profile } = useAuth();
  const myMember = members.find((m) => m.userId === profile?.id);
  const streak = myMember?.savingStreak ?? profile?.savingStreak ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-[#E5E5EA] bg-gradient-to-br from-[#F7F7F9] to-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] text-[#8E8E93]">Total Tabungan Bersama</p>
            <p className="mt-1 text-[34px] font-bold">{formatRupiah(poolBalance)}</p>
            <p className="mt-1 text-[13px] text-[#8E8E93]">{currentMonth}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="rounded-2xl border border-[#E5E5EA] bg-white p-3">
              <PiggyBank className="h-7 w-7 text-[#8E8E93]" />
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-[#F7F7F9] px-2 py-1 text-[12px] font-semibold text-[#1C1C1E]">
                <Flame className="h-4 w-4 text-[#FF3B30]" />
                {streak} minggu streak
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
