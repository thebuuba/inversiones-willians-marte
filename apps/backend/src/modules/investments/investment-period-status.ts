import type { InvestorInvestmentPaymentStatus } from '@inversiones/shared';

type Money = number | string | { toString(): string };
type Payment = {
  id?: string;
  receiptNumber?: number;
  periodMonth: number;
  periodYear: number;
  amount?: Money;
};
type Movement = { amount: Money; movementDate: Date | string };
export interface InterestAllocation {
  periodMonth: number;
  periodYear: number;
  amount: number;
}
export interface InterestPeriod extends InterestAllocation {
  dueDate: Date;
  paidAmount: number;
  balance: number;
}
export interface InvestmentPeriodStatus {
  currentPeriodMonth: number;
  currentPeriodYear: number;
  nextDueDate: Date | null;
  paymentStatus: InvestorInvestmentPaymentStatus;
  currentPeriodBalance: number;
  pendingAmount: number;
  pendingMonths: number;
  totalPaid: number;
  pendingPeriods: InterestPeriod[];
  paymentAllocations: Record<string, InterestAllocation[]>;
}

const cents = (value: Money) => Math.round(Number(value) * 100);
const monthIndex = (year: number, month: number) => year * 12 + month - 1;
const periodAt = (index: number) => ({
  periodYear: Math.floor(index / 12),
  periodMonth: (index % 12) + 1,
});
export function investmentBusinessDate(value: Date): Date {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Santo_Domingo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const part = (name: string) => Number(parts.find((item) => item.type === name)?.value);
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day'), 12));
}

