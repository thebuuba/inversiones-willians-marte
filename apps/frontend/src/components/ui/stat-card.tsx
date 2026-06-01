import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';

interface StatCardProps {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  accentClassName?: string;
  className?: string;
}

export function StatCard({ icon, label, value, detail, accentClassName, className }: StatCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className={cn('mb-4 h-1 w-12 rounded-full bg-primary', accentClassName)} />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-bold text-text-secondary">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {detail && <p className="text-xs font-medium text-text-muted">{detail}</p>}
        </div>
        {icon && <div className="rounded-full bg-primary-soft p-2 text-primary">{icon}</div>}
      </div>
    </Card>
  );
}
