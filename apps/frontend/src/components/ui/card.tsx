import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  index?: number;
}

interface CardHeaderVisualProps {
  icon?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  iconBg?: string;
  iconColor?: string;
}

type CardHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & CardHeaderVisualProps;

export function Card({ className, children, index: _index, ...props }: CardProps) {
  void _index;

  return (
    <div className={cn('rounded-panel border border-border-soft bg-card shadow-card', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, icon, title, subtitle, iconBg, iconColor, ...props }: CardHeaderProps) {
  return (
    <div className={cn('border-b border-border-soft px-6 py-4', className)} {...props}>
      {children ?? (
        <div className="flex items-start gap-3">
          {icon && <div className={cn('rounded-full bg-primary-soft p-2 text-primary', iconBg, iconColor)}>{icon}</div>}
          <div className="space-y-1">
            {title && <h2 className="text-lg font-bold text-text-primary">{title}</h2>}
            {subtitle && <p className="text-sm leading-6 text-text-secondary">{subtitle}</p>}
          </div>
        </div>
      )}
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
    <Card className="p-6">
      <div className="mb-4 h-1 w-12 rounded-full bg-primary" />
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>
    </Card>
  );
}
