import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./payment-receipt-modal.tsx', import.meta.url), 'utf8');

test('shows payment information instead of the printable receipt after registration', () => {
  assert.match(source, />Información del recibo</);
  assert.match(source, />Pago registrado correctamente</);
  assert.match(source, /<ReceiptDetail label="Monto pagado"/);
  assert.match(source, /aria-hidden="true" style=\{\{ position: 'fixed', left: '-10000px'/);
  assert.match(source, />\s*Imprimir recibo\s*<\/button>/);
});

test('keeps the payment information modal inside every screen', () => {
  assert.match(source, /items-start justify-center overflow-y-auto/);
  assert.match(source, /max-h-\[calc\(100dvh-2rem\)\]/);
  assert.match(source, /flex flex-col-reverse gap-3[^"]*sm:flex-row/);
});

test('prints loan payments as one simple receipt without copy-format options', () => {
  assert.doesNotMatch(source, /Formato para imprimir/);
  assert.doesNotMatch(source, /Autocopiante/);
  assert.doesNotMatch(source, /Solo original/);
  assert.doesNotMatch(source, /Solo copia/);
  assert.doesNotMatch(source, /ORIGINAL BLANCO/);
});

test('keeps the investor payment receipt concise and precise', () => {
  assert.match(source, /<strong>Inversionista:<\/strong>/);
  assert.match(source, /<strong>Inversión:<\/strong>/);
  assert.match(source, /<strong>Período:<\/strong>/);
  assert.match(source, /<strong>Método:<\/strong>/);
  assert.match(source, />MONTO PAGADO</);
  assert.match(source, />\s*Firma del inversionista\s*<\/div>/);
  assert.doesNotMatch(source, /amountToSpanishWords/);
  assert.doesNotMatch(source, /<strong>Código:<\/strong>/);
  assert.doesNotMatch(source, /<strong>Referencia:<\/strong>/);
  assert.doesNotMatch(source, /Firma del representante/);
  assert.doesNotMatch(source, /Gracias por su confianza/);
});
