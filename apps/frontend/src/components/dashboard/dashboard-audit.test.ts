import assert from 'node:assert/strict';
import test from 'node:test';
import { toDashboardAuditRow } from './dashboard-audit.ts';

test('maps the audit API contract to a readable dashboard row', () => {
  const row = toDashboardAuditRow({
    id: 'audit-1',
    userId: 'user-1',
    action: 'PAYMENT_CREATED',
    entityType: 'Payment',
    entityId: 'payment-123456789',
    oldValues: null,
    newValues: { amount: 4250, loanId: 'loan-1' },
    loanId: 'loan-1',
    loanNumber: 12,
    createdAt: '2026-07-20T12:00:00.000Z',
    user: { id: 'user-1', name: 'María Pérez' },
  });

  assert.equal(row.actor, 'María Pérez');
  assert.equal(row.action, 'registró un pago');
  assert.equal(row.reference, 'Préstamo #12');
  assert.equal(row.loanHref, '/prestamos/loan-1');
  assert.equal(row.tone, 'success');
});

test('keeps unknown audit actions readable and safe', () => {
  const row = toDashboardAuditRow({
    id: 'audit-2',
    userId: 'user-1',
    action: 'CUSTOM_ACTION',
    entityType: 'CustomEntity',
    entityId: '42',
    createdAt: '2026-07-20T12:00:00.000Z',
    user: null,
  });

  assert.equal(row.actor, 'Sistema');
  assert.equal(row.action, 'custom action');
  assert.equal(row.reference, 'Custom entity');
  assert.equal(row.tone, 'neutral');
});
