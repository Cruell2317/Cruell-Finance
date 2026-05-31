"use client";

import { Plus, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppContext";
import { formatRupiah } from "@/lib/utils";

export function WishlistSection() {
  const { targets } = useApp();

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#8E8E93]" />
          <h2 className="text-[18px] font-bold">Target Milestone</h2>
        </div>
        <Link
          href="/target/create"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E5EA] bg-[#F7F7F9]"
          aria-label="Buat target"
        >
          <Plus className="h-5 w-5" />
        </Link>
      </div>

      {targets.length === 0 ? (
        <Link href="/target/create">
          <Card className="bg-white py-8 text-center text-[15px] text-[#8E8E93]">
            Tap + untuk Halaman Pembuatan Target
          </Card>
        </Link>
      ) : (
        <div className="space-y-3">
          {targets.map((target) => {
            const pct = Math.min(
              (target.collectedAmount / target.targetAmount) * 100,
              100
            );
            return (
              <Link key={target.id} href={`/target/${target.id}`}>
                <Card className="overflow-hidden bg-white p-0">
                  <div className="relative h-28 w-full">
                    <Image
                      src={target.imageUrl}
                      alt={target.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold">{target.name}</p>
                    {target.targetDueDate && (
                      <p className="text-[12px] text-[#8E8E93]">
                        Target: {target.targetDueDate}
                      </p>
                    )}
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E5EA]">
                      <div
                        className="h-full rounded-full bg-[#1C1C1E]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[13px] text-[#8E8E93]">
                      {formatRupiah(target.collectedAmount)} /{" "}
                      {formatRupiah(target.targetAmount)}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
