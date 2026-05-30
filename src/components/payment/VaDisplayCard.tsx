"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { VaBankOption } from "@/types";

export function VaDisplayCard({
  bank,
  accountNumber,
  holderName,
  amountLabel,
}: {
  bank: VaBankOption & { accountNumber: string };
  accountNumber: string;
  holderName: string;
  amountLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(accountNumber.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-3xl shadow-lg">
      <div
        className="px-5 py-4 text-white"
        style={{ background: `linear-gradient(135deg, ${bank.color}, ${bank.color}dd)` }}
      >
        <p className="text-[12px] font-medium uppercase tracking-wider opacity-90">
          Virtual Account
        </p>
        <p className="mt-1 text-[22px] font-bold">{bank.label}</p>
      </div>
      <div className="bg-white px-5 py-5">
        <p className="text-[12px] text-[#8E8E93]">Atas nama</p>
        <p className="font-semibold text-[#1C1C1E]">{holderName}</p>
        {amountLabel && (
          <>
            <p className="mt-3 text-[12px] text-[#8E8E93]">Nominal transfer</p>
            <p className="text-[18px] font-bold text-[#1C1C1E]">{amountLabel}</p>
          </>
        )}
        <p className="mt-4 text-[12px] text-[#8E8E93]">Nomor rekening / VA</p>
        <p className="font-mono text-[26px] font-bold tracking-wide text-[#1C1C1E]">
          {accountNumber}
        </p>
        <button
          type="button"
          onClick={copy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1C1C1E] py-3.5 text-[15px] font-semibold text-white"
        >
          {copied ? (
            <>
              <Check className="h-5 w-5" />
              Tersalin!
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" />
              Salin nomor
            </>
          )}
        </button>
      </div>
    </div>
  );
}
