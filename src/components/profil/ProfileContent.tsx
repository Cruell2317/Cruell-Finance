"use client";

import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatRupiah, getPeriodAmount } from "@/lib/utils";
import { BookOpen, CreditCard, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ProfileContent() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { periods, currentMonth, members: appMembers } = useApp();
  const { members } = useOnboarding();

  if (!profile) return null;

  const myPeriods = periods.filter((p) => p.userId === profile.id);
  const monthlyPeriods = myPeriods.filter((p) => p.monthYear === currentMonth);
  const paid = myPeriods.filter((p) => p.status === "PAID").length;
  const totalSaved = myPeriods
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + getPeriodAmount(p), 0);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/splash");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E5E5EA] text-2xl font-bold">
          {profile.displayName.charAt(0) || "?"}
        </div>
        <p className="mt-3 text-[20px] font-bold">{profile.displayName}</p>
        <p className="text-[14px] text-[#8E8E93]">{profile.email}</p>
        {profile.savingStreak > 0 && (
          <p className="mt-2 text-[14px] font-medium text-emerald-600">
            Streak menabung {profile.savingStreak} minggu berturut-turut
          </p>
        )}
      </Card>

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
        <Link
          href="/settings/pembayaran"
          className="flex items-center gap-3 rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3.5"
        >
          <CreditCard className="h-5 w-5 text-[#1C1C1E]" />
          <div>
            <p className="font-semibold">QRIS & Virtual Account</p>
            <p className="text-[13px] text-[#8E8E93]">Upload QR & nomor rekening</p>
          </div>
        </Link>
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
          {(appMembers.length ? appMembers : members).map((m) => (
            <Card key={m.userId} className="flex-1 bg-white py-3 text-center">
              <p className="font-semibold">{m.displayName}</p>
              {"savingStreak" in m && m.savingStreak > 0 && (
                <p className="mt-1 text-[12px] text-[#8E8E93]">
                  Streak {m.savingStreak} minggu
                </p>
              )}
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
              <Card
                key={p.id}
                className="flex items-center justify-between bg-white py-3"
              >
                <span className="font-medium">Minggu {p.weekNumber}</span>
                <div className="text-right">
                  <StatusBadge status={p.status} />
                  <p className="mt-1 text-[14px] font-bold">
                    {formatRupiah(getPeriodAmount(p))}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Button variant="secondary" fullWidth onClick={handleSignOut} className="gap-2">
        <LogOut className="h-5 w-5" />
        Keluar
      </Button>
    </div>
  );
}
