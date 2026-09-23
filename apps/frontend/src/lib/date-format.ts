const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatShortDate(value: string | Date): string {
  const iso = typeof value === 'string' ? value : value.toISOString();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '—';
  return `${Number(match[3])} ${months[Number(match[2]) - 1] ?? ''}, ${match[1]}`;
}

export function formatRelativeDate(value: string | Date, now = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida';
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  if (hours < 48) return 'Ayer';
  return formatShortDate(date);
}
