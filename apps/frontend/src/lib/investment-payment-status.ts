import type { InvestorInvestmentPaymentStatus } from '@inversiones/shared';
import { loanStatusVisuals } from './loan-status-visuals';

export const investmentPaymentStatusVisuals: Record<
  InvestorInvestmentPaymentStatus,
  { label: string; className: string }
> = {
  PAID: { label: 'A tiempo', className: loanStatusVisuals.CURRENT.badgeClassName },
  SCHEDULED: {
    label: 'A tiempo',
    className: loanStatusVisuals.CURRENT.badgeClassName,
  },
  UPCOMING: { label: 'Próximo', className: loanStatusVisuals.PAID.badgeClassName },
  PENDING: { label: 'Pendiente', className: loanStatusVisuals.PENDING.badgeClassName },
  OVERDUE: { label: 'Atrasado', className: loanStatusVisuals.LATE.badgeClassName },
};
