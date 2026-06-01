import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getStatusTone, statusToneDots, statusTones, type StatusTone } from './visual-system';

export type BadgeTone = StatusTone;

interface BadgeProps {
  tone?: BadgeTone;
  status?: string;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone, status, dot, icon, className, children }: BadgeProps) {
  const resolvedTone = tone ?? getStatusTone(status);

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold', statusTones[resolvedTone], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', statusToneDots[resolvedTone])} />}
      {icon}
      {children}
    </span>
  );
}
