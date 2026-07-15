export interface PaymentPreviewSchedule {
  id: string;
  dueDate: string;
  amount: number | string;
  interestPart: number | string;
  paidAmount?: number | string | null;
  status: string;
}

export interface PaymentPreviewPayment {
  allocations?: Array<{
    scheduleId: string;
    amount: number | string;
    type: string;
  }>;
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
