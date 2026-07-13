import assert from 'node:assert/strict';
import test from 'node:test';
import { buildManualCashMovementDate, filterCashMovements } from './cash-ledger.helpers';
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
