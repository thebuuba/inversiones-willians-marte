type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface InvestmentPeriodStatus {
  currentPeriodMonth: number;
  currentPeriodYear: number;
  nextDueDate: Date | null;
  paymentStatus: PaymentStatus;
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
  if (nextDueDate && today.getTime() > nextDueDate.getTime()) {
    return {
      currentPeriodMonth: targetPeriod.month,
      currentPeriodYear: targetPeriod.year,
      nextDueDate,
      paymentStatus: 'OVERDUE',
    };
  }
  return {
    currentPeriodMonth: targetPeriod.month,
    currentPeriodYear: targetPeriod.year,
    nextDueDate,
    paymentStatus: 'PENDING',
  };
}

function getTargetPeriod(startDate: Date | string | null | undefined, today: Date) {
  const currentPeriod = { month: today.getMonth() + 1, year: today.getFullYear() };
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
  const lastDay = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(day, lastDay), 12);
}
