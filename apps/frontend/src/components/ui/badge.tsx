import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const colors: Record<string, string> = {
  active: 'bg-success-bg text-success',
  paid: 'bg-info-bg text-info',
  overdue: 'bg-danger-bg text-danger',
  pending: 'bg-warning-bg text-warning',
  default: 'bg-surface-muted text-ink-secondary',
};

export function Badge({ status, children }: { status?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colors[status ?? 'default'] ?? colors.default)}>
      {children}
    </span>
  );
}
