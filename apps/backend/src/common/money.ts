type MoneyValue = { toString(): string } | number | string;

export function moneyToCents(value: MoneyValue): number {
  const normalized = value.toString();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(normalized);
  const cents = match
    ? parseDecimalCents(match[1] === '-', match[2], match[3] ?? '')
    : Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(cents)) throw new RangeError('Money amount exceeds safe range');
  return cents;
}

export function centsToDecimal(cents: number): number {
  if (!Number.isSafeInteger(cents)) throw new RangeError('Money amount exceeds safe range');
  return cents / 100;
}

function parseDecimalCents(negative: boolean, whole: string, fraction: string): number {
  const wholeCents = Number(whole) * 100;
  const paddedFraction = `${fraction}00`;
  const fractionalCents = Number(paddedFraction.slice(0, 2));
  const rounding = Number(paddedFraction[2]) >= 5 ? 1 : 0;
  const absoluteCents = wholeCents + fractionalCents + rounding;
  return negative ? -absoluteCents : absoluteCents;
}
