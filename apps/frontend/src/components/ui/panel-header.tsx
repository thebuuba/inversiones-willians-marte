import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PanelHeader({ eyebrow, title, description, actions, className }: PanelHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-1.5">
        {eyebrow && <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary-accent">{eyebrow}</div>}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{title}</h1>
          {description && <p className="max-w-3xl text-sm leading-6 text-text-secondary">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
