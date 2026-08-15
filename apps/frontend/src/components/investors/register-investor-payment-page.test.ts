import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./register-investor-payment-page.tsx', import.meta.url), 'utf8');

test('allows another investment payment without showing an existing-payment notice', () => {
  assert.doesNotMatch(source, /Este período ya tiene pagos/);
  assert.doesNotMatch(source, /Puedes registrar otro pago o complemento/);
  assert.match(source, /<form onSubmit=\{handleSubmit\}>/);
});

test('uses the available screen width instead of leaving wide side gaps', () => {
  assert.match(source, /<div className="w-full">/);
  assert.doesNotMatch(source, /mx-auto max-w-7xl/);
});

test('shows every investment receipt in a dedicated tab below the cards', () => {
  assert.match(source, /const \[receiptsOpen, setReceiptsOpen\] = useState\(false\)/);
  assert.match(source, />\s*Recibos\s*<\/button>/);
  assert.match(source, /onClick=\{\(\) => setReceiptsOpen\(true\)\}/);
  assert.match(source, /\{receiptsOpen && \(/);
  assert.match(source, /<\/form>[\s\S]*?<\/div>\s*<\/div>\s*<div className="mt-6[^\n]*">/);
  assert.match(source, /payments\.map\(\(payment\) =>/);
  assert.match(source, /onClick=\{\(\) => setReceiptToView\(payment\)\}/);
  assert.match(source, /payment=\{receiptToView\}/);
});

test('does not duplicate recent payments in the investor summary column', () => {
  assert.doesNotMatch(source, /Últimos pagos/);
  assert.doesNotMatch(source, /payments\.slice\(0, 5\)/);
});

test('always opens the receipt after registering an investment payment', () => {
  assert.doesNotMatch(source, /Generar recibo/);
  assert.doesNotMatch(source, /generateReceipt/);
  assert.match(source, /const payment = await createInvestorPayment\([\s\S]*?setCreatedPayment\(payment\)/);
});

test('keeps reference and notes out of the investment payment form', () => {
  assert.doesNotMatch(source, />Referencia</);
  assert.doesNotMatch(source, />Notas</);
  assert.doesNotMatch(source, /reference:/);
  assert.doesNotMatch(source, /notes:/);
});

test('assigns the investment period and current payment date automatically', () => {
  assert.doesNotMatch(source, /onChange=\{\(e\) => setPeriodMonth/);
  assert.doesNotMatch(source, /onChange=\{\(e\) => setPeriodYear/);
  assert.doesNotMatch(source, />Fecha del pago<\/span>/);
  assert.doesNotMatch(source, /type="date"/);
  assert.match(source, /const \[paymentDate\] = useState\(\(\) => new Date\(\)\.toISOString\(\)\.slice\(0, 10\)\)/);
  assert.match(source, /periodMonth,\s*periodYear,\s*paymentDate,/);
});

test('renders the investor identity as a thin full-width strip', () => {
  assert.match(source, /mb-6 flex w-full items-center gap-3[^"]*px-4 py-3/);
  assert.match(source, /flex h-10 w-10 shrink-0/);
  assert.match(source, /flex min-w-0 flex-1 flex-wrap items-center/);
  assert.doesNotMatch(source, /flex h-16 w-16 shrink-0/);
});