// Interest is simple. A payment can settle several consecutive monthly periods.
// Integer cents keep partial settlements exact; additions never revise earlier dues.
export function getInvestmentPeriodStatus(
  startDate: Date | string | null | undefined,
  payments: Payment[] = [],
  today = new Date(),
  monthlyPayment?: Money,
  options: { rate?: Money; capital?: Money; movements?: Movement[] } = {},
): InvestmentPeriodStatus {
  const day = investmentBusinessDate(today);
  const start = startDate ? new Date(startDate) : null;
  const validStart = start && Number.isFinite(start.getTime()) ? start : null;
  const firstIndex = validStart
    ? monthIndex(validStart.getUTCFullYear(), validStart.getUTCMonth() + 1) + 1
    : monthIndex(day.getUTCFullYear(), day.getUTCMonth() + 1);
  const baseAmount = monthlyPayment === undefined ? 1 : Math.max(0, cents(monthlyPayment));
  const periods = new Map<number, { dueDate: Date; expected: number; paid: number }>();
  const allocations: Record<string, InterestAllocation[]> = {};
  function getPeriod(index: number) {
    const existing = periods.get(index);
    if (existing) return existing;
    const { periodYear, periodMonth } = periodAt(index);
    const lastDay = new Date(Date.UTC(periodYear, periodMonth, 0)).getUTCDate();
    const dueDate = new Date(
      Date.UTC(
        periodYear,
        periodMonth - 1,
        Math.min(validStart?.getUTCDate() ?? day.getUTCDate(), lastDay),
        12,
      ),
    );
    const laterAdditions = (options.movements ?? []).filter((movement) => {
      const added = new Date(movement.movementDate);
      const month = added.getUTCMonth() + 1;
      const firstDue = new Date(
        Date.UTC(
          added.getUTCFullYear(),
          month,
          Math.min(
            added.getUTCDate(),
            new Date(Date.UTC(added.getUTCFullYear(), month + 1, 0)).getUTCDate(),
          ),
          12,
        ),
      );
      return dueDate < firstDue;
    });
    const laterCapitalCents = laterAdditions.reduce(
      (sum, movement) => sum + cents(movement.amount),
      0,
    );
    const capitalCents = options.capital === undefined ? undefined : cents(options.capital);
    const rate = Number(options.rate ?? 0);
    // Keep agreed legacy monthly amounts; new contracts already calculate them from capital/rate.
    const contractAdjustment =
      capitalCents !== undefined && options.rate !== undefined
        ? baseAmount - Math.round((capitalCents * rate) / 100)
        : 0;
    const expected = Math.max(
      0,
      capitalCents !== undefined && options.rate !== undefined
        ? Math.round(((capitalCents - laterCapitalCents) * rate) / 100) + contractAdjustment
        : baseAmount - Math.round((laterCapitalCents * rate) / 100),
    );
    const period = { dueDate, expected, paid: 0 };
    periods.set(index, period);
    return period;
  }
  for (const payment of [...payments].sort(
    (a, b) =>
      monthIndex(a.periodYear, a.periodMonth) - monthIndex(b.periodYear, b.periodMonth) ||
      (a.receiptNumber ?? 0) - (b.receiptNumber ?? 0),
  )) {
    let index = monthIndex(payment.periodYear, payment.periodMonth);
    let remaining = Math.max(0, monthlyPayment === undefined ? 1 : cents(payment.amount ?? 0));
    const portions: InterestAllocation[] = [];
    // Preserve payments recorded before the first full month as historical receipts.
    if (index < firstIndex) {
      if (payment.id)
        allocations[payment.id] = [
          {
            periodMonth: payment.periodMonth,
            periodYear: payment.periodYear,
            amount: remaining / 100,
          },
        ];
      continue;
    }
    while (remaining > 0) {
      const period = getPeriod(index);
      if (period.expected === 0) break;
      const applied = Math.min(remaining, Math.max(0, period.expected - period.paid));
      if (applied > 0) {
        period.paid += applied;
        remaining -= applied;
        portions.push({ ...periodAt(index), amount: applied / 100 });
      }
      index += 1;
    }
    if (payment.id) allocations[payment.id] = portions;
  }
  const currentIndex = monthIndex(day.getUTCFullYear(), day.getUTCMonth() + 1);
  for (let index = firstIndex; index <= currentIndex; index += 1) getPeriod(index);
  let targetIndex = firstIndex;
  if (baseAmount > 0) {
    const horizon = Math.max(
      currentIndex + 1,
      ...[...periods.keys()].map((index) => index + 1),
      ...(options.movements ?? []).map((movement) => {
        const date = new Date(movement.movementDate);
        return monthIndex(date.getUTCFullYear(), date.getUTCMonth() + 1) + 2;
      }),
    );
    while (targetIndex < horizon && getPeriod(targetIndex).paid >= getPeriod(targetIndex).expected)
      targetIndex += 1;
  }
  const target = getPeriod(targetIndex);
  const pendingPeriods = validStart
    ? [...periods.entries()]
        .filter(([, period]) => period.dueDate <= day && period.expected > period.paid)
        .sort(([a], [b]) => a - b)
        .map(([index, period]) => ({
          ...periodAt(index),
          dueDate: period.dueDate,
          amount: period.expected / 100,
          paidAmount: period.paid / 100,
          balance: (period.expected - period.paid) / 100,
        }))
    : [];
  const days = (day.getTime() - target.dueDate.getTime()) / 86400000;
  const paymentStatus: InvestorInvestmentPaymentStatus =
    !validStart || target.expected === 0 || days < -5
      ? 'SCHEDULED'
      : days < 0
        ? 'UPCOMING'
        : days <= 5
          ? 'PENDING'
          : 'OVERDUE';
  const targetPeriod = periodAt(targetIndex);
  return {
    currentPeriodMonth: targetPeriod.periodMonth,
    currentPeriodYear: targetPeriod.periodYear,
    nextDueDate: validStart && target.expected > 0 ? target.dueDate : null,
    paymentStatus,
    currentPeriodBalance: (target.expected - target.paid) / 100,
    pendingAmount: pendingPeriods.reduce((sum, period) => sum + cents(period.balance), 0) / 100,
    pendingMonths: pendingPeriods.length,
    totalPaid: payments.reduce((sum, payment) => sum + cents(payment.amount ?? 0), 0) / 100,
    pendingPeriods,
    paymentAllocations: allocations,
  };
}
