/**
 * Lapisan simulasi Open Banking (Brick / SNAP BI).
 * Produksi: ganti dengan API Brick atau aggregator SNAP resmi.
 */

export interface OpenBankingSnapshot {
  provider: string;
  accountRef: string;
  balance: number;
  currency: "IDR";
  lastSyncedAt: string;
  status: "connected" | "simulated";
}

export function simulateBrickSnapBalance(poolBalance: number): OpenBankingSnapshot {
  const jitter = Math.floor(Math.random() * 5000);
  return {
    provider: "brick_snap_sim",
    accountRef: "CRUELL-POOL-REKENING-BERSAMA",
    balance: poolBalance + jitter,
    currency: "IDR",
    lastSyncedAt: new Date().toISOString(),
    status: "simulated",
  };
}
