"use client";

import { useAuth } from "@/context/AuthContext";

export function ConfigGuard({ children }: { children: React.ReactNode }) {
  const { configReady } = useAuth();

  if (!configReady) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-[22px] font-bold text-[#1C1C1E]">Konfigurasi Diperlukan</h1>
        <p className="mt-3 text-[15px] text-[#8E8E93]">
          Set variabel lingkungan Supabase di file{" "}
          <code className="rounded bg-[#F7F7F9] px-1">.env.local</code> sesuai{" "}
          <code className="rounded bg-[#F7F7F9] px-1">.env.example</code>, lalu
          jalankan ulang aplikasi.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
