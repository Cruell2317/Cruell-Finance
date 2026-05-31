"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyStartDateRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/onboarding/pairing");
  }, [router]);
  return null;
}
