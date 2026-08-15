import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./investment-detail-page.tsx', import.meta.url), 'utf8');

test('shows history and receipts in the investment detail tabs', () => {
  assert.match(
    source,
    /const TABS = \['Historial de pagos', 'Movimientos de capital', 'Historial', 'Recibos'\]/,
  );
  assert.match(source, /tab === 2 && <InvestmentHistoryTab events=\{historyEvents\}/);
  assert.match(source, /tab === 3 && \(/);
  assert.match(source, /<InvestmentReceiptsTab/);
});

test('builds the investment history from capital movements and payments', () => {
  assert.match(source, /investment\.movements \?\? \[\]/);
  assert.match(source, /investment\.payments \?\? \[\]/);
  assert.match(source, /Inversión creada/);
  assert.match(source, /Aporte de capital registrado/);
  assert.match(source, /Pago del período/);
});

test('lists and opens every payment receipt for the investment', () => {
  assert.match(source, /payments\.map\(\(payment\) =>/);
  assert.match(source, /onClick=\{\(\) => onOpenReceipt\(payment\)\}/);
  assert.match(source, /<PaymentReceiptModal/);
});
