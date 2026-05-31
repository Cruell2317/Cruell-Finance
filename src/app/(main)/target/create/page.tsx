"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { uploadTargetImage } from "@/lib/storage";
import { formatRupiah } from "@/lib/utils";

export default function CreateTargetPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { addTarget, allocateToTarget, poolBalance } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [allocateAmount, setAllocateAmount] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [createdTargetId, setCreatedTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    try {
      const url = await uploadTargetImage(profile.id, file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    }
  };

  const handleCreate = async () => {
    const parsed = Number(amount.replace(/\D/g, ""));
    if (!name.trim() || !parsed || !profile) {
      setError("Nama dan nominal target wajib diisi");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const id = await addTarget({
        name: name.trim(),
        imageUrl: imageUrl || "/icons/icon-192.png",
        targetAmount: parsed,
        targetDueDate: dueDate || null,
      });
      setCreatedTargetId(id);

      const alloc = Number(allocateAmount.replace(/\D/g, ""));
      if (alloc > 0 && id) {
        await allocateToTarget(id, alloc);
      }
      router.replace(id ? `/target/${id}` : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan target");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex items-center gap-3">
        <Link href="/" className="rounded-full bg-[#F7F7F9] p-2.5" aria-label="Kembali">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-[22px] font-bold text-[#1C1C1E]">Buat Target</h1>
          <p className="text-[13px] text-[#8E8E93]">Halaman Pembuatan Target</p>
        </div>
      </header>

      <Card className="space-y-4 bg-white">
        <div>
          <label className="text-[13px] font-medium text-[#8E8E93]">Nama target</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 outline-none"
            placeholder="Liburan, Nikah, dll."
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-[#8E8E93]">Nominal target (Rp)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 outline-none"
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-[#8E8E93]">Tanggal target</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center rounded-2xl border border-dashed border-[#E5E5EA] py-8"
        >
          {imageUrl ? (
            <div className="relative h-32 w-32">
              <Image src={imageUrl} alt="" fill className="rounded-xl object-cover" unoptimized />
            </div>
          ) : (
            <span className="text-[14px] text-[#8E8E93]">Tap — pilih dari galeri HP</span>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
      </Card>

      <Card className="space-y-3 bg-[#F7F7F9]">
        <p className="text-[14px] font-semibold text-[#1C1C1E]">Alokasi dari saldo bank</p>
        <p className="text-[13px] text-[#8E8E93]">
          Saldo pool tersedia: {formatRupiah(poolBalance)}
        </p>
        <input
          value={allocateAmount}
          onChange={(e) => setAllocateAmount(e.target.value)}
          inputMode="numeric"
          placeholder="Nominal alokasi (opsional)"
          className="w-full rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3.5 outline-none"
        />
      </Card>

      {error && (
        <p className="rounded-xl bg-[#FF3B30]/10 px-4 py-3 text-center text-[14px] text-[#FF3B30]">
          {error}
        </p>
      )}

      <Button fullWidth variant="dark" onClick={() => void handleCreate()} disabled={loading}>
        {loading ? "Menyimpan..." : "Simpan Target"}
      </Button>
    </div>
  );
}
