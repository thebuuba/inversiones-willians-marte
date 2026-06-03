export interface CalendarDay {
  date: number;
  iso: string;
  inCurrentMonth: boolean;
  selected: boolean;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIsoDate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function getNextMonthIsoDate(from = new Date()): string {
  const day = from.getDate();
  const nextMonth = new Date(from.getFullYear(), from.getMonth() + 1, day);
  if (nextMonth.getDate() !== day) {
    nextMonth.setDate(0);
  }
  return toIsoDate(nextMonth);
}

export function buildCalendarWeeks(year: number, month: number, selectedIso = ''): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
  const weeks: CalendarDay[][] = [];

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const week: CalendarDay[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);
      const iso = toIsoDate(current);
      week.push({
        date: current.getDate(),
        iso,
        inCurrentMonth: current.getMonth() === month,
        selected: iso === selectedIso,
      });
    }
    weeks.push(week);
  }

  return weeks;
}
