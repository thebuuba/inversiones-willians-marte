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
    .map((row) => calendarDay(row.dueDate))
    .sort((left, right) => left - right)[0];

  if (oldestUnpaid == null || oldestUnpaid > today) return 'CURRENT';
  return Math.floor((today - oldestUnpaid) / DAY_MS) <= graceDays ? 'PENDING' : 'LATE';
}
