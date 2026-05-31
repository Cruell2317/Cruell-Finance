import { createClient } from "@/lib/supabase/server";
import { simulateBrickSnapBalance } from "@/lib/open-banking";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("couple_space_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.couple_space_id) {
    return NextResponse.json({ error: "Belum pairing" }, { status: 400 });
  }

  const { data: space } = await supabase
    .from("couple_spaces")
    .select("pool_balance")
    .eq("id", profile.couple_space_id)
    .single();

  const poolBalance = Number(space?.pool_balance ?? 0);
  const snapshot = simulateBrickSnapBalance(poolBalance);

  const { error } = await supabase.rpc("sync_open_banking_balance", {
    p_balance: snapshot.balance,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(snapshot);
}
