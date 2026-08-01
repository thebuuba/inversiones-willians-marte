import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCashClosingPrintDocument,
  buildManualCashMovementDate,
  filterCashMovements,
  shiftCashLedgerDate,
} from './cash-ledger.helpers';
import type { CashLedgerMovement } from '@/lib/api/cash';

const movements: CashLedgerMovement[] = [
  {
    id: '1',
    type: 'IN',
    person: 'Ana Pérez',
    code: 'PAG-1',
    description: 'Pago semanal',
    amount: 1000,
    movementDate: '2026-07-13T14:00:00.000Z',
    category: 'Pago de préstamo',
    affectsBalance: true,
    sourceType: 'PAYMENT',
    registeredBy: 'Nata',
  },
  {
    id: '2',
    type: 'OUT',
    person: 'Luis Díaz',
    code: 'PRE-2',
    description: 'Desembolso',
    amount: 5000,
    movementDate: '2026-07-13T15:00:00.000Z',
    category: 'Desembolso',
    affectsBalance: false,
    sourceType: 'LOAN',
    registeredBy: 'Nata',
  },
];

test('filters the daily ledger by direction, category and person', () => {
  assert.deepEqual(filterCashMovements(movements, 'in', 'ana', 'Pago de préstamo'), [movements[0]]);
  assert.deepEqual(filterCashMovements(movements, 'out', '', ''), [movements[1]]);
  assert.deepEqual(filterCashMovements(movements, 'external', '', ''), [movements[1]]);
});

test('uses noon in Santo Domingo when entering a historical movement', () => {
  assert.equal(
    buildManualCashMovementDate('2026-07-12', new Date('2026-07-13T18:00:00.000Z')),
    '2026-07-12T16:00:00.000Z',
  );
});

test('moves between cash ledger days across month boundaries', () => {
  assert.equal(shiftCashLedgerDate('2026-07-31', 1), '2026-08-01');
  assert.equal(shiftCashLedgerDate('2026-08-01', -1), '2026-07-31');
});

test('prints the complete daily closing without operational codes or times', () => {
  const html = buildCashClosingPrintDocument(
    {
      date: '2026-07-13',
      movements,
      totals: { openingBalance: 0, income: 1000, expense: 0, balance: 1000 },
    },
    'IWM <Central>',
  );

  assert.match(html, /CUADRE DEL DÍA/);
  assert.match(html, /IWM &lt;Central&gt;/);
  assert.match(html, /Ana Pérez/);
  assert.doesNotMatch(html, /PAG-1/);
  assert.doesNotMatch(html, /14:00/);
});
