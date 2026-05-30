import { createClient } from "@/lib/supabase/client";

export type CoupleBroadcastEvent =
  | { type: "paired"; spaceId: string }
  | { type: "disconnected"; spaceId: string };

export function pairingChannelName(spaceId: string) {
  return `couple-${spaceId}`;
}

export function subscribeCoupleChannel(
  spaceId: string,
  onEvent: (event: CoupleBroadcastEvent) => void
) {
  const supabase = createClient();
  const channel = supabase.channel(pairingChannelName(spaceId), {
    config: { broadcast: { self: true } },
  });

  channel
    .on("broadcast", { event: "couple" }, ({ payload }) => {
      const event = payload as CoupleBroadcastEvent;
      if (event?.type) onEvent(event);
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function broadcastCoupleEvent(
  spaceId: string,
  event: CoupleBroadcastEvent
) {
  const supabase = createClient();
  const channel = supabase.channel(pairingChannelName(spaceId), {
    config: { broadcast: { self: true } },
  });

  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel
          .send({
            type: "broadcast",
            event: "couple",
            payload: event,
          })
          .then(() => {
            void supabase.removeChannel(channel);
            resolve();
          })
          .catch(reject);
      }
      if (status === "CHANNEL_ERROR") reject(new Error("Channel error"));
    });
  });
}
