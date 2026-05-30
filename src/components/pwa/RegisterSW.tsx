"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            worker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    };

    register().catch((err) => console.warn("SW registration failed:", err));
  }, []);

  return null;
}
