export type ReceiptTemplate = 'pos' | 'vertical' | 'horizontal';

export interface ManualReceiptData {
  receiptNumber: string;
  issueDate: string;
  recipientName: string;
  recipientId: string;
  amount: string;
  concept: string;
  paymentMethod: string;
  reference: string;
  notes: string;
  issuedBy: string;
  companyName: string;
  companyTaxId: string;
  companyPhone: string;
  companyAddress: string;
}

export function parseReceiptAmount(value: string): number {
  const normalized = value.replace(/[^\d.,-]/g, '').replace(/,/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

export function formatReceiptAmount(value: string): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(parseReceiptAmount(value));
}

export function formatReceiptDate(value: string): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

export function escapeReceiptHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function buildReceiptPrintDocument(
  data: ManualReceiptData,
  template: ReceiptTemplate,
  amountInWords: string,
): string {
  const value = (input: string, fallback = '-') => escapeReceiptHtml(input.trim() || fallback);
  const optionalRow = (label: string, input: string) =>
    input.trim() ? `<div class="row"><span>${label}</span><strong>${value(input)}</strong></div>` : '';
  const page = template === 'pos'
    ? 'size: 80mm auto; margin: 4mm;'
    : template === 'horizontal'
      ? 'size: letter landscape; margin: 12mm;'
      : 'size: letter portrait; margin: 14mm;';

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Recibo ${value(data.receiptNumber)}</title>
<style>
  @page { ${page} }
  * { box-sizing: border-box; }
  body { margin: 0; color: #17231d; background: #fff; font-family: ${template === 'pos' ? "'Courier New', monospace" : "Arial, sans-serif"}; }
  .receipt { ${template === 'pos' ? 'width: 72mm; font-size: 11px;' : 'width: 100%; min-height: 100%; font-size: 14px;'} margin: 0 auto; }
  header { ${template === 'pos' ? 'text-align: center; border-bottom: 1px dashed #17231d;' : 'display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #285c43;'} padding-bottom: 14px; margin-bottom: 18px; }
  h1 { margin: 0; font-size: ${template === 'pos' ? '15px' : '24px'}; }
  h2 { margin: ${template === 'pos' ? '12px 0 2px' : '0'}; font-size: ${template === 'pos' ? '14px' : '20px'}; color: #285c43; }
  p { margin: 3px 0; }
  .meta { ${template === 'pos' ? 'text-align: center;' : 'text-align: right;'} }
  .amount { margin: 18px 0; padding: 14px; border: 1px solid #9fcbb3; background: #edf7f1; text-align: center; }
  .amount strong { display: block; font-size: ${template === 'pos' ? '19px' : '28px'}; }
  .amount small { display: block; margin-top: 6px; text-transform: uppercase; line-height: 1.4; }
  .details { display: grid; ${template === 'horizontal' ? 'grid-template-columns: 1fr 1fr; column-gap: 34px;' : ''} }
  .row { display: flex; justify-content: space-between; gap: 18px; padding: 8px 0; border-bottom: 1px ${template === 'pos' ? 'dashed' : 'solid'} #d8e1dc; }
  .row span { color: #5d6d64; }
  .row strong { text-align: right; overflow-wrap: anywhere; }
  .concept { margin-top: 18px; padding: 14px; border: 1px solid #d8e1dc; }
  .concept strong { display: block; margin-bottom: 6px; color: #285c43; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: ${template === 'pos' ? '55px' : '80px'}; text-align: center; }
  .signature { border-top: 1px solid #17231d; padding-top: 7px; }
  footer { margin-top: 28px; text-align: center; color: #5d6d64; font-size: 10px; }
  ${template === 'pos' ? '.signatures { grid-template-columns: 1fr; gap: 45px; } .details { display: block; }' : ''}
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style></head><body><main class="receipt">
  <header>
    <div><h1>${value(data.companyName, 'Inversiones Willians Marte')}</h1>${data.companyTaxId.trim() ? `<p>RNC: ${value(data.companyTaxId)}</p>` : ''}${data.companyPhone.trim() ? `<p>Tel: ${value(data.companyPhone)}</p>` : ''}${data.companyAddress.trim() ? `<p>${value(data.companyAddress)}</p>` : ''}</div>
    <div class="meta"><h2>RECIBO</h2><p>No. ${value(data.receiptNumber)}</p><p>${value(formatReceiptDate(data.issueDate))}</p></div>
  </header>
  <section class="amount"><strong>${escapeReceiptHtml(formatReceiptAmount(data.amount))}</strong><small>${value(amountInWords)}</small></section>
  <section class="details">
    <div class="row"><span>Recibido de</span><strong>${value(data.recipientName)}</strong></div>
    ${optionalRow('Cédula / RNC', data.recipientId)}
    <div class="row"><span>Método de pago</span><strong>${value(data.paymentMethod)}</strong></div>
    ${optionalRow('Referencia', data.reference)}
  </section>
  <section class="concept"><strong>Concepto</strong><p>${value(data.concept)}</p>${data.notes.trim() ? `<p><small>${value(data.notes)}</small></p>` : ''}</section>
  <section class="signatures"><div class="signature">Entregado por</div><div class="signature">Recibido por${data.issuedBy.trim() ? `<br><small>${value(data.issuedBy)}</small>` : ''}</div></section>
  <footer>Documento generado manualmente</footer>
</main></body></html>`;
}
