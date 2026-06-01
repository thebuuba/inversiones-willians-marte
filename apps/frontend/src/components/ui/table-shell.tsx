import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';

interface TableShellProps {
  children: ReactNode;
  minWidthClassName?: string;
  className?: string;
}

export function TableShell({ children, minWidthClassName, className }: TableShellProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <div className={cn(minWidthClassName)}>{children}</div>
      </div>
    </Card>
  );
}
