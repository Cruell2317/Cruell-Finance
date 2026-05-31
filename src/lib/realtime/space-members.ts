import { createClient } from "@/lib/supabase/client";

/** Creator menunggu: dengar perubahan anggota di ruang ini (postgres_changes). */
export function subscribeSpaceMemberChanges(
  spaceId: string,
  onChange: () => void
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`space-members-${spaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "users",
        filter: `couple_space_id=eq.${spaceId}`,
      },
      () => onChange()
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "couple_spaces",
        filter: `id=eq.${spaceId}`,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
