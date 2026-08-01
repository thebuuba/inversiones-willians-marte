import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildReceiptPrintDocument,
  escapeReceiptHtml,
  formatReceiptAmount,
  parseReceiptAmount,
  type ManualReceiptData,
} from './manual-receipt.helpers.ts';

const receipt: ManualReceiptData = {
  receiptNumber: 'MAN-001', issueDate: '2026-08-01', recipientName: 'María', recipientId: '',
  amount: '1,250.50', concept: 'Abono', paymentMethod: 'Efectivo', reference: '', notes: '',
  issuedBy: 'Oficina', companyName: 'IWM', companyTaxId: '', companyPhone: '', companyAddress: '',
};

test('parses and formats Dominican peso amounts', () => {
  assert.equal(parseReceiptAmount('RD$ 1,250.50'), 1250.5);
  assert.match(formatReceiptAmount('1250.50'), /1,250\.50/);
});

test('escapes manual content before building a printable document', () => {
  assert.equal(escapeReceiptHtml('<script>'), '&lt;script&gt;');
  const html = buildReceiptPrintDocument({ ...receipt, concept: '<img src=x onerror=alert(1)>' }, 'vertical', 'mil pesos');
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('uses the selected paper orientation', () => {
  assert.match(buildReceiptPrintDocument(receipt, 'pos', 'mil pesos'), /size: 80mm auto/);
  assert.match(buildReceiptPrintDocument(receipt, 'vertical', 'mil pesos'), /size: letter portrait/);
  assert.match(buildReceiptPrintDocument(receipt, 'horizontal', 'mil pesos'), /size: letter landscape/);
});
