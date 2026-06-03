import { formatDop } from '../../lib/currency';

export function formatInvestorCurrency(value: number | string): string {
  return formatDop(value);
}
