"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { WishlistSection } from "@/components/dashboard/WishlistSection";
import { PoolTopUpSheet } from "@/components/dashboard/PoolTopUpSheet";

export default function HomePage() {
  const [topUpOpen, setTopUpOpen] = useState(false);

  return (
    <div className="space-y-6">
      <GreetingHeader />
      <div className="relative">
        <BalanceCard />
        <button
          type="button"
          onClick={() => setTopUpOpen(true)}
          className="absolute -bottom-3 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E5EA] bg-[#1C1C1E] text-white shadow-md active:scale-95"
          aria-label="Tambah uang lebih"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
      <RecentTransactions />
      <WishlistSection />
      <PoolTopUpSheet open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </div>
  );
}
