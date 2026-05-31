"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatRupiah } from "@/lib/utils";

export function BalanceCard() {
  const { poolBalance, bankSyncBalance, syncOpenBanking, currentMonth } = useApp();
  const { profile } = useAuth();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    void syncOpenBanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync sekali saat mount ruang
  }, []);

  const displayBalance = bankSyncBalance ?? poolBalance;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncOpenBanking();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-[#E5E5EA] bg-gradient-to-br from-[#F7F7F9] to-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[#8E8E93]">
              Saldo Rekening Bersama · Brick/SNAP (simulasi)
            </p>
            <p className="mt-1 text-[32px] font-bold leading-tight">
              {formatRupiah(displayBalance)}
            </p>
            <p className="mt-1 text-[13px] text-[#8E8E93]">
              Pool internal: {formatRupiah(poolBalance)} · {currentMonth}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="shrink-0 rounded-full border border-[#E5E5EA] bg-white p-2.5"
            aria-label="Sinkron bank"
          >
            <RefreshCw
              className={`h-5 w-5 text-[#1C1C1E] ${syncing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        {profile?.role === "CREATOR" && (
          <p className="mt-3 text-[12px] text-[#8E8E93]">
            Administrator: atur QR/VA di Profil → Pembayaran
          </p>
        )}
      </Card>
    </motion.div>
  );
}
