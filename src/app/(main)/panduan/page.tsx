"use client";

import { ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-4 text-left"
      >
        <span className="font-semibold text-[#1C1C1E]">{title}</span>
        <ChevronDown
          className={`h-5 w-5 text-[#8E8E93] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-[#E5E5EA] px-4 pb-4 text-[15px] leading-relaxed text-[#3C3C43]">
          {children}
        </div>
      )}
    </div>
  );
}

export default function PanduanPage() {
  return (
    <div className="pb-8">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/profil" className="rounded-full bg-[#F7F7F9] p-2.5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-[20px] font-bold">Panduan</h1>
          <p className="text-[13px] text-[#8E8E93]">Aktivasi & pasang di HP</p>
        </div>
      </header>

      <div className="space-y-3">
        <Section title="1. Aktifkan Supabase (backend)" defaultOpen>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Buat project di{" "}
              <a
                href="https://supabase.com"
                className="font-medium underline"
                target="_blank"
                rel="noreferrer"
              >
                supabase.com
              </a>
              .
            </li>
            <li>
              Di <strong>SQL Editor</strong>, jalankan berurutan file di folder{" "}
              <code className="rounded bg-[#F7F7F9] px-1">supabase/schema.sql</code>
              , lalu migration{" "}
              <code className="rounded bg-[#F7F7F9] px-1">002</code> dan{" "}
              <code className="rounded bg-[#F7F7F9] px-1">003</code>.
            </li>
            <li>
              <strong>Authentication → Providers</strong>: aktifkan Google, isi
              Client ID & Secret dari Google Cloud Console.
            </li>
            <li>
              <strong>Authentication → URL Configuration</strong>: tambahkan
              redirect{" "}
              <code className="rounded bg-[#F7F7F9] px-1 text-[13px]">
                https://domain-kamu.com/auth/callback
              </code>{" "}
              (lokal:{" "}
              <code className="rounded bg-[#F7F7F9] px-1 text-[13px]">
                http://localhost:3000/auth/callback
              </code>
              ).
            </li>
            <li>
              Salin <strong>Project URL</strong> dan <strong>anon key</strong> ke
              file <code className="rounded bg-[#F7F7F9] px-1">.env.local</code>{" "}
              (lihat <code className="rounded bg-[#F7F7F9] px-1">.env.example</code>
              ).
            </li>
            <li>Deploy ke Vercel / host lain, set env yang sama di dashboard host.</li>
          </ol>
        </Section>

        <Section title="2. Atur QRIS & nomor VA">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Login → selesaikan onboarding (pairing, profil, time machine).</li>
            <li>
              Buka <strong>Profil → Pengaturan Pembayaran</strong> (
              <code className="rounded bg-[#F7F7F9] px-1">/settings/pembayaran</code>
              ).
            </li>
            <li>Upload gambar QRIS dari bank / GoPay / OVO / dll.</li>
            <li>Isi nomor VA/rekening per bank (BCA, BNI, BRI, dll).</li>
            <li>Simpan. Pasangan langsung lihat di halaman Checkout.</li>
          </ol>
          <p className="mt-3 rounded-xl bg-[#F7F7F9] p-3 text-[14px]">
            Alur bayar: pilih tagihan → scan QR / transfer VA → tap{" "}
            <strong>Saya sudah transfer</strong> → partner tap{" "}
            <strong>Konfirmasi pembayaran</strong> di Tagihan.
          </p>
        </Section>

        <Section title="3. Pasang di Android (Samsung, dll.)">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Buka situs Cruell Finance di <strong>Chrome</strong>.</li>
            <li>Login seperti biasa.</li>
            <li>
              Tap menu <strong>⋮</strong> → <strong>Tambahkan ke Layar utama</strong>{" "}
              atau <strong>Install app</strong>.
            </li>
            <li>Konfirmasi — ikon muncul di home screen seperti aplikasi.</li>
          </ol>
          <p className="mt-2 text-[14px] text-[#8E8E93]">
            Jika muncul banner &quot;Pasang di HP&quot; di bawah, tap{" "}
            <strong>Pasang sekarang</strong>.
          </p>
        </Section>

        <Section title="4. Pasang di iPhone (Safari)">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Buka situs di <strong>Safari</strong> (bukan Chrome di iOS untuk PWA).</li>
            <li>Tap ikon <strong>Share</strong> (kotak + panah).</li>
            <li>
              Scroll → <strong>Add to Home Screen</strong> /{" "}
              <strong>Tambah ke Layar Utama</strong>.
            </li>
            <li>Tap <strong>Add</strong> — buka dari ikon di home screen.</li>
          </ol>
        </Section>

        <Section title="5. Midtrans (opsional, otomatis)">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Daftar di Midtrans, ambil Server Key & Client Key.</li>
            <li>Isi di <code className="rounded bg-[#F7F7F9] px-1">.env</code>.</li>
            <li>
              Centang <strong>Aktifkan Midtrans</strong> di pengaturan pembayaran.
            </li>
            <li>
              Webhook URL:{" "}
              <code className="rounded bg-[#F7F7F9] px-1 text-[12px] break-all">
                https://domain-kamu.com/api/payments/webhook
              </code>
            </li>
          </ol>
        </Section>

        <Section title="6. Cron tagihan & denda">
          <p>
            Set URL cron harian ke{" "}
            <code className="rounded bg-[#F7F7F9] px-1 text-[13px]">
              /api/cron/generate-periods
            </code>{" "}
            dan{" "}
            <code className="rounded bg-[#F7F7F9] px-1 text-[13px]">
              /api/cron/apply-penalties
            </code>{" "}
            dengan header <code className="rounded bg-[#F7F7F9] px-1">Authorization: Bearer CRON_SECRET</code>.
          </p>
        </Section>
      </div>
    </div>
  );
}
