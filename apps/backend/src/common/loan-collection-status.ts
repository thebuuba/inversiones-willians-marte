export type LoanCollectionStatus = 'CURRENT' | 'PENDING' | 'LATE' | 'EXPIRED';

type LoanForCollectionStatus = {
  balance: unknown;
  interestType: string;
  endDate?: Date | null;
  schedule?: Array<{ dueDate: Date; status: string }>;
};

const DAY_MS = 86_400_000;

function calendarDay(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isPastGracePeriod(dueDate: Date, graceDays: number, now = new Date()) {
  return Math.floor((calendarDay(now) - calendarDay(dueDate)) / DAY_MS) > graceDays;
}

export function getLoanCollectionStatus(
  loan: LoanForCollectionStatus,
  graceDays: number,
  now = new Date(),
): LoanCollectionStatus {
  const today = calendarDay(now);
  if (
    loan.interestType !== 'INDEFINITE' &&
    Number(loan.balance) > 0 &&
    loan.endDate &&
    calendarDay(loan.endDate) < today
  ) {
    return 'EXPIRED';
  }

  const oldestUnpaid = (loan.schedule ?? [])
    .filter((row) => row.status !== 'PAID' && row.status !== 'CANCELLED')
    .map((row) => row.dueDate)
    .sort((left, right) => calendarDay(left) - calendarDay(right))[0];

  if (oldestUnpaid == null || calendarDay(oldestUnpaid) > today) return 'CURRENT';
  return isPastGracePeriod(oldestUnpaid, graceDays, now) ? 'LATE' : 'PENDING';
}
