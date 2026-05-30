"use client";

import Image from "next/image";
import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { uploadAvatar } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { getOnboardingPath } from "@/lib/onboarding-routes";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { completeProfileSetup } = useOnboarding();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(
    profile?.displayName || profile?.fullName || ""
  );
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setLoading(true);
    setError("");
    try {
      const url = await uploadAvatar(profile.id, file);
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await completeProfileSetup(displayName.trim(), avatarUrl || null);
      router.push(getOnboardingPath("start-date"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingShell
      step="profile"
      title="Setup Profil"
      description="Nama panggilan dipakai di seluruh aplikasi (mis. Dikelola oleh Cioo)."
    >
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-[#E5E5EA]"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profil" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#F7F7F9] text-3xl font-bold text-[#8E8E93]">
              ?
            </div>
          )}
          <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#1C1C1E] text-white">
            <Camera className="h-4 w-4" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFile}
        />
        <p className="mt-3 text-[14px] text-[#8E8E93]">Upload ke Supabase Storage</p>
      </div>

      <label className="mt-8 block">
        <span className="text-[14px] font-medium text-[#8E8E93]">Nama Panggilan</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-[#E5E5EA] bg-[#F7F7F9] px-4 py-3.5 text-[17px] outline-none focus:border-[#8E8E93]"
        />
      </label>

      {error && <p className="mt-3 text-[14px] text-[#FF3B30]">{error}</p>}

      <Button
        fullWidth
        variant="dark"
        className="mt-8"
        onClick={handleSubmit}
        disabled={loading || !displayName.trim()}
      >
        {loading ? "Menyimpan..." : "Lanjut"}
      </Button>
    </OnboardingShell>
  );
}
