export interface PaymentPreviewSchedule {
  id: string;
  dueDate: string;
  amount: number | string;
  interestPart: number | string;
  paidAmount?: number | string | null;
  status: string;
}

export interface PaymentPreviewPayment {
  amount?: number | string;
  allocations?: Array<{
    scheduleId: string;
    amount: number | string;
    type: string;
  }>;
}

export interface LoanPaymentSummary {
  capitalPaid: number;
  capitalOutstanding: number;
  interestPaid: number;
  interestOutstanding: number;
  feesOutstanding: number;
  totalPaid: number;
  overdueAmount: number;
  overdueInstallments: number;
  paidInstallments: number;
}

export function getLoanPaymentSummary(
  schedule: PaymentPreviewSchedule[],
  payments: PaymentPreviewPayment[],
  lateFees: Array<{ amount: number | string; paid: boolean }>,
  principal: number,
  balance: number,
  asOfDate: string,
): LoanPaymentSummary {
  const allocations = payments.flatMap((payment) => payment.allocations ?? []);
  const interestPaid = allocations
    .filter((allocation) => allocation.type === 'INTEREST')
    .reduce((sum, allocation) => sum + Number(allocation.amount), 0);
  const interestBySchedule = new Map<string, number>();
  for (const allocation of allocations.filter((item) => item.type === 'INTEREST')) {
    interestBySchedule.set(
      allocation.scheduleId,
      (interestBySchedule.get(allocation.scheduleId) ?? 0) + Number(allocation.amount),
    );
  }

  const outstandingRows = schedule.filter((row) => row.status !== 'PAID');
  const overdueRows = outstandingRows.filter((row) => row.dueDate.slice(0, 10) < asOfDate);

  return {
    capitalPaid: roundMoney(Math.max(0, principal - balance)),
    capitalOutstanding: roundMoney(Math.max(0, balance)),
    interestPaid: roundMoney(interestPaid),
    interestOutstanding: roundMoney(
      outstandingRows.reduce(
        (sum, row) =>
          sum + Math.max(0, Number(row.interestPart) - (interestBySchedule.get(row.id) ?? 0)),
        0,
      ),
    ),
    feesOutstanding: roundMoney(
      lateFees.filter((fee) => !fee.paid).reduce((sum, fee) => sum + Number(fee.amount), 0),
    ),
    totalPaid: roundMoney(payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)),
    overdueAmount: roundMoney(
      overdueRows.reduce(
        (sum, row) => sum + Math.max(0, Number(row.amount) - Number(row.paidAmount ?? 0)),
        0,
      ),
    ),
    overdueInstallments: overdueRows.length,
    paidInstallments: schedule.filter((row) => row.status === 'PAID').length,
  };
}

export interface PaymentAllocationPreviewRow {
  scheduleId: string;
  dueDate: string;
  applied: number;
  interest: number;
  principal: number;
}

export function getOutstandingScheduledAmount(schedule: PaymentPreviewSchedule[]): number {
  return roundMoney(
    schedule
      .filter((row) => row.status !== 'PAID')
      .reduce((sum, row) => sum + Math.max(0, Number(row.amount) - Number(row.paidAmount ?? 0)), 0),
  );
}

export function getAmountToBringCurrent(
  schedule: PaymentPreviewSchedule[],
  asOfDate: string,
): number {
  return roundMoney(
    schedule
      .filter((row) => row.status !== 'PAID' && row.dueDate.slice(0, 10) <= asOfDate)
      .reduce((sum, row) => sum + Math.max(0, Number(row.amount) - Number(row.paidAmount ?? 0)), 0),
  );
}

export function getNextScheduledAmount(schedule: PaymentPreviewSchedule[]): number {
  const next = [...schedule]
    .filter((row) => row.status !== 'PAID')
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())[0];

  return next ? roundMoney(Math.max(0, Number(next.amount) - Number(next.paidAmount ?? 0))) : 0;
}

export function buildPaymentAllocationPreview(
  schedule: PaymentPreviewSchedule[],
  payments: PaymentPreviewPayment[],
  paymentAmount: number,
): PaymentAllocationPreviewRow[] {
  const paidInterestBySchedule = new Map<string, number>();
  for (const allocation of payments.flatMap((payment) => payment.allocations ?? [])) {
    if (allocation.type !== 'INTEREST') continue;
    paidInterestBySchedule.set(
      allocation.scheduleId,
      (paidInterestBySchedule.get(allocation.scheduleId) ?? 0) + Number(allocation.amount),
    );
  }

  let remainingPayment = Math.max(0, paymentAmount);
  const rows: PaymentAllocationPreviewRow[] = [];
  const pendingSchedule = [...schedule]
    .filter((row) => row.status !== 'PAID')
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());

  for (const row of pendingSchedule) {
    if (remainingPayment <= 0) break;
    const outstanding = Math.max(0, Number(row.amount) - Number(row.paidAmount ?? 0));
    if (outstanding <= 0) continue;
    const applied = Math.min(outstanding, remainingPayment);
    const remainingInterest = Math.max(
      0,
      Number(row.interestPart) - (paidInterestBySchedule.get(row.id) ?? 0),
    );
    const interest = Math.min(applied, remainingInterest);

    rows.push({
      scheduleId: row.id,
      dueDate: row.dueDate,
      applied: roundMoney(applied),
      interest: roundMoney(interest),
      principal: roundMoney(applied - interest),
    });
    remainingPayment -= applied;
  }

  return rows;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
