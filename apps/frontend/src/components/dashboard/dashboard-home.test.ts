import test from 'node:test';
import assert from 'node:assert/strict';
import { getAgingBuckets, getDueTodayTotal } from './dashboard-home';
import type { CollectionPriority, UpcomingPayment } from '@/lib/api/dashboard';

test('sums only payments due today', () => {
  const payments = [
    { dueDate: '2026-07-24T10:00:00.000Z', amount: 100 },
    { dueDate: '2026-07-25T10:00:00.000Z', amount: 200 },
    { dueDate: '2026-07-24T18:00:00.000Z', amount: 300 },
  ] as UpcomingPayment[];

  assert.equal(getDueTodayTotal(payments, new Date('2026-07-24T12:00:00')), 400);
});

test('groups overdue priorities by age', () => {
  const priorities = [
    { daysOverdue: 5, overdueAmount: 100 },
    { daysOverdue: 35, overdueAmount: 200 },
    { daysOverdue: 80, overdueAmount: 300 },
    { daysOverdue: 122, overdueAmount: 400 },
  ] as CollectionPriority[];

  assert.deepEqual(getAgingBuckets(priorities), [
    { label: '1-30', amount: 100, count: 1 },
    { label: '31-60', amount: 200, count: 1 },
    { label: '61-90', amount: 300, count: 1 },
    { label: '90+', amount: 400, count: 1 },
  ]);
});
