import { createClient } from "@/lib/supabase/client";
import type {
  CoupleMember,
  CoupleSpace,
  PaymentSettings,
  PoolDeposit,
  SavingsPeriod,
  SavingsTarget,
  TargetAllocation,
  Transaction,
} from "@/types";

function mapPaymentSettings(row: Record<string, unknown>): PaymentSettings {
  return {
    coupleSpaceId: row.couple_space_id as string,
    qrisImageUrl: (row.qris_image_url as string) ?? null,
    accountHolderName: (row.account_holder_name as string) ?? "Cruell Finance",
    vaBca: (row.va_bca as string) ?? null,
    vaBni: (row.va_bni as string) ?? null,
    vaBri: (row.va_bri as string) ?? null,
    vaPermata: (row.va_permata as string) ?? null,
    vaMandiri: (row.va_mandiri as string) ?? null,
    vaCimb: (row.va_cimb as string) ?? null,
    useMidtrans: Boolean(row.use_midtrans),
    paymentInstructions:
      (row.payment_instructions as string) ??
      "Transfer sesuai nominal. Konfirmasi setelah bayar.",
  };
}

const defaultPaymentSettings = (coupleSpaceId: string): PaymentSettings => ({
  coupleSpaceId,
  qrisImageUrl: null,
  accountHolderName: "Cruell Finance",
  vaBca: null,
  vaBni: null,
  vaBri: null,
  vaPermata: null,
  vaMandiri: null,
  vaCimb: null,
  useMidtrans: false,
  paymentInstructions: "Upload QRIS & nomor VA di menu Pengaturan Pembayaran.",
});

function mapSpace(row: Record<string, unknown>): CoupleSpace {
  return {
    id: row.id as string,
    pairingCode: row.pairing_code as string,
    createdByUserId: row.created_by as string,
    memberIds: [],
    startMonth: row.start_month as number | null,
    startYear: row.start_year as number | null,
    poolBalance: Number(row.pool_balance ?? 0),
    onboardingComplete: row.onboarding_complete as boolean,
    createdAt: row.created_at as string,
  };
}

function mapPeriod(row: Record<string, unknown>, displayName: string): SavingsPeriod {
  return {
    id: row.id as string,
    coupleSpaceId: row.couple_space_id as string,
    userId: row.user_id as string,
    userDisplayName: displayName,
    monthYear: row.month_year as string,
    weekNumber: row.week_number as number,
    baseAmount: row.base_amount as number,
    penaltyAmount: row.penalty_amount as number,
    dueDate: row.due_date as string,
    status: row.status as SavingsPeriod["status"],
  };
}

export async function fetchCoupleSpaceData(coupleSpaceId: string) {
  const supabase = createClient();

  const [
    { data: spaceRow },
    { data: members },
    { data: periods },
    { data: targets },
    { data: transactions },
    { data: allocations },
    { data: deposits },
    { data: paymentRow },
  ] = await Promise.all([
    supabase.from("couple_spaces").select("*").eq("id", coupleSpaceId).single(),
    supabase
      .from("users")
      .select("id, display_name, avatar_url, is_space_creator, role, saving_streak")
      .eq("couple_space_id", coupleSpaceId),
    supabase
      .from("savings_periods")
      .select("*")
      .eq("couple_space_id", coupleSpaceId)
      .order("due_date", { ascending: true }),
    supabase.from("targets").select("*").eq("couple_space_id", coupleSpaceId),
    supabase
      .from("transactions")
      .select("*")
      .eq("couple_space_id", coupleSpaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("target_allocations")
      .select("*")
      .eq("couple_space_id", coupleSpaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("pool_deposits")
      .select("*")
      .eq("couple_space_id", coupleSpaceId)
      .order("created_at", { ascending: false }),
    supabase.from("payment_settings").select("*").eq("couple_space_id", coupleSpaceId).maybeSingle(),
  ]);

  const memberMap = new Map(
    (members ?? []).map((m) => [
      m.id,
      {
        userId: m.id,
        displayName: m.display_name ?? "User",
        avatarUrl: m.avatar_url,
        isCreator: m.is_space_creator,
        role:
          m.role === "CREATOR" || m.role === "JOINER"
            ? m.role
            : m.is_space_creator
              ? "CREATOR"
              : "JOINER",
        savingStreak: m.saving_streak ?? 0,
      } satisfies CoupleMember,
    ])
  );

  const coupleSpace = spaceRow ? mapSpace(spaceRow) : null;
  if (coupleSpace) {
    coupleSpace.memberIds = [...memberMap.keys()];
  }

  const mappedPeriods: SavingsPeriod[] = (periods ?? []).map((p) =>
    mapPeriod(p, memberMap.get(p.user_id)?.displayName ?? "User")
  );

  const mappedTargets: SavingsTarget[] = (targets ?? []).map((t) => ({
    id: t.id,
    coupleSpaceId: t.couple_space_id,
    name: t.target_name,
    imageUrl: t.image_url ?? "",
    targetAmount: Number(t.target_amount),
    collectedAmount: Number(t.current_amount),
    createdBy: t.created_by,
    createdByName: memberMap.get(t.created_by)?.displayName ?? "User",
    createdAt: t.created_at,
  }));

  const mappedTransactions: Transaction[] = (transactions ?? []).map((t) => {
    const period = mappedPeriods.find((p) => p.id === t.period_id);
    return {
      id: t.id,
      periodId: t.period_id,
      targetId: t.target_id,
      paidBy: t.paid_by,
      paidByName: memberMap.get(t.paid_by)?.displayName ?? "User",
      totalAmount: t.amount,
      paymentMethod: t.payment_method ?? "QRIS",
      status: t.status,
      midtransOrderId: t.midtrans_order_id ?? undefined,
      createdAt: t.created_at,
      monthYear: period?.monthYear,
      weekNumber: period?.weekNumber,
    };
  });

  const mappedAllocations: TargetAllocation[] = (allocations ?? []).map((a) => ({
    id: a.id,
    targetId: a.target_id,
    amount: a.amount,
    allocatedBy: a.allocated_by,
    allocatedByName: memberMap.get(a.allocated_by)?.displayName ?? "User",
    createdAt: a.created_at,
  }));

  const mappedDeposits: PoolDeposit[] = (deposits ?? []).map((d) => ({
    id: d.id,
    amount: d.amount,
    depositedBy: d.deposited_by,
    depositedByName: memberMap.get(d.deposited_by)?.displayName ?? "User",
    note: d.note,
    createdAt: d.created_at,
  }));

  const paymentSettings = paymentRow
    ? mapPaymentSettings(paymentRow)
    : defaultPaymentSettings(coupleSpaceId);

  return {
    coupleSpace,
    members: [...memberMap.values()],
    periods: mappedPeriods,
    targets: mappedTargets,
    transactions: mappedTransactions,
    allocations: mappedAllocations,
    deposits: mappedDeposits,
    paymentSettings,
  };
}
