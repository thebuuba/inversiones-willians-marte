import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getAgingBuckets,
  getDueTodayTotal,
  getInvestmentDueLabel,
  getPortfolioStatusData,
  portfolioStatusConfig,
} from './dashboard-home';
import type {
  CollectionPriority,
  InvestmentPriority,
  PortfolioGroup,
  UpcomingPayment,
} from '@/lib/api/dashboard';

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

test('uses the same collection status colors as the loans panel', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(portfolioStatusConfig).map(([status, config]) => [status, config.color]),
    ),
    {
      CURRENT: '#7CC99B',
      PENDING: '#B5BBB8',
      LATE: '#F3D477',
      EXPIRED: '#E67C73',
      PAID: '#8EB8D8',
      WRITTEN_OFF: '#D1D5D3',
    },
  );
});

test('orders portfolio status from healthy to most overdue', () => {
  const groups = [
    { status: 'EXPIRED', count: 4 },
    { status: 'LATE', count: 3 },
    { status: 'CURRENT', count: 1 },
    { status: 'PENDING', count: 2 },
  ] as PortfolioGroup[];

  assert.deepEqual(
    getPortfolioStatusData(groups).map(({ name }) => name),
    ['A tiempo', 'Pendientes', 'Atrasados', 'Vencidos'],
  );
});

test('describes investment payment urgency in calendar days', () => {
  const priority = (paymentStatus: InvestmentPriority['paymentStatus'], daysUntilDue: number) =>
    ({ paymentStatus, daysUntilDue }) as InvestmentPriority;

  assert.equal(getInvestmentDueLabel(priority('UPCOMING', 5)), 'En 5 días');
  assert.equal(getInvestmentDueLabel(priority('PENDING', 0)), 'Vence hoy');
  assert.equal(getInvestmentDueLabel(priority('PENDING', -3)), 'Pendiente hace 3 días');
  assert.equal(getInvestmentDueLabel(priority('OVERDUE', -6)), '6 días de atraso');
});

test('links every investment priority row to its investment detail', () => {
  const source = readFileSync(new URL('./dashboard-home.tsx', import.meta.url), 'utf8');

  assert.match(source, /title="Orden de pagos de inversiones"/);
  assert.match(source, /href={`\/inversiones\/\$\{item\.investmentId\}`}/);
});
