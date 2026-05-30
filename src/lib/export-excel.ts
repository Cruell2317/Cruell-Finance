import * as XLSX from "xlsx";
import type { Transaction } from "@/types";
import { formatRupiah } from "./utils";

export function exportTransactionsToExcel(
  transactions: Transaction[],
  filename = "cruell-finance-laporan.xlsx"
) {
  const rows = transactions.map((t) => ({
    Tanggal: new Date(t.createdAt).toLocaleString("id-ID"),
    Nama: t.paidByName,
    Periode: t.monthYear,
    Minggu: t.weekNumber,
    Jumlah: t.totalAmount,
    Format: formatRupiah(t.totalAmount),
    Metode: t.paymentMethod,
    Status: t.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 8 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
  XLSX.writeFile(workbook, filename);
}
