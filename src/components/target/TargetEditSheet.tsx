"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { uploadTargetImage } from "@/lib/storage";
import type { SavingsTarget } from "@/types";

export function TargetEditSheet({
  target,
  open,
  onClose,
}: {
  target: SavingsTarget;
  open: boolean;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const { updateTarget } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(target.name);
  const [amount, setAmount] = useState(String(target.targetAmount));
  const [imageUrl, setImageUrl] = useState(target.imageUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(target.name);
      setAmount(String(target.targetAmount));
      setImageUrl(target.imageUrl);
      setError("");
    }
  }, [open, target]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setLoading(true);
    try {
      const url = await uploadTargetImage(profile.id, file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const parsed = Number(amount.replace(/\D/g, ""));
    if (!name.trim() || !parsed) return;
    setLoading(true);
    setError("");
    try {
      await updateTarget(target.id, {
        name: name.trim(),
        imageUrl,
        targetAmount: parsed,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E5E5EA]" />
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold">Edit Target</h2>
              <button type="button" onClick={onClose} className="rounded-full bg-[#F7F7F9] p-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative mx-auto mt-4 block h-32 w-full overflow-hidden rounded-2xl bg-[#F7F7F9]"
            >
              {imageUrl && (
                <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama target"
              className="mt-4 w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 outline-none"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              placeholder="Nominal target (Rp)"
              className="mt-3 w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 outline-none"
            />

            {error && <p className="mt-3 text-[14px] text-[#FF3B30]">{error}</p>}

            <Button fullWidth variant="dark" className="mt-6" onClick={handleSave} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
