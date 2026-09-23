export const loanStatusVisuals = {
  CURRENT: {
    color: '#10b981',
    badgeClassName: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    dotClassName: 'bg-emerald-500',
  },
  PENDING: {
    color: '#f59e0b',
    badgeClassName: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    dotClassName: 'bg-amber-500',
  },
  LATE: {
    color: '#f43f5e',
    badgeClassName: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    dotClassName: 'bg-rose-500',
  },
  EXPIRED: {
    color: '#e11d48',
    badgeClassName: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    dotClassName: 'bg-rose-600',
  },
  PAID: {
    color: '#0ea5e9',
    badgeClassName: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    dotClassName: 'bg-sky-500',
  },
  WRITTEN_OFF: {
    color: '#64748b',
    badgeClassName: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
    dotClassName: 'bg-slate-500',
  },
} as const;

export function getLoanStatusBadgeClass(label: string) {
  const normalized = label.trim().toLowerCase();
  if (['al día', 'a tiempo', 'activo'].includes(normalized)) {
    return loanStatusVisuals.CURRENT.badgeClassName;
  }
  if (['pendiente', 'parcial', 'en revisión'].includes(normalized)) {
    return loanStatusVisuals.PENDING.badgeClassName;
  }
  if (normalized === 'atrasado') return loanStatusVisuals.LATE.badgeClassName;
  if (normalized === 'vencido') return loanStatusVisuals.EXPIRED.badgeClassName;
  if (['pagado', 'terminado'].includes(normalized)) {
    return loanStatusVisuals.PAID.badgeClassName;
  }
  return loanStatusVisuals.WRITTEN_OFF.badgeClassName;
}
