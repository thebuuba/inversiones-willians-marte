export interface LoanDetailLike {
  principal: number;
  balance: number;
  totalAmount: number;
  term: number;
  payments: Array<{ amount: number }>;
  schedule: Array<{ status: string }>;
}

export interface LoanDetailTotals {
  principal: number;
  balance: number;
  totalPaid: number;
  installment: number;
  progress: number;
  paidInstallments: number;
  totalInstallments: number;
}

export type LoanCollectionStatus = 'A tiempo' | 'Pendiente' | 'Atrasado' | 'Vencido';

export interface LoanCollectionStatusLike {
  balance: number;
  interestType: string;
  endDate?: string | null;
  schedule?: Array<{ dueDate: string; status: string }>;
}

export interface ClientLoanStatsLike {
  principal: number | string;
  balance: number | string;
  schedule?: Array<{ paidAmount?: number | string | null }>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function getCalendarDay(value: string | Date) {
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (match) return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  const date = new Date(value);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getLoanCollectionStatus(loan: LoanCollectionStatusLike, now = new Date()): LoanCollectionStatus {
  const today = getCalendarDay(now);
  const isFiniteLoan = loan.interestType !== 'INDEFINITE';

  if (isFiniteLoan && loan.balance > 0 && loan.endDate && getCalendarDay(loan.endDate) < today) {
    return 'Vencido';
  }

  const oldestUnpaidDueDate = (loan.schedule ?? [])
    .filter((row) => row.status !== 'PAID')
    .map((row) => getCalendarDay(row.dueDate))
    .sort((a, b) => a - b)[0];

  if (oldestUnpaidDueDate == null || oldestUnpaidDueDate > today) return 'A tiempo';

  const daysPastDue = Math.floor((today - oldestUnpaidDueDate) / DAY_MS);
  return daysPastDue <= 5 ? 'Pendiente' : 'Atrasado';
}

export function getClientLoanStats(loans: ClientLoanStatsLike[]) {
  const totals = loans.reduce(
    (totals, loan) => ({
      totalLoaned: totals.totalLoaned + Number(loan.principal),
      totalBalance: totals.totalBalance + Number(loan.balance),
      totalPaid: totals.totalPaid + (loan.schedule ?? []).reduce((sum, row) => sum + Number(row.paidAmount ?? 0), 0),
    }),
    { totalLoaned: 0, totalBalance: 0, totalPaid: 0 },
  );

  return {
    totalLoaned: Math.round(totals.totalLoaned * 100) / 100,
    totalBalance: Math.round(totals.totalBalance * 100) / 100,
    totalPaid: Math.round(totals.totalPaid * 100) / 100,
  };
}

export function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value + 1e-9)));
}

export function getLoanProgress(totalAmount: number, balance: number) {
  if (totalAmount <= 0) return 0;
  return clampProgress(((totalAmount - balance) / totalAmount) * 100);
}

export function getRegularInstallment(totalAmount: number, term: number) {
  if (term <= 0) return 0;
  return Math.round(totalAmount / term);
}

export function getScheduleRemaining(amount: number, paidAmount = 0) {
  return Math.max(0, amount - (paidAmount ?? 0));
}

export function getLoanDetailTotals(loan: LoanDetailLike): LoanDetailTotals {
  return {
    principal: loan.principal,
    balance: loan.balance,
    totalPaid: loan.payments.reduce((sum, payment) => sum + payment.amount, 0),
    installment: getRegularInstallment(loan.totalAmount, loan.term),
    progress: getLoanProgress(loan.totalAmount, loan.balance),
    paidInstallments: loan.schedule.filter((row) => row.status === 'PAID').length,
    totalInstallments: loan.schedule.length,
  };
}
