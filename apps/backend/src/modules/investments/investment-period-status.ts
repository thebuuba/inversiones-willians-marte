import type { InvestorInvestmentPaymentStatus } from '@inversiones/shared';

export interface InvestmentPeriodStatus {
  currentPeriodMonth: number;
  currentPeriodYear: number;
  nextDueDate: Date | null;
  paymentStatus: InvestorInvestmentPaymentStatus;
}

export function getInvestmentPeriodStatus(
  startDate: Date | string | null | undefined,
  payments: Array<{ periodMonth: number; periodYear: number; amount?: number | string }> = [],
  today = new Date(),
  monthlyPayment?: number | string,
): InvestmentPeriodStatus {
  let targetPeriod = getTargetPeriod(startDate, today);
  const requiredAmount = monthlyPayment === undefined ? undefined : Number(monthlyPayment);
  const totalsByPeriod = new Map<string, number>();
  for (const payment of payments) {
    const key = `${payment.periodYear}-${payment.periodMonth}`;
    totalsByPeriod.set(key, (totalsByPeriod.get(key) ?? 0) + Number(payment.amount ?? 0));
  }
  const paidPeriods = new Set(
    requiredAmount === undefined
      ? payments.map((payment) => `${payment.periodYear}-${payment.periodMonth}`)
      : [...totalsByPeriod.entries()]
          .filter(([, total]) => total >= requiredAmount)
          .map(([period]) => period),
  );
  while (paidPeriods.has(`${targetPeriod.year}-${targetPeriod.month}`)) {
    targetPeriod = nextPeriod(targetPeriod);
  }
  const nextDueDate = startDate
    ? dueDateForPeriod(new Date(startDate), targetPeriod.year, targetPeriod.month)
    : null;

  if (!nextDueDate) {
    return {
      currentPeriodMonth: targetPeriod.month,
      currentPeriodYear: targetPeriod.year,
      nextDueDate,
      paymentStatus: 'SCHEDULED',
    };
  }

  const daysFromDueDate = daysBetweenUtc(nextDueDate, today);
  let paymentStatus: InvestorInvestmentPaymentStatus;
  if (daysFromDueDate < -5) paymentStatus = 'SCHEDULED';
  else if (daysFromDueDate < 0) paymentStatus = 'UPCOMING';
  else if (daysFromDueDate <= 5) paymentStatus = 'PENDING';
  else paymentStatus = 'OVERDUE';

  return {
    currentPeriodMonth: targetPeriod.month,
    currentPeriodYear: targetPeriod.year,
    nextDueDate,
    paymentStatus,
  };
}

function nextPeriod(period: { month: number; year: number }) {
  return period.month === 12
    ? { month: 1, year: period.year + 1 }
    : { month: period.month + 1, year: period.year };
}

function getTargetPeriod(startDate: Date | string | null | undefined, today: Date) {
  const currentPeriod = { month: today.getUTCMonth() + 1, year: today.getUTCFullYear() };
  if (!startDate) return currentPeriod;

  const start = new Date(startDate);
  const startPeriod = { month: start.getUTCMonth() + 1, year: start.getUTCFullYear() };
  if (
    startPeriod.year > currentPeriod.year ||
    (startPeriod.year === currentPeriod.year && startPeriod.month > currentPeriod.month)
  ) {
    return startPeriod;
  }

  return currentPeriod;
}

function dueDateForPeriod(startDate: Date, year: number, month: number) {
  const day = startDate.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1, Math.min(day, lastDay), 12));
}

function daysBetweenUtc(from: Date, to: Date) {
  const fromDay = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const toDay = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((toDay - fromDay) / 86_400_000);
}
