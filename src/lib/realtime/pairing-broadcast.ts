import { createClient } from "@/lib/supabase/client";
import { normalizePairingCode } from "@/lib/pairing";

export const PAIRING_CHANNEL_ID = "pairing";
export const PAIRED_BROADCAST_EVENT = "paired";
export const OPTIMISTIC_PAIRING_KEY = "cruell_optimistic_paired";

export function setOptimisticPaired() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(OPTIMISTIC_PAIRING_KEY, "1");
  }
}

export function clearOptimisticPaired() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(OPTIMISTIC_PAIRING_KEY);
  }
}

export function isOptimisticPaired(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(OPTIMISTIC_PAIRING_KEY) === "1";
}

export type PairingPairedPayload = {
  code: string;
};

/** Langganan broadcast global — creator menunggu kode ini. */
export function subscribePairingBroadcast(onPaired: (code: string) => void) {
  const supabase = createClient();
  const channel = supabase.channel(PAIRING_CHANNEL_ID, {
    config: { broadcast: { self: true } },
  });

  channel
    .on("broadcast", { event: PAIRED_BROADCAST_EVENT }, ({ payload }) => {
      const data = payload as PairingPairedPayload;
      if (data?.code) onPaired(normalizePairingCode(data.code));
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Kirim broadcast ringan — tidak menunggu query DB. */
export function broadcastPairingPaired(code: string): void {
  const normalized = normalizePairingCode(code);
  const supabase = createClient();
  const channel = supabase.channel(PAIRING_CHANNEL_ID, {
    config: { broadcast: { self: true } },
  });

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      void channel.send({
        type: "broadcast",
        event: PAIRED_BROADCAST_EVENT,
        payload: { code: normalized } satisfies PairingPairedPayload,
      });
      window.setTimeout(() => void supabase.removeChannel(channel), 100);
    }
  });
}
