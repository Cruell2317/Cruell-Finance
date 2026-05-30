import { formatMonthYear, monthsFromStartToNow } from "@/lib/month-utils";
import type { CoupleMember, SavingsPeriod } from "@/types";

const BASE_AMOUNT = 10_000;

export function generateRetroactivePeriods(
  coupleSpaceId: string,
  startMonth: number,
  startYear: number,
  members: CoupleMember[]
): SavingsPeriod[] {
  const periods: SavingsPeriod[] = [];
  const monthList = monthsFromStartToNow(startMonth, startYear);
  let idCounter = 1;

  for (const { month, year } of monthList) {
    const monthYear = formatMonthYear(month, year);

    for (const member of members) {
      for (let week = 1; week <= 4; week++) {
        const day = Math.min(week * 7, 28);
        periods.push({
          id: `period-${idCounter++}`,
          coupleSpaceId,
          userId: member.userId,
          userDisplayName: member.displayName,
          monthYear,
          weekNumber: week,
          baseAmount: BASE_AMOUNT,
          penaltyAmount: 0,
          dueDate: new Date(year, month - 1, day, 23, 59, 59).toISOString(),
          status: "UNPAID",
        });
      }
    }
  }

  return periods;
}
