"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppContext";
import { formatDate, formatRupiah } from "@/lib/utils";

export function RecentTransactions() {
  const { monthlyActivity, currentMonth } = useApp();
  const [visible, setVisible] = useState(true);

  return (
    <section>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="mb-3 flex w-full items-center justify-between"
      >
        <h2 className="text-[18px] font-bold text-[#1C1C1E]">
          Arus Kas {currentMonth}
        </h2>
        <span className="flex items-center gap-1 text-[14px] font-medium text-[#8E8E93]">
          {visible ? "Sembunyikan" : "Tampilkan"}
          {visible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      <AnimatePresence>
        {visible && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {monthlyActivity.length === 0 ? (
              <Card className="bg-white py-8 text-center text-[15px] text-[#8E8E93]">
                Belum ada aktivitas bulan ini
              </Card>
            ) : (
              <div className="space-y-2">
                {monthlyActivity.map((item) =>
                  item.type === "tx" ? (
                    <Card key={item.data.id} className="flex items-center gap-3 bg-white py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F7F9]">
                        <ArrowDownLeft className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">
                          {item.data.paidByName} — M{item.data.weekNumber}
                        </p>
                        <p className="text-[13px] text-[#8E8E93]">
                          {formatDate(item.data.createdAt)}
                        </p>
                      </div>
                      <p className="font-bold text-[#34C759]">
                        +{formatRupiah(item.data.totalAmount)}
                      </p>
                    </Card>
                  ) : (
                    <Card key={item.data.id} className="flex items-center gap-3 bg-white py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F7F9]">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Uang Lebih — {item.data.depositedByName}</p>
                        <p className="text-[13px] text-[#8E8E93]">
                          {formatDate(item.data.createdAt)}
                        </p>
                      </div>
                      <p className="font-bold">+{formatRupiah(item.data.amount)}</p>
                    </Card>
                  )
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
