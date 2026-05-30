import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { formatMonthYear } from "@/lib/month-utils";
import { NextResponse } from "next/server";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthYear = formatMonthYear(month, year);

  const { data: spaces } = await admin
    .from("couple_spaces")
    .select("id")
    .eq("onboarding_complete", true);

  let inserted = 0;

  for (const space of spaces ?? []) {
    const { data: members } = await admin
      .from("users")
      .select("id")
      .eq("couple_space_id", space.id);

    for (const member of members ?? []) {
      for (let week = 1; week <= 4; week++) {
        const due = new Date(year, month - 1, Math.min(week * 7, 28), 23, 59, 59);
        const { error } = await admin.from("savings_periods").insert({
          couple_space_id: space.id,
          user_id: member.id,
          month_year: monthYear,
          week_number: week,
          due_date: due.toISOString(),
        });
        if (!error) inserted += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, monthYear, inserted });
}
