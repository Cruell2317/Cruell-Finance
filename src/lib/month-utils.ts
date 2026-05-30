export const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export function formatMonthYear(month: number, year: number): string {
  return `${MONTH_NAMES_ID[month - 1]} ${year}`;
}

export function parseMonthYear(monthYear: string): { month: number; year: number } {
  const parts = monthYear.split(" ");
  const year = Number(parts[parts.length - 1]);
  const monthIndex = MONTH_NAMES_ID.findIndex((m) => monthYear.startsWith(m));
  return { month: monthIndex + 1, year };
}

export function compareMonthYear(
  a: { month: number; year: number },
  b: { month: number; year: number }
): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

/** Daftar bulan dari start hingga bulan saat ini (inklusif). */
export function monthsFromStartToNow(
  startMonth: number,
  startYear: number
): { month: number; year: number }[] {
  const now = new Date();
  const end = { month: now.getMonth() + 1, year: now.getFullYear() };
  const start = { month: startMonth, year: startYear };
  const result: { month: number; year: number }[] = [];
  let cur = { ...start };

  while (compareMonthYear(cur, end) <= 0) {
    result.push({ ...cur });
    cur.month += 1;
    if (cur.month > 12) {
      cur.month = 1;
      cur.year += 1;
    }
  }

  return result;
}

export function getCurrentMonthYear(): string {
  const now = new Date();
  return formatMonthYear(now.getMonth() + 1, now.getFullYear());
}
