"use client";

import { motion } from "framer-motion";
import type { OnboardingStep } from "@/types";

const STEPS: { key: OnboardingStep; label: string }[] = [
  { key: "pairing", label: "Pairing" },
  { key: "profile", label: "Profil" },
  { key: "start-date", label: "Mulai" },
  { key: "target", label: "Target" },
];

function stepIndex(step: OnboardingStep): number {
  const i = STEPS.findIndex((s) => s.key === step);
  return i >= 0 ? i : 0;
}

export function OnboardingShell({
  step,
  title,
  description,
  children,
}: {
  step: OnboardingStep;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const current = stepIndex(step);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5">
      <div className="pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-[13px] font-medium text-[#8E8E93]">Cruell Finance</p>
        <div className="mt-4 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= current ? "bg-[#1C1C1E]" : "bg-[#E5E5EA]"
              }`}
            />
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col py-8"
      >
        <h1 className="text-[26px] font-bold tracking-tight text-[#1C1C1E]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-[16px] leading-relaxed text-[#8E8E93]">
            {description}
          </p>
        )}
        <div className="mt-8 flex-1">{children}</div>
      </motion.div>
    </div>
  );
}
