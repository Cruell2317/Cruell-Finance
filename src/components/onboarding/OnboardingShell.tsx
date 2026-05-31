"use client";

import type { OnboardingStep } from "@/types";
import type { ReactNode } from "react";

const STEPS: { key: OnboardingStep; label: string }[] = [
  { key: "pairing", label: "Pairing" },
  { key: "complete", label: "Dashboard" },
];

export function OnboardingShell({
  step,
  title,
  description,
  children,
}: {
  step: OnboardingStep;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white px-6 pb-8 pt-10">
      <div className="mb-8 flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-1 flex-1 rounded-full ${
              i <= currentIndex ? "bg-[#1C1C1E]" : "bg-[#E5E5EA]"
            }`}
          />
        ))}
      </div>
      <h1 className="text-[26px] font-bold text-[#1C1C1E]">{title}</h1>
      {description && (
        <p className="mt-2 text-[15px] text-[#8E8E93]">{description}</p>
      )}
      <div className="mt-8">{children}</div>
    </div>
  );
}
