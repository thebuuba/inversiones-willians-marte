import { formatDop } from '../../lib/currency.ts';

export function formatInvestorCurrency(value: number | string): string {
  return formatDop(value);
}
