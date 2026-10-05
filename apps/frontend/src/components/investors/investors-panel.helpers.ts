import { formatDop } from '../../lib/currency.ts';
import type { InvestorItem } from '@inversiones/shared';

export function formatInvestorCurrency(value: number | string): string {
  return formatDop(value);
}

export function getInvestorOverview(
  investors: Pick<
    InvestorItem,
    'capital' | 'monthlyPayment' | 'totalCapital' | 'totalMonthlyReturn' | 'yearGainsPaid'
  >[],
) {
  const capital = investors.reduce(
    (sum, investor) => sum + Number(investor.totalCapital ?? investor.capital),
    0,
  );
  const monthlyReturn = investors.reduce(
    (sum, investor) => sum + Number(investor.totalMonthlyReturn ?? investor.monthlyPayment),
    0,
  );
  return {
    capital,
    rate: capital > 0 ? (monthlyReturn / capital) * 100 : 0,
    yearGains: investors.some((investor) => investor.yearGainsPaid === undefined)
      ? null
      : investors.reduce((sum, investor) => sum + Number(investor.yearGainsPaid), 0),
  };
}
