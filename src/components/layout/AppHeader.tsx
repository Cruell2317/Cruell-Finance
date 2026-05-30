"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showProfile?: boolean;
}

export function AppHeader({
  title,
  subtitle,
  showProfile = true,
}: AppHeaderProps) {
  const { profile } = useAuth();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        {subtitle && (
          <p className="text-[13px] font-medium text-[#8E8E93]">{subtitle}</p>
        )}
        {title && (
          <h1 className="truncate text-[22px] font-bold tracking-tight text-[#1C1C1E]">
            {title}
          </h1>
        )}
      </div>
      {showProfile && profile && (
        <Link
          href="/profil"
          className="shrink-0 overflow-hidden rounded-full ring-2 ring-[#E5E5EA]"
        >
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.displayName}
              width={40}
              height={40}
              className="h-10 w-10 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center bg-[#E5E5EA] text-[15px] font-bold text-[#1C1C1E]">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      )}
    </div>
  );
}
