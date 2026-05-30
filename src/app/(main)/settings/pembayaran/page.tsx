"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ImagePlus, Save } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { VA_BANK_OPTIONS } from "@/lib/payment-banks";
import { uploadPaymentQris } from "@/lib/storage";
import type { PaymentSettings } from "@/types";

export default function PaymentSettingsPage() {
  const { profile } = useAuth();
  const { paymentSettings, savePaymentSettings, coupleSpace } = useApp();
  const isCreator = profile?.role === "CREATOR" || profile?.isSpaceCreator;
  const [form, setForm] = useState<PaymentSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (paymentSettings) setForm({ ...paymentSettings });
  }, [paymentSettings]);

  if (!form || !coupleSpace) {
    return (
      <p className="py-12 text-center text-[#8E8E93]">Memuat pengaturan...</p>
    );
  }

  if (!isCreator) {
    return (
      <div className="py-12 text-center">
        <p className="text-[16px] font-semibold text-[#1C1C1E]">Akses terbatas</p>
        <p className="mt-2 px-6 text-[14px] text-[#8E8E93]">
          Hanya Space Administrator yang dapat mengubah QRIS dan nomor VA.
          Anda dapat melihatnya saat checkout.
        </p>
        <Link href="/profil" className="mt-6 inline-block text-[15px] font-medium underline">
          Kembali ke Profil
        </Link>
      </div>
    );
  }

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadPaymentQris(coupleSpace.id, file);
      setForm((f) => (f ? { ...f, qrisImageUrl: url } : f));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await savePaymentSettings(form);
      setMessage("Pengaturan pembayaran tersimpan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/profil"
          className="rounded-full bg-[#F7F7F9] p-2.5"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-[20px] font-bold">Pembayaran</h1>
          <p className="text-[13px] text-[#8E8E93]">QRIS & nomor VA pasangan</p>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <section className="rounded-2xl border border-[#E5E5EA] p-4">
          <p className="font-semibold">Gambar QRIS</p>
          <p className="mt-1 text-[13px] text-[#8E8E93]">
            Upload screenshot QR dari bank / e-wallet kamu
          </p>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5E5EA] bg-[#F7F7F9] py-8">
            {form.qrisImageUrl ? (
              <div className="relative h-48 w-48">
                <Image
                  src={form.qrisImageUrl}
                  alt="QRIS"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <>
                <ImagePlus className="h-10 w-10 text-[#8E8E93]" />
                <span className="mt-2 text-[14px] font-medium text-[#8E8E93]">
                  {uploading ? "Mengupload..." : "Tap untuk upload QR"}
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={handleQrisUpload}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-[#E5E5EA] p-4">
          <p className="font-semibold">Atas nama rekening</p>
          <input
            type="text"
            value={form.accountHolderName}
            onChange={(e) =>
              setForm({ ...form, accountHolderName: e.target.value })
            }
            className="mt-2 w-full rounded-xl border border-[#E5E5EA] px-4 py-3 text-[16px]"
            placeholder="Nama di rekening"
          />
        </section>

        <section className="space-y-3 rounded-2xl border border-[#E5E5EA] p-4">
          <p className="font-semibold">Nomor Virtual Account / Rekening</p>
          <p className="text-[13px] text-[#8E8E93]">
            Isi bank yang dipakai. Kosongkan yang tidak dipakai.
          </p>
          {VA_BANK_OPTIONS.map((bank) => (
            <div key={bank.key}>
              <label className="text-[13px] font-medium text-[#8E8E93]">
                {bank.label}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form[bank.key] ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [bank.key]: e.target.value.replace(/\s/g, "") || null,
                  })
                }
                className="mt-1 w-full rounded-xl border border-[#E5E5EA] px-4 py-3 font-mono text-[16px]"
                placeholder={`Nomor ${bank.label}`}
              />
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-[#E5E5EA] p-4">
          <p className="font-semibold">Instruksi untuk pasangan</p>
          <textarea
            value={form.paymentInstructions}
            onChange={(e) =>
              setForm({ ...form, paymentInstructions: e.target.value })
            }
            rows={3}
            className="mt-2 w-full rounded-xl border border-[#E5E5EA] px-4 py-3 text-[15px]"
          />
        </section>

        <label className="flex items-center gap-3 rounded-2xl border border-[#E5E5EA] p-4">
          <input
            type="checkbox"
            checked={form.useMidtrans}
            onChange={(e) => setForm({ ...form, useMidtrans: e.target.checked })}
            className="h-5 w-5"
          />
          <div>
            <p className="font-semibold">Aktifkan Midtrans (otomatis)</p>
            <p className="text-[13px] text-[#8E8E93]">
              Opsional. QR/VA manual tetap bisa dipakai bersamaan.
            </p>
          </div>
        </label>

        {error && (
          <p className="rounded-xl bg-[#FF3B30]/10 px-4 py-3 text-[14px] text-[#FF3B30]">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800">
            {message}
          </p>
        )}

        <Button
          fullWidth
          variant="dark"
          className="gap-2"
          disabled={saving}
          onClick={handleSave}
        >
          <Save className="h-5 w-5" />
          {saving ? "Menyimpan..." : "Simpan pengaturan"}
        </Button>

        <Link
          href="/panduan"
          className="block text-center text-[14px] font-medium text-[#8E8E93] underline"
        >
          Baca panduan aktivasi & pasang di HP
        </Link>
      </motion.div>
    </div>
  );
}
