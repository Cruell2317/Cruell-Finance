"use client";

import { useEffect } from "react";

/** SW lama merusak OAuth — hapus semua registrasi, jangan daftar ulang dulu. */
export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => void reg.unregister());
    });
  }, []);

  return null;
}
