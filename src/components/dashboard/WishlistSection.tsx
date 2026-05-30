"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { uploadTargetImage } from "@/lib/storage";
import { formatRupiah } from "@/lib/utils";

export function WishlistSection() {
  const { profile } = useAuth();
  const { targets, addTarget } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    const url = await uploadTargetImage(profile.id, file);
    setImageUrl(url);
  };

  const handleAdd = async () => {
    const parsed = Number(amount.replace(/\D/g, ""));
    if (!name.trim() || !parsed || !profile) return;
    setLoading(true);
    try {
      await addTarget({
        name: name.trim(),
        imageUrl:
          imageUrl ||
          "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop",
        targetAmount: parsed,
      });
      setName("");
      setAmount("");
      setImageUrl("");
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#8E8E93]" />
          <h2 className="text-[18px] font-bold">Target Tabungan</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E5EA] bg-[#F7F7F9]"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <Card className="space-y-3 bg-white">
              <input
                placeholder="Nama target"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3 outline-none"
              />
              <input
                placeholder="Nominal (Rp)"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3 outline-none"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-[#E5E5EA] py-3 text-[14px] text-[#8E8E93]"
              >
                {imageUrl ? "Gambar terpilih ✓" : "Pilih dari galeri HP"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              <Button fullWidth variant="dark" onClick={handleAdd} disabled={loading}>
                {loading ? "Menyimpan..." : "Tambah Target"}
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {targets.length === 0 ? (
        <Card className="bg-white py-8 text-center text-[15px] text-[#8E8E93]">
          Belum ada target
        </Card>
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
                    <Image src={target.imageUrl} alt={target.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold">{target.name}</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E5EA]">
                      <div className="h-full rounded-full bg-[#1C1C1E]" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-[13px] text-[#8E8E93]">
                      {formatRupiah(target.collectedAmount)} / {formatRupiah(target.targetAmount)}
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
