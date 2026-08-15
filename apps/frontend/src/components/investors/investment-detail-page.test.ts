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

test('keeps every investment tab closed on the initial visit', () => {
  assert.match(source, /const \[tab, setTab\] = useState<number \| null>\(null\)/);
  assert.match(source, /onClick=\{\(\) => setTab\(index\)\}/);
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

test('separates the investment summary into individual cards', () => {
  assert.match(source, /grid grid-cols-1 gap-3 border-t[^\n]*bg-page p-4/);
  assert.match(
    source,
    /rounded-control-comfortable border border-border-soft bg-card p-5 shadow-soft/,
  );
});

test('prioritizes the investor name over the investment code', () => {
  assert.match(
    source,
    /<h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">\s*\{investment\.investor\?\.name\}\s*<\/h1>/,
  );
  assert.match(
    source,
    /<p className="mt-1 text-base font-semibold tracking-wide text-primary-accent">\s*\{investment\.code\}\s*<\/p>/,
  );
});
