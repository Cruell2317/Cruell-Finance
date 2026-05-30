"use client";

import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatRupiah, getPeriodAmount } from "@/lib/utils";
import { uploadAvatar } from "@/lib/storage";
import { BookOpen, Camera, CreditCard, Heart, LogOut, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function ProfileContent() {
  const router = useRouter();
  const { profile, signOut, updateProfile } = useAuth();
  const { periods, currentMonth, members: appMembers } = useApp();
  const { members, disconnectCoupleSpace } = useOnboarding();
  const fileRef = useRef<HTMLInputElement>(null);

  const [showDisconnect, setShowDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!profile) return null;

  const allMembers = appMembers.length ? appMembers : members;
  const partner = allMembers.find((m) => m.userId !== profile.id);
  const isCreator = profile.role === "CREATOR" || profile.isSpaceCreator;

  const myPeriods = periods.filter((p) => p.userId === profile.id);
  const monthlyPeriods = myPeriods.filter((p) => p.monthYear === currentMonth);
  const paid = myPeriods.filter((p) => p.status === "PAID").length;
  const totalSaved = myPeriods
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + getPeriodAmount(p), 0);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const url = await uploadAvatar(profile.id, file);
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await updateProfile(displayName.trim(), avatarUrl || null);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError("");
    try {
      await disconnectCoupleSpace();
      setShowDisconnect(false);
      router.replace("/onboarding/pairing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memutus hubungan");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/splash");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white text-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#E5E5EA]"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <span className="text-2xl font-bold">{profile.displayName.charAt(0) || "?"}</span>
          )}
          <span className="absolute bottom-0 right-0 rounded-full bg-[#1C1C1E] p-1.5 text-white">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleAvatar(e)}
        />
        {editing ? (
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-3 w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-center text-[18px] font-bold"
          />
        ) : (
          <p className="mt-3 text-[20px] font-bold">{profile.displayName}</p>
        )}
        <p className="text-[14px] text-[#8E8E93]">{profile.email}</p>
        <p className="mt-1 text-[13px] text-[#8E8E93]">
          Peran: {isCreator ? "Space Administrator (CREATOR)" : "Partner (JOINER)"}
        </p>
        {profile.savingStreak > 0 && (
          <p className="mt-2 text-[14px] font-medium text-[#34C759]">
            Streak menabung {profile.savingStreak} minggu berturut-turut
          </p>
        )}
        <div className="mt-4 flex gap-2">
          {editing ? (
            <>
              <Button variant="dark" className="flex-1" onClick={() => void handleSaveProfile()} disabled={saving}>
                Simpan
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)}>
                Batal
              </Button>
            </>
          ) : (
            <Button variant="secondary" fullWidth onClick={() => setEditing(true)}>
              Edit Profil
            </Button>
          )}
        </div>
      </Card>

      {partner && profile.coupleSpaceId && (
        <button
          type="button"
          onClick={() => setShowDisconnect(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-4 text-left active:bg-[#E5E5EA]"
        >
          <Heart className="h-5 w-5 text-[#FF3B30]" />
          <div className="flex-1">
            <p className="text-[13px] text-[#8E8E93]">Status hubungan</p>
            <p className="font-semibold text-[#1C1C1E]">
              Terhubung dengan {partner.displayName}
            </p>
          </div>
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white py-3 text-center">
          <p className="text-[12px] text-[#8E8E93]">Total Menabung</p>
          <p className="mt-1 font-bold">{formatRupiah(totalSaved)}</p>
        </Card>
        <Card className="bg-white py-3 text-center">
          <p className="text-[12px] text-[#8E8E93]">Minggu Lunas</p>
          <p className="mt-1 font-bold">{paid}</p>
        </Card>
      </div>

      <section className="space-y-2">
        <h2 className="text-[18px] font-bold">Pengaturan</h2>
        {isCreator ? (
          <Link
            href="/settings/pembayaran"
            className="flex items-center gap-3 rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3.5"
          >
            <CreditCard className="h-5 w-5 text-[#1C1C1E]" />
            <div>
              <p className="font-semibold">QRIS & Virtual Account</p>
              <p className="text-[13px] text-[#8E8E93]">Upload QR & nomor rekening (Admin)</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 opacity-80">
            <CreditCard className="h-5 w-5 text-[#8E8E93]" />
            <div>
              <p className="font-semibold text-[#8E8E93]">QRIS & VA</p>
              <p className="text-[13px] text-[#8E8E93]">Hanya dapat dilihat saat checkout</p>
            </div>
          </div>
        )}
        <Link
          href="/panduan"
          className="flex items-center gap-3 rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3.5"
        >
          <BookOpen className="h-5 w-5 text-[#1C1C1E]" />
          <div>
            <p className="font-semibold">Panduan</p>
            <p className="text-[13px] text-[#8E8E93]">Supabase, pasang di HP</p>
          </div>
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-[18px] font-bold">Pasangan</h2>
        <div className="flex gap-3">
          {allMembers.map((m) => (
            <Card key={m.userId} className="flex-1 bg-white py-3 text-center">
              <p className="font-semibold">{m.displayName}</p>
              <p className="mt-1 text-[12px] text-[#8E8E93]">
                {m.role === "CREATOR" ? "Administrator" : "Partner"}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[18px] font-bold">Catatan {currentMonth}</h2>
        {monthlyPeriods.length === 0 ? (
          <p className="text-[14px] text-[#8E8E93]">Belum ada tagihan bulan ini</p>
        ) : (
          <div className="space-y-2">
            {monthlyPeriods.map((p) => (
              <Card key={p.id} className="flex items-center justify-between bg-white py-3">
                <span className="font-medium">Minggu {p.weekNumber}</span>
                <StatusBadge status={p.status} />
              </Card>
            ))}
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-xl bg-[#FF3B30]/10 px-4 py-3 text-center text-[14px] text-[#FF3B30]">
          {error}
        </p>
      )}

      <Button variant="secondary" fullWidth onClick={() => void handleSignOut()} className="gap-2">
        <LogOut className="h-5 w-5" />
        Keluar
      </Button>

      {showDisconnect && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-[20px] font-bold">Putus Hubungan Akun?</h3>
              <button type="button" onClick={() => setShowDisconnect(false)} className="rounded-full bg-[#F7F7F9] p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-[15px] text-[#8E8E93]">
              Kedua akun akan terputus, wishlist dihapus, dan Anda kembali ke layar pairing.
              Pasangan juga akan dialihkan secara realtime.
            </p>
            <Button
              fullWidth
              variant="dark"
              className="mt-6 bg-[#FF3B30] hover:bg-[#FF3B30]"
              onClick={() => void handleDisconnect()}
              disabled={disconnecting}
            >
              {disconnecting ? "Memutus..." : "Putus Hubungan Akun"}
            </Button>
            <Button
              fullWidth
              variant="secondary"
              className="mt-2"
              onClick={() => setShowDisconnect(false)}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
