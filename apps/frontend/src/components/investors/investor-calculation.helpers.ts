import { formatDop } from '../../lib/currency.ts';

export function calculateMonthlyInterest(capital: number, portfolioRate: number): number | null {
  if (!Number.isFinite(capital) || !Number.isFinite(portfolioRate) || capital <= 0 || portfolioRate <= 0) {
    return null;
  }

  return capital * (portfolioRate / 100);
}

export function formatDopCurrency(value: number): string {
  return formatDop(value, { decimals: 2 });
}
