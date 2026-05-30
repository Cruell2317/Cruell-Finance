import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const orderId = payload.order_id as string | undefined;
  const status = payload.transaction_status as string | undefined;

  if (!orderId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (status !== "settlement" && status !== "capture") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const admin = createAdminClient();

  const { data: txs } = await admin
    .from("transactions")
    .select("*")
    .eq("midtrans_order_id", orderId);

  if (!txs?.length) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  if (txs.every((t) => t.status === "settlement")) {
    return NextResponse.json({ ok: true });
  }

  for (const tx of txs) {
    if (!tx.period_id || tx.amount <= 0) continue;
    await admin.rpc("settle_period_payment", {
      p_period_id: tx.period_id,
      p_paid_by: tx.paid_by,
      p_amount: tx.amount,
      p_method: tx.payment_method ?? "QRIS",
      p_order_id: orderId,
    });
  }

  return NextResponse.json({ ok: true });
}
