"use client";

import Image from "next/image";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TargetEditSheet } from "@/components/target/TargetEditSheet";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatRupiah } from "@/lib/utils";

export default function TargetDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { targets, allocations, poolBalance, allocateToTarget, deleteTarget } =
    useApp();
  const target = targets.find((t) => t.id === id);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (!target) {
    return <p className="py-12 text-center text-[#8E8E93]">Target tidak ditemukan</p>;
  }

  const pct = Math.min((target.collectedAmount / target.targetAmount) * 100, 100);
  const history = allocations.filter((a) => a.targetId === target.id);
  const isMine = target.createdBy === profile?.id;

  const handleAllocate = async () => {
    const parsed = Number(amount.replace(/\D/g, ""));
    if (!parsed) return;
    setLoading(true);
    try {
      await allocateToTarget(target.id, parsed);
      setAmount("");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Hapus target ini?")) return;
    await deleteTarget(target.id);
    router.push("/");
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-[15px] text-[#8E8E93]">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        {isMine && (
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1 rounded-full bg-[#F7F7F9] px-3 py-1.5 text-[14px] font-medium"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>

      <div className="relative h-44 w-full overflow-hidden rounded-3xl">
        <Image src={target.imageUrl} alt={target.name} fill className="object-cover" unoptimized />
      </div>

      <h1 className="mt-4 text-[24px] font-bold text-[#1C1C1E]">{target.name}</h1>
      <p className="text-[14px] text-[#8E8E93]">
        Dikelola oleh {target.createdByName}
        {isMine ? " (Aku)" : " (Partner)"}
      </p>

      <div className="mt-6 rounded-2xl bg-[#F7F7F9] p-5">
        <p className="text-[28px] font-bold text-[#1C1C1E]">
          {formatRupiah(target.collectedAmount)}
        </p>
        <p className="text-[15px] text-[#8E8E93]">
          dari {formatRupiah(target.targetAmount)} · {pct.toFixed(0)}%
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#E5E5EA]">
          <div className="h-full rounded-full bg-[#1C1C1E]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#E5E5EA] bg-white p-4">
        <p className="text-[14px] text-[#8E8E93]">
          Pool tersedia: {formatRupiah(poolBalance)}
        </p>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          placeholder="Nominal alokasi"
          className="mt-3 w-full rounded-xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3 outline-none focus:border-[#8E8E93]"
        />
        <Button fullWidth variant="dark" className="mt-3" onClick={handleAllocate} disabled={loading}>
          Alokasikan ke Target
        </Button>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-[18px] font-bold">Histori Alokasi</h2>
        {history.length === 0 ? (
          <p className="text-[14px] text-[#8E8E93]">Belum ada alokasi</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex justify-between rounded-xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3 text-[14px]"
              >
                <div>
                  <p className="font-semibold text-[#1C1C1E]">{h.allocatedByName}</p>
                  <p className="text-[#8E8E93]">{formatDate(h.createdAt)}</p>
                </div>
                <p className="font-bold text-[#34C759]">{formatRupiah(h.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {isMine && (
        <Button fullWidth variant="secondary" className="mt-8" onClick={handleDelete}>
          Hapus Target
        </Button>
      )}

      <TargetEditSheet target={target} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
