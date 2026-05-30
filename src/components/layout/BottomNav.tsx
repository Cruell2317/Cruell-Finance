"use client";

import { motion } from "framer-motion";
import { Home, User, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/tagihan", label: "Tagihan", icon: Wallet },
  { href: "/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-[#E5E5EA] bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around px-2 pt-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-2 inset-y-1 rounded-xl bg-[#F7F7F9]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className={`relative z-10 h-6 w-6 ${active ? "text-[#1C1C1E]" : "text-[#8E8E93]"}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={`relative z-10 text-[10px] font-medium ${active ? "text-[#1C1C1E]" : "text-[#8E8E93]"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
