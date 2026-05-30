"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Hand } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { PeriodDetailSheet } from "./PeriodDetailSheet";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatRupiah, getPeriodAmount } from "@/lib/utils";
import type { SavingsPeriod } from "@/types";

export function PeriodGroup({
  monthYear,
  periods,
}: {
  monthYear: string;
  periods: SavingsPeriod[];
}) {
  const { profile } = useAuth();
  const { sendNudge } = useApp();
  const [expanded, setExpanded] = useState(
    monthYear.includes(new Date().getFullYear().toString())
  );
  const [selected, setSelected] = useState<SavingsPeriod | null>(null);

  const byUser = periods.reduce<Record<string, SavingsPeriod[]>>((acc, p) => {
    if (!acc[p.userDisplayName]) acc[p.userDisplayName] = [];
    acc[p.userDisplayName].push(p);
    return acc;
  }, {});

  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mb-2 flex w-full items-center justify-between rounded-2xl bg-[#F7F7F9] px-4 py-3"
      >
        <span className="text-[17px] font-bold">{monthYear}</span>
        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {expanded &&
        Object.entries(byUser).map(([name, userPeriods]) => (
          <div key={name} className="mb-3">
            <p className="mb-2 px-1 text-[14px] font-semibold text-[#8E8E93]">{name}</p>
            <div className="space-y-2">
              {userPeriods
                .sort((a, b) => a.weekNumber - b.weekNumber)
                .map((period) => {
                  const isOwn = period.userId === profile?.id;
                  const isPartnerUnpaid =
                    !isOwn &&
                    (period.status === "UNPAID" || period.status === "LATE");
                  return (
                    <Card
                      key={period.id}
                      className="flex items-center justify-between bg-white py-3"
                      onClick={() => setSelected(period)}
                    >
                      <div>
                        <p className="font-semibold">Minggu {period.weekNumber}</p>
                        {isOwn ? (
                          <p className="text-[13px] text-[#8E8E93]">
                            {formatRupiah(getPeriodAmount(period))}
                          </p>
                        ) : (
                          <StatusBadge status={period.status} />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwn && <StatusBadge status={period.status} />}
                        {isPartnerUnpaid && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendNudge(period.id, period.userId);
                            }}
                            className="rounded-full bg-[#F7F7F9] p-2"
                            title="Colek"
                          >
                            <Hand className="h-4 w-4 text-[#8E8E93]" />
                          </button>
                        )}
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}

      {selected && (
        <PeriodDetailSheet
          period={selected}
          isOwn={selected.userId === profile?.id}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
