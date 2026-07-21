'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { buildCalendarWeeks, parseIsoDate } from './date-picker.helpers';

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getInitialMonth(value: string): Date {
  return parseIsoDate(value) ?? new Date();
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

interface DatePickerInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  invalid?: boolean;
}

export function DatePickerInput({
  id,
  value,
  onChange,
  className = '',
  placeholder = 'yyyy-mm-dd',
  invalid = false,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialMonth(value));
  const rootRef = useRef<HTMLDivElement>(null);
  const weeks = useMemo(
    () => buildCalendarWeeks(visibleMonth.getFullYear(), visibleMonth.getMonth(), value),
    [value, visibleMonth],
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function moveMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDate(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setVisibleMonth(getInitialMonth(value));
          setOpen((current) => !current);
        }}
        className={`${className} flex items-center justify-between text-left ${invalid ? 'border-state-danger' : ''}`}
      >
        <span className={value ? '' : 'text-text-subtle'}>{value || placeholder}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-text-secondary" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-[80] w-[292px] rounded-panel border border-border-soft bg-card p-4 text-text-secondary shadow-modal">
          <div className="mb-4 grid grid-cols-[32px_1fr_32px] items-center">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => moveMonth(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-control-compact font-bold text-text-secondary hover:bg-surface-subtle"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={3} />
            </button>
            <p className="text-center text-lg font-bold">{monthLabel(visibleMonth)}</p>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => moveMonth(1)}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-control-compact font-bold text-text-secondary hover:bg-surface-subtle"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-2">
            {weekdays.map((day) => (
              <div key={day} className="flex h-7 items-center justify-center text-base font-bold">
                {day}
              </div>
            ))}
            {weeks.flat().map((day) => (
              <button
                key={day.iso}
                type="button"
                onClick={() => selectDate(day.iso)}
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-md text-base font-medium transition ${
                  day.selected
                    ? 'bg-primary-accent font-bold text-text-inverse'
                    : day.inCurrentMonth
                      ? 'text-text-secondary hover:bg-surface-subtle'
                      : 'text-text-subtle hover:bg-surface-subtle'
                }`}
              >
                {day.date}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
