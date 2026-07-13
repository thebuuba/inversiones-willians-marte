import type { CashLedgerMovement } from '@/lib/api/cash';

export type CashMovementFilter = 'all' | 'in' | 'out';

export function filterCashMovements(
  movements: CashLedgerMovement[],
  filter: CashMovementFilter,
  search: string,
  category: string,
) {
  const normalizedSearch = search.trim().toLocaleLowerCase('es');

  return movements.filter((movement) => {
    if (filter === 'in' && movement.type !== 'IN') return false;
    if (filter === 'out' && movement.type !== 'OUT') return false;
    if (category && movement.category !== category) return false;
    if (!normalizedSearch) return true;

    return [movement.person, movement.description, movement.code]
      .some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch));
  });
}

export function buildManualCashMovementDate(date: string, now = new Date()) {
  const localToday = now.toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' });
  if (date === localToday) return now.toISOString();
  return new Date(`${date}T12:00:00-04:00`).toISOString();
}
