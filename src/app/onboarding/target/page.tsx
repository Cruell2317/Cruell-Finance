"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyTargetRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/target/create");
  }, [router]);
  return null;
}
