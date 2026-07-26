'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ModalShell({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  className,
}: ModalShellProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        className="absolute inset-0 bg-black/45"
        type="button"
        aria-label="Cerrar modal"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-panel bg-card shadow-modal',
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-soft px-6 py-5">
          <div className="flex items-start gap-3">
            {icon && <div className="rounded-full bg-primary-soft p-2 text-primary">{icon}</div>}
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-text-primary">{title}</h2>
              {description && (
                <p className="text-sm leading-6 text-text-secondary">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none text-text-muted transition hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-border-soft px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
