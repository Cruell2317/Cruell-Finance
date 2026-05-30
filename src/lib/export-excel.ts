import * as XLSX from "xlsx";
import type {
  CoupleMember,
  CoupleSpace,
  PoolDeposit,
  SavingsPeriod,
  SavingsTarget,
  Transaction,
} from "@/types";
import { formatDate, getPeriodAmount } from "./utils";

function statusLabel(status: SavingsPeriod["status"]): string {
  switch (status) {
    case "PAID":
      return "LUNAS";
    case "LATE":
      return "TERLAMBAT";
    default:
      return "BELUM BAYAR";
  }
}

function paidLabel(status: SavingsPeriod["status"]): string {
  return status === "PAID" ? "Ya" : "Tidak";
}

export interface CruellExportData {
  coupleSpace: CoupleSpace | null;
  members: CoupleMember[];
  periods: SavingsPeriod[];
  transactions: Transaction[];
  deposits: PoolDeposit[];
  targets: SavingsTarget[];
  poolBalance: number;
}

export function exportCruellFinanceReport(
  data: CruellExportData,
  filename?: string
) {
  const exportedAt = new Date().toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const settlementByPeriod = new Map<string, Transaction>();
  for (const tx of data.transactions) {
    if (tx.periodId && tx.status === "settlement") {
      settlementByPeriod.set(tx.periodId, tx);
    }
  }

  const pendingByPeriod = new Map<string, Transaction>();
  for (const tx of data.transactions) {
    if (tx.periodId && tx.status === "awaiting_confirmation") {
      pendingByPeriod.set(tx.periodId, tx);
    }
  }

  const overdue = data.periods.filter(
    (p) => p.status === "UNPAID" || p.status === "LATE"
  );

  const paidCount = data.periods.filter((p) => p.status === "PAID").length;

  // --- Sheet 1: Ringkasan ---
  const summaryRows: (string | number)[][] = [
    ["Catatan Cruell Finance"],
    [],
    ["Diekspor pada", exportedAt],
    ["Saldo pool", data.poolBalance],
    ["Total tagihan", data.periods.length],
    ["Sudah lunas", paidCount],
    ["Belum lunas / telat", overdue.length],
    [],
    ["Anggota pasangan"],
    ...data.members.map((m) => [
      m.displayName,
      m.isCreator ? "Pembuat ruang" : "Pasangan",
      `Streak ${m.savingStreak} minggu`,
    ]),
    [],
    ["Target tabungan"],
    ...(data.targets.length
      ? data.targets.map((t) => [
          t.name,
          t.collectedAmount,
          t.targetAmount,
          `${Math.round((t.collectedAmount / Math.max(t.targetAmount, 1)) * 100)}%`,
        ])
      : [["(belum ada target)", "", "", ""]]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 14 }];

  // --- Sheet 2: Detail tagihan lengkap ---
  const detailRows = data.periods
    .slice()
    .sort((a, b) => {
      if (a.monthYear !== b.monthYear) return a.monthYear.localeCompare(b.monthYear);
      if (a.weekNumber !== b.weekNumber) return a.weekNumber - b.weekNumber;
      return a.userDisplayName.localeCompare(b.userDisplayName);
    })
    .map((p) => {
      const tx = settlementByPeriod.get(p.id);
      const pending = pendingByPeriod.get(p.id);
      const total = getPeriodAmount(p);

      return {
        Bulan: p.monthYear,
        Minggu: p.weekNumber,
        Nama: p.userDisplayName,
        "Jatuh Tempo": formatDate(p.dueDate),
        Pokok: p.baseAmount,
        Denda: p.penaltyAmount,
        Total: total,
        Status: statusLabel(p.status),
        Lunas: paidLabel(p.status),
        "Tanggal Bayar": tx ? formatDate(tx.createdAt) : pending ? "Menunggu konfirmasi" : "-",
        "Metode Bayar": tx?.paymentMethod ?? pending?.paymentMethod ?? "-",
        "Ref / Order ID": tx?.midtransOrderId ?? tx?.id ?? pending?.midtransOrderId ?? "-",
        Catatan: pending ? "Menunggu konfirmasi pasangan" : p.status === "LATE" ? "Terlambat bayar" : "",
      };
    });

  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  wsDetail["!cols"] = [
    { wch: 16 },
    { wch: 8 },
    { wch: 18 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 8 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
  ];

  // --- Sheet 3: Yang nunggak ---
  const nunggakRows = overdue.map((p) => ({
    Bulan: p.monthYear,
    Minggu: p.weekNumber,
    "Yang nunggak": p.userDisplayName,
    "Jatuh Tempo": formatDate(p.dueDate),
    Status: statusLabel(p.status),
    Total: getPeriodAmount(p),
    Denda: p.penaltyAmount,
    "Menunggu konfirmasi": pendingByPeriod.has(p.id) ? "Ya" : "Tidak",
  }));

  const wsNunggak = XLSX.utils.json_to_sheet(
    nunggakRows.length
      ? nunggakRows
      : [{ Info: "Semua tagihan lunas — tidak ada yang nunggak" }]
  );
  wsNunggak["!cols"] = [
    { wch: 16 },
    { wch: 8 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
  ];

  // --- Sheet 4: Riwayat transaksi ---
  const txRows = data.transactions
    .filter((t) => t.status === "settlement" || t.status === "awaiting_confirmation")
    .map((t) => ({
      Tanggal: new Date(t.createdAt).toLocaleString("id-ID"),
      Nama: t.paidByName,
      Bulan: t.monthYear ?? "-",
      Minggu: t.weekNumber ?? "-",
      Jumlah: t.totalAmount,
      Metode: t.paymentMethod,
      Status: t.status === "settlement" ? "LUNAS" : "MENUNGGU KONFIRMASI",
      "Order ID": t.midtransOrderId ?? t.id,
    }));

  const wsTx = XLSX.utils.json_to_sheet(
    txRows.length ? txRows : [{ Info: "Belum ada transaksi" }]
  );
  wsTx["!cols"] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
    { wch: 8 },
    { wch: 12 },
    { wch: 18 },
    { wch: 22 },
    { wch: 24 },
  ];

  // --- Sheet 5: Top-up pool ---
  const depRows = data.deposits.map((d) => ({
    Tanggal: new Date(d.createdAt).toLocaleString("id-ID"),
    Oleh: d.depositedByName,
    Jumlah: d.amount,
    Catatan: d.note ?? "-",
  }));

  const wsDep = XLSX.utils.json_to_sheet(
    depRows.length ? depRows : [{ Info: "Belum ada top-up pool" }]
  );
  wsDep["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 30 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsSummary, "Ringkasan");
  XLSX.utils.book_append_sheet(workbook, wsDetail, "Detail Tagihan");
  XLSX.utils.book_append_sheet(workbook, wsNunggak, "Yang Nunggak");
  XLSX.utils.book_append_sheet(workbook, wsTx, "Transaksi");
  XLSX.utils.book_append_sheet(workbook, wsDep, "Top-up Pool");

  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(
    workbook,
    filename ?? `Catatan-Cruell-Finance-${dateStamp}.xlsx`
  );
}

/** @deprecated use exportCruellFinanceReport */
export function exportTransactionsToExcel(
  transactions: Transaction[],
  filename = "cruell-finance-laporan.xlsx"
) {
  exportCruellFinanceReport({
    coupleSpace: null,
    members: [],
    periods: [],
    transactions,
    deposits: [],
    targets: [],
    poolBalance: 0,
  }, filename);
}
