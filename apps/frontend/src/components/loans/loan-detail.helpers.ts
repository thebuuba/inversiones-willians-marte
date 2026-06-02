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
