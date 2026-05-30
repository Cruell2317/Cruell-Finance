import { createClient } from "@/lib/supabase/server";
import { getPeriodAmount } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periodIds = new URL(request.url).searchParams
    .get("periodIds")
    ?.split(",")
    .filter(Boolean);

  if (!periodIds?.length) {
    return NextResponse.json({ error: "periodIds required" }, { status: 400 });
  }

  const { data: periods } = await supabase
    .from("savings_periods")
    .select("base_amount, penalty_amount")
    .in("id", periodIds)
    .eq("user_id", user.id);

  const amount = (periods ?? []).reduce(
    (sum, p) =>
      sum +
      getPeriodAmount({
        baseAmount: p.base_amount,
        penaltyAmount: p.penalty_amount,
      }),
    0
  );

  return NextResponse.json({ amount, count: periods?.length ?? 0 });
}
