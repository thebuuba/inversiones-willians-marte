'use client';

import { useRef, useState } from 'react';
import { Download, Printer, X } from 'lucide-react';
import type { LoanReceipt } from '@inversiones/shared';
import { formatDop } from '@/lib/currency';
import {
  amountToSpanishWords,
  receiptCopyLabel,
  type ReceiptCopy,
} from './loan-disbursement-receipt.helpers';

type OutputMode = 'two-part' | ReceiptCopy;

const FREQUENCY: Record<string, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
};

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function ReceiptContent({ receipt, mode }: { receipt: LoanReceipt; mode: OutputMode }) {
  const { company, client, loan, issuance } = receipt.snapshot;
  const label =
    mode === 'two-part'
      ? 'ORIGINAL BLANCO · COPIA AMARILLA'
      : receiptCopyLabel(mode);

  return (
    <div
      data-receipt-copy={mode}
      style={{
        color: '#000',
        fontFamily: "'Courier New', monospace",
        fontSize: '11px',
        lineHeight: 1.35,
        margin: '0 auto',
        padding: '5mm 4mm',
        textAlign: 'center',
        width: '76mm',
      }}
    >
      <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px' }}>
        <strong style={{ fontSize: '13px' }}>{company.name.toUpperCase()}</strong>
        {company.taxId && <><br />RNC: {company.taxId}</>}
        {company.phone && <><br />Tel: {company.phone}</>}
        {company.address && <><br />{company.address}</>}
      </div>

      <div style={{ margin: '7px 0' }}>
        <strong style={{ fontSize: '14px' }}>RECIBO DE DESEMBOLSO</strong><br />
        No. {String(issuance.receiptNumber).padStart(5, '0')}<br />
        <strong>{label}</strong>
      </div>

      <div style={{ borderBottom: '1px dashed #000', borderTop: '1px dashed #000', padding: '6px 0', textAlign: 'left' }}>
        <strong>Fecha:</strong> {formatDate(issuance.issuedAt)}<br />
        <strong>Préstamo:</strong> #{String(loan.number).padStart(5, '0')}<br />
        <strong>Cliente:</strong> {client.name}<br />
        <strong>Cédula:</strong> {client.identification ?? '—'}<br />
        <strong>Producto:</strong> {loan.product}
      </div>

      <div style={{ borderBottom: '1px dashed #000', padding: '7px 0', textAlign: 'left' }}>
        <strong>Monto del préstamo:</strong><br />
        <span style={{ fontSize: '15px', fontWeight: 700 }}>{formatDop(loan.principal)}</span><br />
        <span style={{ fontSize: '10px' }}>{amountToSpanishWords(loan.principal).toUpperCase()}</span>
        {loan.disbursedAmount !== loan.principal && (
          <>
            <br /><strong>Monto entregado:</strong> {formatDop(loan.disbursedAmount)}
          </>
        )}
      </div>

      <div style={{ borderBottom: '1px dashed #000', padding: '6px 0', textAlign: 'left' }}>
        <strong>Frecuencia:</strong> {FREQUENCY[loan.paymentFrequency] ?? loan.paymentFrequency}<br />
        <strong>Plazo:</strong> {loan.term} cuotas<br />
        <strong>Primera cuota:</strong> {formatDate(loan.firstPaymentDate)}<br />
        {loan.purpose && <><strong>Propósito:</strong> {loan.purpose}<br /></>}
        <strong>Registrado por:</strong> {issuance.generatedBy}
      </div>

      <p style={{ fontSize: '10px', margin: '7px 0' }}>
        Declaro haber recibido el monto entregado indicado en este recibo.
      </p>

      <div style={{ display: 'grid', gap: '7px' }}>
        <div style={{ border: '1px dashed #000', minHeight: '45px', paddingTop: '27px' }}>
          Firma del cliente
        </div>
        <div style={{ border: '1px dashed #000', minHeight: '45px', paddingTop: '27px' }}>
          Firma del representante
        </div>
      </div>
    </div>
  );
}

export function LoanDisbursementReceiptModal({
  receipt,
  onClose,
}: {
  receipt: LoanReceipt;
  onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<OutputMode>('two-part');

  async function handlePrint() {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Recibo ${receipt.receiptNumber}</title>
      <style>
        @page { margin: 0; size: 76mm auto; }
        html, body { margin: 0; padding: 0; width: 76mm; }
        * { box-sizing: border-box; }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    await new Promise((resolve) => setTimeout(resolve, 250));
    printWindow.print();
    printWindow.close();
  }

  async function handleDownload() {
    const content = receiptRef.current;
    if (!content) return;
    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf()
      .set({
        margin: 0,
        filename: `Recibo_Prestamo_${String(receipt.receiptNumber).padStart(5, '0')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: [76, 210] as [number, number], orientation: 'portrait' as const },
      })
      .from(content)
      .save();
  }

  return (
    <div
      aria-labelledby="loan-receipt-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="flex max-h-full w-full max-w-[620px] flex-col overflow-hidden rounded-panel border border-border-soft bg-card shadow-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 bg-surface-muted px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-text-primary" id="loan-receipt-title">
              Recibo de desembolso
            </h2>
            <p className="mt-1 text-sm font-medium text-text-muted">
              Préstamo #{receipt.snapshot.loan.number} — {receipt.snapshot.client.name}
            </p>
          </div>
          <button
            aria-label="Cerrar recibo"
            className="flex h-11 w-11 items-center justify-center rounded-full text-text-primary transition hover:bg-card"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-border-soft px-6 py-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary">
            Formato de salida
          </p>
          <div className="flex flex-wrap gap-2">
            {([
              ['two-part', 'Autocopiante'],
              ['company', 'Solo original'],
              ['client', 'Solo copia'],
            ] as const).map(([value, label]) => (
              <button
                aria-pressed={mode === value}
                className={`min-h-11 rounded-full px-4 text-sm font-bold transition ${
                  mode === value
                    ? 'bg-primary text-white'
                    : 'border border-primary-border bg-card text-text-primary hover:bg-primary-soft'
                }`}
                key={value}
                onClick={() => setMode(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          {mode === 'two-part' && (
            <p className="mt-2 text-xs font-medium text-text-secondary">
              Imprime una sola vez sobre papel autocopiante de dos capas; la firma pasa a la copia.
            </p>
          )}
        </div>

        <div className="overflow-auto bg-surface-subtle px-4 py-5">
          <div className="mx-auto w-fit bg-white shadow-card" ref={receiptRef}>
            <ReceiptContent mode={mode} receipt={receipt} />
          </div>
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-border-soft px-6 py-4">
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary-border bg-card px-5 text-sm font-bold text-text-primary transition hover:bg-primary-soft"
            onClick={handleDownload}
            type="button"
          >
            <Download className="h-4 w-4" />
            Guardar PDF
          </button>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-hover"
            onClick={handlePrint}
            type="button"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
        </footer>
      </div>
    </div>
  );
}
