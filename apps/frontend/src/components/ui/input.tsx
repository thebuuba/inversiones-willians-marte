import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'block w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm placeholder-ink-muted focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600',
          error && 'border-danger focus:border-danger focus:ring-danger',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';
