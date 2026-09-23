import { loanStatusVisuals } from '@/lib/loan-status-visuals';

export const buttonVariants = {
  primary: 'bg-primary text-text-inverse hover:bg-primary-hover',
  secondary: 'bg-surface-muted text-text-primary hover:bg-primary-soft',
  outline: 'border border-border text-text-primary hover:bg-primary-soft',
  ghost: 'text-text-secondary hover:bg-primary-soft',
  danger: 'bg-state-danger text-text-inverse hover:opacity-90',
  soft: 'border border-primary-border bg-primary-soft text-primary hover:bg-primary-border',
} as const;

export const buttonSizes = {
  compact: 'h-9 px-4 text-xs',
  default: 'h-11 px-6 text-sm',
  comfortable: 'h-12 px-7 text-sm',
} as const;

export const controlDensities = {
  compact: 'h-[42px] rounded-control-compact px-3 text-sm',
  default: 'h-11 rounded-control px-4 text-sm',
  comfortable: 'h-[52px] rounded-control-comfortable px-4 text-sm',
} as const;

export const statusTones = {
  success: loanStatusVisuals.CURRENT.badgeClassName,
  pending: loanStatusVisuals.PENDING.badgeClassName,
  warning: loanStatusVisuals.PENDING.badgeClassName,
  danger: loanStatusVisuals.EXPIRED.badgeClassName,
  info: loanStatusVisuals.PAID.badgeClassName,
  neutral: 'bg-state-neutral-bg text-state-neutral',
} as const;

export const statusToneDots = {
  success: loanStatusVisuals.CURRENT.dotClassName,
  pending: loanStatusVisuals.PENDING.dotClassName,
  warning: loanStatusVisuals.PENDING.dotClassName,
  danger: loanStatusVisuals.EXPIRED.dotClassName,
  info: loanStatusVisuals.PAID.dotClassName,
  neutral: 'bg-state-neutral-dot',
} as const;

export type StatusTone = keyof typeof statusTones;

export const statusToneMap: Record<string, StatusTone> = {
  active: 'success',
  activo: 'success',
  'al día': 'success',
  approved: 'success',
  aprobado: 'success',
  aprobada: 'success',
  success: 'success',
  overdue: 'danger',
  atrasado: 'danger',
  atrasada: 'danger',
  vencido: 'danger',
  vencida: 'danger',
  rejected: 'danger',
  rechazado: 'danger',
  rechazada: 'danger',
  danger: 'danger',
  pending: 'pending',
  pendiente: 'pending',
  paused: 'warning',
  pausado: 'warning',
  review: 'warning',
  'en revisión': 'warning',
  info: 'info',
  paid: 'info',
  pagado: 'info',
  pagada: 'info',
  inactive: 'neutral',
  inactivo: 'neutral',
  withdrawn: 'neutral',
  retirado: 'neutral',
  default: 'neutral',
  neutral: 'neutral',
};

export function getStatusTone(status?: string): StatusTone {
  return statusToneMap[status?.trim().toLowerCase() ?? 'default'] ?? 'neutral';
}

export const navItems = [
  { href: '/inicio', label: 'Inicio', icon: 'home' },
  { href: '/clientes', label: 'Clientes', icon: 'users' },
  { href: '/prestamos', label: 'Préstamos', icon: 'landmark' },
  { href: '/solicitudes', label: 'Solicitudes', icon: 'inbox' },
  { href: '/agenda', label: 'Agenda', icon: 'calendar' },
  { href: '/recibos', label: 'Recibos', icon: 'receipt-text' },
  { href: '/caja', label: 'Caja', icon: 'wallet' },
  { href: '/inversionistas', label: 'Inversionistas', icon: 'trending-up' },
  { href: '/documentos', label: 'Documentos', icon: 'file-text' },
  { href: '/carteras', label: 'Carteras', icon: 'briefcase' },
  { href: '/configuracion', label: 'Configuración', icon: 'settings' },
] as const;
