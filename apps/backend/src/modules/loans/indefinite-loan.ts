import type { PaymentFrequency } from '@inversiones/shared';

type Money = number | { toString(): string };

export interface IndefiniteCapitalMovement {
  amount: Money;
  effectiveDate: Date;
}

export function addPaymentInterval(date: Date, frequency: PaymentFrequency): Date {
  const next = new Date(date);
  if (frequency === 'DAILY') next.setUTCDate(next.getUTCDate() + 1);
  else if (frequency === 'WEEKLY') next.setUTCDate(next.getUTCDate() + 7);
  else if (frequency === 'BIWEEKLY') next.setUTCDate(next.getUTCDate() + 14);
  else if (frequency === 'QUARTERLY') next.setUTCMonth(next.getUTCMonth() + 3);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

export function getPeriodicRate(annualRate: Money, frequency: PaymentFrequency): number {
  const rate = Number(annualRate) / 100;
  if (frequency === 'DAILY') return rate / 360;
  if (frequency === 'WEEKLY') return rate / 52;
  if (frequency === 'BIWEEKLY') return rate / 26;
  if (frequency === 'QUARTERLY') return rate / 4;
  return rate / 12;
}

export function roundToNearestHundred(value: number): number {
  return Math.round(value / 100) * 100;
}

export function calculateIndefiniteInterest(
  principal: Money,
  annualRate: Money,
  frequency: PaymentFrequency,
): number {
  const rawInterest = Number(principal) * getPeriodicRate(annualRate, frequency);
  return rawInterest > 0 ? Math.max(100, roundToNearestHundred(rawInterest)) : 0;
}

export function calculateProratedIndefiniteInterest(params: {
  currentPrincipal: Money;
  annualRate: Money;
  frequency: PaymentFrequency;
  periodStart: Date;
  periodEnd: Date;
  capitalMovements: IndefiniteCapitalMovement[];
}): number {
  const { currentPrincipal, annualRate, frequency, periodStart, periodEnd, capitalMovements } =
    params;
  const originalPrincipal =
    Number(currentPrincipal) -
    capitalMovements.reduce((sum, movement) => sum + Number(movement.amount), 0);
  const capitalAtStart =
    originalPrincipal +
    capitalMovements
      .filter((movement) => movement.effectiveDate <= periodStart)
      .reduce((sum, movement) => sum + Number(movement.amount), 0);
  const rate = getPeriodicRate(annualRate, frequency);
  const periodDays = Math.max(1, daysBetween(periodStart, periodEnd));
  const proratedAdditions = capitalMovements
    .filter(
      (movement) => movement.effectiveDate > periodStart && movement.effectiveDate < periodEnd,
    )
    .reduce(
      (sum, movement) =>
        sum +
        Number(movement.amount) *
          rate *
          (daysBetween(movement.effectiveDate, periodEnd) / periodDays),
      0,
    );

  const rawInterest = capitalAtStart * rate + proratedAdditions;
  return rawInterest > 0 ? Math.max(100, roundToNearestHundred(rawInterest)) : 0;
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((utcDay(to) - utcDay(from)) / 86_400_000));
}

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
