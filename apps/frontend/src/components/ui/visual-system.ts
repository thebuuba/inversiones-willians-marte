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
  success: 'bg-state-success-bg text-state-success',
  warning: 'bg-state-warning-bg text-state-warning',
  danger: 'bg-state-danger-bg text-state-danger',
  info: 'bg-state-info-bg text-state-info',
  neutral: 'bg-state-neutral-bg text-state-neutral',
} as const;

export const statusToneDots = {
  success: 'bg-state-success-dot',
  warning: 'bg-state-warning-dot',
  danger: 'bg-state-danger-dot',
  info: 'bg-state-info-dot',
  neutral: 'bg-state-neutral-dot',
} as const;

export type StatusTone = keyof typeof statusTones;

export const statusToneMap: Record<string, StatusTone> = {
  active: 'success',
  activo: 'success',
  'al día': 'success',
  approved: 'success',
  aprobado: 'success',
  success: 'success',
  overdue: 'danger',
  atrasado: 'danger',
  vencido: 'danger',
  rejected: 'danger',
  rechazado: 'danger',
  danger: 'danger',
  pending: 'warning',
  pendiente: 'warning',
  paused: 'warning',
  review: 'info',
  info: 'info',
  paid: 'neutral',
  pagado: 'neutral',
  inactive: 'neutral',
  inactivo: 'neutral',
  withdrawn: 'neutral',
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
  { href: '/caja', label: 'Caja', icon: 'wallet' },
  { href: '/inversionistas', label: 'Inversionistas', icon: 'trending-up' },
  { href: '/documentos', label: 'Documentos', icon: 'file-text' },
  { href: '/recordatorios', label: 'Recordatorios', icon: 'bell' },
  { href: '/configuracion', label: 'Configuración', icon: 'settings' },
] as const;
