import type { InvestorInvestmentPaymentStatus } from '@inversiones/shared';

export const investmentPaymentStatusVisuals: Record<
  InvestorInvestmentPaymentStatus,
  { label: string; className: string }
> = {
  PAID: { label: 'Pagado', className: 'bg-state-success-bg text-state-success' },
  SCHEDULED: {
    label: 'Programado',
    className: 'bg-surface-muted-ui text-text-secondary',
  },
  UPCOMING: { label: 'Próximo', className: 'bg-state-info-bg text-state-info' },
  PENDING: { label: 'Pendiente', className: 'bg-state-warning-bg text-state-warning' },
  OVERDUE: { label: 'Atrasado', className: 'bg-state-danger-bg text-state-danger' },
};
