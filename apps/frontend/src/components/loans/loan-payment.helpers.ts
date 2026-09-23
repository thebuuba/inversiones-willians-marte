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

export type PaymentLateFee = {
  scheduleId?: string;
  amount: number | string;
  paid: boolean;
  paidAmount?: number | string | null;
};

function getOutstandingFees(lateFees: PaymentLateFee[]): number {
  return lateFees
    .filter((fee) => !fee.paid)
    .reduce((sum, fee) => sum + Math.max(0, Number(fee.amount) - Number(fee.paidAmount ?? 0)), 0);
}

function isCollectible(status: string): boolean {
  return status === 'PENDING' || status === 'PARTIAL' || status === 'OVERDUE';
}

export function getLoanPaymentSummary(
  schedule: PaymentPreviewSchedule[],
  payments: PaymentPreviewPayment[],
  lateFees: PaymentLateFee[],
  principal: number,
  asOfDate: string,
): LoanPaymentSummary {
  const allocations = payments.flatMap((payment) => payment.allocations ?? []);
  const capitalPaid = allocations
    .filter((allocation) => allocation.type === 'PRINCIPAL')
    .reduce((sum, allocation) => sum + Number(allocation.amount), 0);
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

  const outstandingRows = schedule.filter((row) => isCollectible(row.status));
  const overdueRows = outstandingRows.filter((row) => row.dueDate.slice(0, 10) < asOfDate);

  return {
    capitalPaid: roundMoney(capitalPaid),
    capitalOutstanding: roundMoney(Math.max(0, principal - capitalPaid)),
    interestPaid: roundMoney(interestPaid),
    interestOutstanding: roundMoney(
      outstandingRows.reduce(
        (sum, row) =>
          sum + Math.max(0, Number(row.interestPart) - (interestBySchedule.get(row.id) ?? 0)),
        0,
      ),
    ),
    feesOutstanding: roundMoney(getOutstandingFees(lateFees)),
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
  penalty: number;
}

export function getOutstandingScheduledAmount(
  schedule: PaymentPreviewSchedule[],
  lateFees: PaymentLateFee[] = [],
): number {
  const collectibleIds = new Set(
    schedule.filter((row) => isCollectible(row.status)).map((row) => row.id),
  );
  return roundMoney(
    schedule
      .filter((row) => isCollectible(row.status))
      .reduce(
        (sum, row) => sum + Math.max(0, Number(row.amount) - Number(row.paidAmount ?? 0)),
        getOutstandingFees(
          lateFees.filter((fee) => !fee.scheduleId || collectibleIds.has(fee.scheduleId)),
        ),
      ),
  );
}

export function getAmountToBringCurrent(
  schedule: PaymentPreviewSchedule[],
  asOfDate: string,
  lateFees: PaymentLateFee[] = [],
): number {
  const dueScheduleIds = new Set(
    schedule
      .filter((row) => isCollectible(row.status) && row.dueDate.slice(0, 10) <= asOfDate)
      .map((row) => row.id),
  );
  return roundMoney(
    schedule
      .filter((row) => isCollectible(row.status) && row.dueDate.slice(0, 10) <= asOfDate)
      .reduce(
        (sum, row) => sum + Math.max(0, Number(row.amount) - Number(row.paidAmount ?? 0)),
        getOutstandingFees(
          lateFees.filter((fee) => !fee.scheduleId || dueScheduleIds.has(fee.scheduleId)),
        ),
      ),
  );
}

export function getNextScheduledAmount(schedule: PaymentPreviewSchedule[]): number {
  const next = [...schedule]
    .filter((row) => isCollectible(row.status))
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())[0];

  return next ? roundMoney(Math.max(0, Number(next.amount) - Number(next.paidAmount ?? 0))) : 0;
}

export function buildPaymentAllocationPreview(
  schedule: PaymentPreviewSchedule[],
  payments: PaymentPreviewPayment[],
  paymentAmount: number,
  lateFees: PaymentLateFee[] = [],
): PaymentAllocationPreviewRow[] {
  const paidInterestBySchedule = new Map<string, number>();
  for (const allocation of payments.flatMap((payment) => payment.allocations ?? [])) {
    if (allocation.type !== 'INTEREST') continue;
    paidInterestBySchedule.set(
      allocation.scheduleId,
      (paidInterestBySchedule.get(allocation.scheduleId) ?? 0) + Number(allocation.amount),
    );
  }

  let remainingCents = Math.max(0, Math.round(paymentAmount * 100));
  const rows: PaymentAllocationPreviewRow[] = [];
  const pendingSchedule = [...schedule]
    .filter((row) => isCollectible(row.status))
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());

  for (const row of pendingSchedule) {
    if (remainingCents <= 0) break;
    const outstandingCents = Math.max(
      0,
      Math.round((Number(row.amount) - Number(row.paidAmount ?? 0)) * 100),
    );
    const appliedCents = Math.min(outstandingCents, remainingCents);
    const remainingInterestCents = Math.max(
      0,
      Math.round((Number(row.interestPart) - (paidInterestBySchedule.get(row.id) ?? 0)) * 100),
    );
    const interestCents = Math.min(appliedCents, remainingInterestCents);
    remainingCents -= appliedCents;
    const fee = lateFees.find((item) => item.scheduleId === row.id && !item.paid);
    const feeCents = fee
      ? Math.max(0, Math.round((Number(fee.amount) - Number(fee.paidAmount ?? 0)) * 100))
      : 0;
    const penaltyCents = Math.min(feeCents, remainingCents);
    remainingCents -= penaltyCents;
    if (appliedCents + penaltyCents === 0) continue;

    rows.push({
      scheduleId: row.id,
      dueDate: row.dueDate,
      applied: (appliedCents + penaltyCents) / 100,
      interest: interestCents / 100,
      principal: (appliedCents - interestCents) / 100,
      penalty: penaltyCents / 100,
    });
  }

  return rows;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
