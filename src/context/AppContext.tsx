"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { fetchCoupleSpaceData } from "@/lib/db/fetch-space-data";
import { createClient } from "@/lib/supabase/client";
import { getCurrentMonthYear } from "@/lib/month-utils";
import { getPeriodAmount } from "@/lib/utils";
import type {
  CoupleMember,
  CoupleSpace,
  PaymentSelection,
  PaymentSettings,
  PendingPaymentClaim,
  PoolDeposit,
  SavingsPeriod,
  SavingsTarget,
  TargetAllocation,
  Transaction,
} from "@/types";

const BANNER_KEY = "cruell-banner-dismissed";

interface AppContextValue {
  coupleSpace: CoupleSpace | null;
  members: CoupleMember[];
  periods: SavingsPeriod[];
  transactions: Transaction[];
  targets: SavingsTarget[];
  allocations: TargetAllocation[];
  deposits: PoolDeposit[];
  paymentSettings: PaymentSettings | null;
  pendingPaymentClaims: PendingPaymentClaim[];
  currentMonth: string;
  overdueCount: number;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  poolBalance: number;
  monthlyTransactions: Transaction[];
  monthlyActivity: Array<
    | { type: "tx"; data: Transaction }
    | { type: "deposit"; data: PoolDeposit }
  >;
  openPayment: (selection: PaymentSelection) => void;
  closePayment: () => void;
  paymentSelection: PaymentSelection | null;
  addPoolDeposit: (amount: number, note?: string) => Promise<void>;
  allocateToTarget: (targetId: string, amount: number) => Promise<void>;
  addTarget: (input: {
    name: string;
    imageUrl: string;
    targetAmount: number;
  }) => Promise<void>;
  deleteTarget: (targetId: string) => Promise<void>;
  updateTarget: (
    targetId: string,
    input: { name: string; imageUrl: string; targetAmount: number }
  ) => Promise<void>;
  sendNudge: (periodId: string, toUserId: string) => Promise<void>;
  reloadData: () => Promise<void>;
  getPeriodTransaction: (periodId: string) => Transaction | undefined;
  getPeriodPendingTransaction: (periodId: string) => Transaction | undefined;
  savePaymentSettings: (input: Partial<PaymentSettings>) => Promise<void>;
  submitManualPaymentClaim: (
    periodIds: string[],
    method: string,
    proofUrl?: string | null
  ) => Promise<string>;
  confirmManualPayment: (orderId: string) => Promise<number>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const { step } = useOnboarding();
  const [coupleSpace, setCoupleSpace] = useState<CoupleSpace | null>(null);
  const [members, setMembers] = useState<CoupleMember[]>([]);
  const [periods, setPeriods] = useState<SavingsPeriod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [targets, setTargets] = useState<SavingsTarget[]>([]);
  const [allocations, setAllocations] = useState<TargetAllocation[]>([]);
  const [deposits, setDeposits] = useState<PoolDeposit[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(
    null
  );
  const [paymentSelection, setPaymentSelection] =
    useState<PaymentSelection | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const currentMonth = getCurrentMonthYear();

  useEffect(() => {
    if (typeof window === "undefined" || !profile?.coupleSpaceId) return;
    const key = `${BANNER_KEY}-${profile.coupleSpaceId}`;
    setIsBannerDismissed(sessionStorage.getItem(key) === "1");
  }, [profile?.coupleSpaceId]);

  const reloadData = useCallback(async () => {
    if (!profile?.coupleSpaceId || step !== "complete") {
      setCoupleSpace(null);
      setMembers([]);
      setPeriods([]);
      setTransactions([]);
      setTargets([]);
      setAllocations([]);
      setDeposits([]);
      setPaymentSettings(null);
      return;
    }

    const data = await fetchCoupleSpaceData(profile.coupleSpaceId);
    setCoupleSpace(data.coupleSpace);
    setMembers(data.members);
    setPeriods(data.periods);
    setTransactions(data.transactions);
    setTargets(data.targets);
    setAllocations(data.allocations);
    setDeposits(data.deposits);
    setPaymentSettings(data.paymentSettings);
  }, [profile?.coupleSpaceId, step]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  useEffect(() => {
    if (!profile?.coupleSpaceId || step !== "complete") return;

    const supabase = createClient();
    const channel = supabase
      .channel(`space-${profile.coupleSpaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "savings_periods",
          filter: `couple_space_id=eq.${profile.coupleSpaceId}`,
        },
        () => reloadData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `couple_space_id=eq.${profile.coupleSpaceId}`,
        },
        () => reloadData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "targets",
          filter: `couple_space_id=eq.${profile.coupleSpaceId}`,
        },
        () => reloadData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couple_spaces",
          filter: `id=eq.${profile.coupleSpaceId}`,
        },
        () => reloadData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pool_deposits",
          filter: `couple_space_id=eq.${profile.coupleSpaceId}`,
        },
        () => reloadData()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `couple_space_id=eq.${profile.coupleSpaceId}`,
        },
        () => reloadData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_settings",
          filter: `couple_space_id=eq.${profile.coupleSpaceId}`,
        },
        () => reloadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.coupleSpaceId, step, reloadData]);

  const overdueCount = useMemo(
    () =>
      periods.filter((p) => p.status === "UNPAID" || p.status === "LATE").length,
    [periods]
  );

  const poolBalance = coupleSpace?.poolBalance ?? 0;

  const monthlyTransactions = useMemo(
    () =>
      transactions.filter(
        (t) => t.monthYear === currentMonth && t.status === "settlement"
      ),
    [transactions, currentMonth]
  );

  const monthlyActivity = useMemo((): Array<
    | { type: "tx"; data: Transaction }
    | { type: "deposit"; data: PoolDeposit }
  > => {
    const monthPrefix = new Date().toISOString().slice(0, 7);
    const txItems = monthlyTransactions.map((t) => ({
      type: "tx" as const,
      data: t,
      sort: new Date(t.createdAt).getTime(),
    }));
    const depItems = deposits
      .filter((d) => d.createdAt.slice(0, 7) === monthPrefix)
      .map((d) => ({
        type: "deposit" as const,
        data: d,
        sort: new Date(d.createdAt).getTime(),
      }));
    return [...txItems, ...depItems]
      .sort((a, b) => b.sort - a.sort)
      .map(({ type, data }) =>
        type === "tx"
          ? { type: "tx" as const, data: data as Transaction }
          : { type: "deposit" as const, data: data as PoolDeposit }
      );
  }, [monthlyTransactions, deposits]);

  const dismissBanner = useCallback(() => {
    if (profile?.coupleSpaceId) {
      sessionStorage.setItem(`${BANNER_KEY}-${profile.coupleSpaceId}`, "1");
    }
    setIsBannerDismissed(true);
  }, [profile?.coupleSpaceId]);

  const addPoolDeposit = useCallback(
    async (amount: number, note?: string) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("add_pool_deposit", {
        p_amount: amount,
        p_note: note ?? null,
      });
      if (error) throw error;
      await reloadData();
    },
    [reloadData]
  );

  const allocateToTarget = useCallback(
    async (targetId: string, amount: number) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("allocate_to_target", {
        p_target_id: targetId,
        p_amount: amount,
      });
      if (error) throw error;
      await reloadData();
    },
    [reloadData]
  );

  const addTarget = useCallback(
    async (input: { name: string; imageUrl: string; targetAmount: number }) => {
      if (!profile?.coupleSpaceId) return;
      const supabase = createClient();
      const { error } = await supabase.from("targets").insert({
        couple_space_id: profile.coupleSpaceId,
        created_by: profile.id,
        target_name: input.name,
        target_amount: input.targetAmount,
        image_url: input.imageUrl,
      });
      if (error) throw error;
      await reloadData();
    },
    [profile, reloadData]
  );

  const deleteTarget = useCallback(
    async (targetId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("targets").delete().eq("id", targetId);
      if (error) throw error;
      await reloadData();
    },
    [reloadData]
  );

  const updateTarget = useCallback(
    async (
      targetId: string,
      input: { name: string; imageUrl: string; targetAmount: number }
    ) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("targets")
        .update({
          target_name: input.name.trim(),
          image_url: input.imageUrl,
          target_amount: input.targetAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetId);
      if (error) throw error;
      await reloadData();
    },
    [reloadData]
  );

  const sendNudge = useCallback(
    async (periodId: string, toUserId: string) => {
      if (!profile?.coupleSpaceId) return;
      const period = periods.find((p) => p.id === periodId);
      const supabase = createClient();

      await supabase.from("nudges").insert({
        couple_space_id: profile.coupleSpaceId,
        period_id: periodId,
        from_user_id: profile.id,
        to_user_id: toUserId,
      });

      const channel = supabase.channel(`nudge-${profile.coupleSpaceId}`);
      await channel.send({
        type: "broadcast",
        event: "nudge",
        payload: {
          fromUserId: profile.id,
          fromName: profile.displayName,
          periodId,
          monthYear: period?.monthYear,
          weekNumber: period?.weekNumber,
          message: `${profile.displayName} mengecek tagihanmu 👋`,
        },
      });
    },
    [profile, periods]
  );

  const getPeriodTransaction = useCallback(
    (periodId: string) =>
      transactions.find(
        (t) => t.periodId === periodId && t.status === "settlement"
      ),
    [transactions]
  );

  const getPeriodPendingTransaction = useCallback(
    (periodId: string) =>
      transactions.find(
        (t) =>
          t.periodId === periodId && t.status === "awaiting_confirmation"
      ),
    [transactions]
  );

  const pendingPaymentClaims = useMemo((): PendingPaymentClaim[] => {
    const pending = transactions.filter(
      (t) => t.status === "awaiting_confirmation" && t.midtransOrderId
    );
    const byOrder = new Map<string, Transaction[]>();
    for (const t of pending) {
      const key = t.midtransOrderId!;
      if (!byOrder.has(key)) byOrder.set(key, []);
      byOrder.get(key)!.push(t);
    }
    return [...byOrder.entries()].map(([orderId, txs]) => {
      const first = txs[0]!;
      const periodLabels = txs.map((t) => {
        const p = periods.find((x) => x.id === t.periodId);
        return p ? `${p.monthYear} M${p.weekNumber}` : "Tagihan";
      });
      return {
        orderId,
        paidBy: first.paidBy,
        paidByName: first.paidByName,
        totalAmount: txs.reduce((s, x) => s + x.totalAmount, 0),
        paymentMethod: first.paymentMethod,
        createdAt: first.createdAt,
        periodLabels,
      };
    });
  }, [transactions, periods]);

  const savePaymentSettings = useCallback(
    async (input: Partial<PaymentSettings>) => {
      if (!profile?.coupleSpaceId) return;
      const supabase = createClient();
      const row = {
        couple_space_id: profile.coupleSpaceId,
        qris_image_url: input.qrisImageUrl ?? paymentSettings?.qrisImageUrl,
        account_holder_name:
          input.accountHolderName ?? paymentSettings?.accountHolderName,
        va_bca: input.vaBca ?? paymentSettings?.vaBca,
        va_bni: input.vaBni ?? paymentSettings?.vaBni,
        va_bri: input.vaBri ?? paymentSettings?.vaBri,
        va_permata: input.vaPermata ?? paymentSettings?.vaPermata,
        va_mandiri: input.vaMandiri ?? paymentSettings?.vaMandiri,
        va_cimb: input.vaCimb ?? paymentSettings?.vaCimb,
        use_midtrans: input.useMidtrans ?? paymentSettings?.useMidtrans ?? false,
        payment_instructions:
          input.paymentInstructions ?? paymentSettings?.paymentInstructions,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("payment_settings").upsert(row);
      if (error) throw error;
      await reloadData();
    },
    [profile?.coupleSpaceId, paymentSettings, reloadData]
  );

  const submitManualPaymentClaim = useCallback(
    async (periodIds: string[], method: string, proofUrl?: string | null) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("submit_manual_payment_claim", {
        p_period_ids: periodIds,
        p_method: method,
        p_proof_url: proofUrl ?? null,
      });
      if (error) throw error;
      await reloadData();
      return data as string;
    },
    [reloadData]
  );

  const confirmManualPayment = useCallback(
    async (orderId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("confirm_manual_payment", {
        p_order_id: orderId,
      });
      if (error) throw error;
      await reloadData();
      return data as number;
    },
    [reloadData]
  );

  return (
    <AppContext.Provider
      value={{
        coupleSpace,
        members,
        periods,
        transactions,
        targets,
        allocations,
        deposits,
        paymentSettings,
        pendingPaymentClaims,
        currentMonth,
        overdueCount,
        isBannerDismissed,
        dismissBanner,
        poolBalance,
        monthlyTransactions,
        monthlyActivity,
        openPayment: setPaymentSelection,
        closePayment: () => setPaymentSelection(null),
        paymentSelection,
        addPoolDeposit,
        allocateToTarget,
        addTarget,
        deleteTarget,
        updateTarget,
        sendNudge,
        reloadData,
        getPeriodTransaction,
        getPeriodPendingTransaction,
        savePaymentSettings,
        submitManualPaymentClaim,
        confirmManualPayment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

