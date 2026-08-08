import type { InvestorInvestmentPaymentStatus } from '@inversiones/shared';

export interface InvestmentPeriodStatus {
  currentPeriodMonth: number;
  currentPeriodYear: number;
  nextDueDate: Date | null;
  paymentStatus: InvestorInvestmentPaymentStatus;
}

export function getInvestmentPeriodStatus(
  startDate: Date | string | null | undefined,
  payments: Array<{ periodMonth: number; periodYear: number }> = [],
  today = new Date(),
): InvestmentPeriodStatus {
  const targetPeriod = getTargetPeriod(startDate, today);
  const paid = payments.some(
    (payment) =>
      payment.periodMonth === targetPeriod.month && payment.periodYear === targetPeriod.year,
  );
  const nextDueDate = startDate
    ? dueDateForPeriod(new Date(startDate), targetPeriod.year, targetPeriod.month)
    : null;

  if (paid) {
    return {
      currentPeriodMonth: targetPeriod.month,
      currentPeriodYear: targetPeriod.year,
      nextDueDate,
      paymentStatus: 'PAID',
    };
  }
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
