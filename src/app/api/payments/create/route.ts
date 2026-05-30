import { createClient } from "@/lib/supabase/server";
import {
  chargeQris,
  chargeVirtualAccount,
  extractQrisUrl,
  extractVirtualAccount,
  type VaBank,
} from "@/lib/midtrans";
import { getPeriodAmount } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const periodIds: string[] = body.periodIds ?? [];
  const paymentMethod: "qris" | "va" = body.paymentMethod === "va" ? "va" : "qris";
  const bank: VaBank = body.bank ?? "bca";

  if (!periodIds.length) {
    return NextResponse.json({ error: "No periods" }, { status: 400 });
  }

  const { data: periods, error: pErr } = await supabase
    .from("savings_periods")
    .select("*")
    .in("id", periodIds)
    .eq("user_id", user.id);

  if (pErr || !periods?.length) {
    return NextResponse.json({ error: "Periods not found" }, { status: 404 });
  }

  const totalAmount = periods.reduce(
    (sum, p) =>
      sum +
      getPeriodAmount({
        baseAmount: p.base_amount,
        penaltyAmount: p.penalty_amount,
      }),
    0
  );

  const orderId = `CF-${user.id.slice(0, 8)}-${Date.now()}`;
  const methodLabel = paymentMethod === "va" ? `VA ${bank.toUpperCase()}` : "QRIS";

  const { data: userRow } = await supabase
    .from("users")
    .select("display_name, couple_space_id")
    .eq("id", user.id)
    .single();

  const perPeriod =
    periodIds.length === 1
      ? totalAmount
      : Math.floor(totalAmount / periodIds.length);

  await supabase.from("transactions").insert(
    periodIds.map((periodId, index) => ({
      couple_space_id: userRow?.couple_space_id,
      period_id: periodId,
      paid_by: user.id,
      amount:
        index === periodIds.length - 1
          ? totalAmount - perPeriod * (periodIds.length - 1)
          : perPeriod,
      payment_method: methodLabel,
      status: "pending",
      midtrans_order_id: orderId,
    }))
  );

  const customerName = userRow?.display_name ?? "User";

  let charge: Record<string, unknown>;

  if (paymentMethod === "va") {
    charge = (await chargeVirtualAccount({
      orderId,
      amount: totalAmount,
      customerName,
      bank,
    })) as Record<string, unknown>;
  } else {
    charge = (await chargeQris({
      orderId,
      amount: totalAmount,
      customerName,
    })) as Record<string, unknown>;
  }

  const qrUrl = paymentMethod === "qris" ? extractQrisUrl(charge) : null;
  const va = paymentMethod === "va" ? extractVirtualAccount(charge) : null;

  return NextResponse.json({
    orderId,
    amount: totalAmount,
    paymentMethod,
    qrUrl,
    qrString: (charge as { qr_string?: string }).qr_string ?? null,
    va,
    periodIds,
  });
}
