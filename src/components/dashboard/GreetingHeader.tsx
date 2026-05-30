"use client";

import { useAuth } from "@/context/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";

export function GreetingHeader() {
  const { profile } = useAuth();

  return (
    <AppHeader
      subtitle="Cruell Finance"
      title={`Haloow ${profile?.displayName ?? "..."}`}
    />
  );
}
