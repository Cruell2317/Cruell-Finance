"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/onboarding/pairing");
  }, [router]);
  return null;
}
