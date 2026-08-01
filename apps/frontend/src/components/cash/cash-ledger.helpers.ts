import type { CashLedgerDay, CashLedgerMovement } from '@/lib/api/cash';
import { formatDop } from '@/lib/currency';

export type CashMovementFilter = 'all' | 'in' | 'out' | 'external';

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
    if (filter === 'external' && movement.affectsBalance) return false;
    if (category && movement.category !== category) return false;
    if (!normalizedSearch) return true;

    return [movement.person, movement.description, movement.code].some((value) =>
      value.toLocaleLowerCase('es').includes(normalizedSearch),
    );
  });
}

export function buildManualCashMovementDate(date: string, now = new Date()) {
  const localToday = now.toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' });
  if (date === localToday) return now.toISOString();
  return new Date(`${date}T12:00:00-04:00`).toISOString();
}

export function shiftCashLedgerDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function escapePrintHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function buildCashClosingPrintDocument(ledger: CashLedgerDay, companyName: string) {
  const dateLabel = new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${ledger.date}T12:00:00`));
  const rows = ledger.movements
    .map(
      (movement) => `<tr>
        <td>${movement.type === 'IN' ? 'Entrada' : 'Salida'}</td>
        <td><strong>${escapePrintHtml(movement.person)}</strong><br><small>${escapePrintHtml(movement.description)}</small></td>
        <td>${escapePrintHtml(movement.category)}${movement.affectsBalance ? '' : '<br><small>Externo</small>'}</td>
        <td class="amount ${movement.type === 'IN' ? 'income' : 'expense'}">${movement.type === 'IN' ? '+' : '-'}${formatDop(movement.amount)}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
    <title>Cuadre de caja - ${escapePrintHtml(ledger.date)}</title>
    <style>
      @page { size: letter portrait; margin: 14mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #17231d; font: 12px Arial, sans-serif; }
      header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #285c43; padding-bottom: 14px; }
      h1 { margin: 0; font-size: 22px; } h2 { margin: 0; color: #285c43; font-size: 18px; text-align: right; }
      p { margin: 4px 0 0; } .date { text-transform: capitalize; text-align: right; }
      .totals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; }
      .total { border: 1px solid #cddbd3; padding: 12px; } .total span { display: block; color: #5d6d64; font-size: 10px; text-transform: uppercase; }
      .total strong { display: block; margin-top: 5px; font-size: 17px; }
      table { width: 100%; border-collapse: collapse; } th { background: #edf7f1; color: #285c43; text-align: left; }
      th, td { border-bottom: 1px solid #d8e1dc; padding: 9px 7px; vertical-align: top; } th:last-child, .amount { text-align: right; white-space: nowrap; }
      .income { color: #08783f; } .expense { color: #b42318; } small { color: #5d6d64; }
      footer { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 70px; text-align: center; }
      footer div { border-top: 1px solid #17231d; padding-top: 8px; }
      @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
    </style></head><body>
      <header><div><h1>${escapePrintHtml(companyName || 'Inversiones Willians Marte')}</h1><p>Libro diario de caja</p></div><div><h2>CUADRE DEL DÍA</h2><p class="date">${escapePrintHtml(dateLabel)}</p></div></header>
      <section class="totals"><div class="total"><span>Entradas</span><strong>${formatDop(ledger.totals.income)}</strong></div><div class="total"><span>Salidas</span><strong>${formatDop(ledger.totals.expense)}</strong></div><div class="total"><span>Cuadre</span><strong>${formatDop(ledger.totals.balance)}</strong></div></section>
      <table><thead><tr><th>Tipo</th><th>Persona o concepto</th><th>Categoría</th><th>Monto</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No hay movimientos registrados.</td></tr>'}</tbody></table>
      <footer><div>Preparado por</div><div>Revisado por</div></footer>
    </body></html>`;
}
