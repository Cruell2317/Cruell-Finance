import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { NextResponse } from "next/server";

const PENALTY = 5000;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: lateCandidates, error } = await admin
    .from("savings_periods")
    .select("id, penalty_amount")
    .eq("status", "UNPAID")
    .lt("due_date", now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let updated = 0;
  for (const row of lateCandidates ?? []) {
    const { error: uErr } = await admin
      .from("savings_periods")
      .update({
        status: "LATE",
        penalty_amount: row.penalty_amount > 0 ? row.penalty_amount : PENALTY,
      })
      .eq("id", row.id);
    if (!uErr) updated += 1;
  }

  return NextResponse.json({ ok: true, updated });
}
