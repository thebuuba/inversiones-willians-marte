import type { InvestorPaymentItem } from '@inversiones/shared';

export function formatPaymentPeriods(
  payment: Pick<InvestorPaymentItem, 'periodMonth' | 'periodYear' | 'allocations'>,
): string {
  const periods = payment.allocations?.length ? payment.allocations : [payment];
  return [
    ...new Set(
      periods.map((period) => {
        const month = new Intl.DateTimeFormat('es-DO', { month: 'long', timeZone: 'UTC' }).format(
          new Date(Date.UTC(period.periodYear, period.periodMonth - 1, 1)),
        );
        return `${month[0].toUpperCase()}${month.slice(1)} ${period.periodYear}`;
      }),
    ),
  ].join(', ');
}
