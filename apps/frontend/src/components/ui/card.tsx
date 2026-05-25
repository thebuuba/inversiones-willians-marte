import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-lg border border-border bg-white shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-b border-border px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function MetricCard({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle?: string; icon?: ReactNode }) {
  return (
    <Card className="border-brand-100 p-6 shadow-[0_1px_0_rgba(15,122,58,0.08)]">
      <div className="mb-4 h-1 w-12 rounded-full bg-brand-600" />
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-ink-secondary">{title}</p>
          <p className="text-2xl font-bold text-ink">{value}</p>
          {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
        </div>
        {icon && <div className="text-ink-muted">{icon}</div>}
      </div>
    </Card>
  );
}
