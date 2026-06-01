'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabItem {
  value: string;
  label: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('inline-flex flex-wrap items-center gap-1 rounded-full border border-border-soft bg-surface-subtle p-1', className)} role="tablist">
      {items.map((item) => {
        const selected = item.value === active;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent',
              selected ? 'bg-primary text-text-inverse shadow-card' : 'text-text-secondary hover:bg-primary-soft hover:text-primary',
            )}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
