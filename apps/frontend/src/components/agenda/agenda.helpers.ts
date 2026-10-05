import type { TaskItem } from '@inversiones/shared';

export type AgendaEventType = 'cobro' | 'visita' | 'llamada' | 'reunion';

export function getAgendaDate(value: string | Date = new Date()) {
  return new Date(value).toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' });
}

export function buildAgendaMonth(date: string): Array<string | null> {
  const [year, month] = date.split('-').map(Number);
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<string | null> = Array(offset).fill(null);
  for (let day = 1; day <= count; day++) {
    cells.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function getAgendaDayEvents(events: TaskItem[], date: string) {
  return events
    .filter((event) => event.dueDate && getAgendaDate(event.dueDate) === date)
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
}

export function getAgendaEventType(category: string): AgendaEventType {
  if (category === 'cobro' || category === 'visita' || category === 'llamada') return category;
  if (category === 'cliente') return 'llamada';
  return 'reunion';
}
