'use client';

import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { controlDensities } from './visual-system';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  density?: keyof typeof controlDensities;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, density = 'default', id, children, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;
    const describedBy = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className="mb-1.5 block text-sm font-bold text-text-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          className={cn(
            'block w-full border border-primary-border bg-white font-medium text-text-primary shadow-sm outline-none transition placeholder:text-text-subtle focus:border-primary-accent focus:ring-2 focus:ring-primary-soft',
            controlDensities[density],
            error && 'border-state-danger focus:border-state-danger focus:ring-state-danger-bg',
            className,
          )}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm font-medium text-state-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';
