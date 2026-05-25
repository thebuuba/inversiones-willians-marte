import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const colors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  paid: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  default: 'bg-gray-100 text-gray-800',
};

export function Badge({ status, children }: { status?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colors[status ?? 'default'] ?? colors.default)}>
      {children}
    </span>
  );
}
