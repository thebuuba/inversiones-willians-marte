'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Printer, Download, MessageCircle } from 'lucide-react';
import { formatDop } from '@/lib/currency';
import { getSettings, type SystemSettings } from '@/lib/api/settings';
import { amountToSpanishWords } from '@/components/loans/loan-disbursement-receipt.helpers';
import type { InvestorInvestmentSummary, InvestorItem, InvestorPaymentItem } from '@inversiones/shared';

const fmt = (n: number | string) => formatDop(n);
const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const safeFilename = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'inversionista';

interface PaymentReceiptModalProps {
  payment: InvestorPaymentItem;
  investor: InvestorItem;
  investment?: InvestorInvestmentSummary | null;
  onClose: () => void;
}

export function PaymentReceiptModal({ payment, investor, investment, onClose }: PaymentReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'two-part' | 'company' | 'investor'>('two-part');
  const [company, setCompany] = useState<SystemSettings | null>(null);

  useEffect(() => {
    getSettings().then(setCompany).catch(() => undefined);
  }, []);

  const padReceipt = String(payment.receiptNumber).padStart(5, '0');
  const monthLabel = MONTHS[payment.periodMonth - 1] ?? String(payment.periodMonth);
  const receiptFilename = [
    'Recibo',
    safeFilename(investor.name),
    investment?.code ? safeFilename(investment.code) : null,
    safeFilename(monthLabel),
    payment.periodYear,
  ]
    .filter(Boolean)
    .join('_');

  async function handlePrint() {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
      <head>
        <title>Recibo #${padReceipt}</title>
        <style>
          @page { margin: 0; size: 76mm auto; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.5;
            width: 76mm;
            margin: 0 auto;
            padding: 10px;
            text-align: center;
            color: #000;
          }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 2px 0; }
          .label { text-align: left; font-weight: bold; }
          .value { text-align: right; }
          hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
          .signature-area { border: 1px dashed #000; height: 60px; margin: 8px auto; max-width: 200px; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);

    printWindow.document.close();
    await new Promise((r) => setTimeout(r, 300));
    printWindow.print();
    printWindow.close();
  }

  async function handleDownload() {
    const content = receiptRef.current;
    if (!content) return;

    const html2pdf = (await import('html2pdf.js')).default;
    const opt = {
      margin: [5, 5, 5, 5] as [number, number, number, number],
      filename: `${receiptFilename}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: [76, 210] as [number, number], orientation: 'portrait' as const },
    };

    const worker = html2pdf().set(opt).from(content);
    await worker.save();
  }

  function handleWhatsApp() {
    const lines = [
      `Recibo de pago #${padReceipt}`,
      `Inversionista: ${investor.name}`,
      investment?.code ? `Inversión: ${investment.code}` : `Código: ${investor.code}`,
      `Período: ${monthLabel} ${payment.periodYear}`,
      `Monto pagado: ${fmt(Number(payment.amount))}`,
      `Fecha: ${fmtDate(payment.paymentDate)}`,
      `Método: ${payment.paymentMethod ?? 'No especificado'}`,
      payment.reference ? `Referencia: ${payment.reference}` : null,
      '',
      'Inversiones Willians Marte',
    ].filter(Boolean);

    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div
      aria-labelledby="investor-payment-receipt-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="flex w-full max-w-[560px] flex-col overflow-hidden rounded-panel border border-border-soft bg-card shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 bg-surface-muted px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-text-primary" id="investor-payment-receipt-title">Recibo de pago</h2>
            <p className="mt-1 text-sm font-medium text-text-muted">
              Recibo #{padReceipt} — {investor.name}
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-text-primary hover:bg-card"
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
              ['investor', 'Solo copia'],
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

        {/* Receipt content */}
        <div className="overflow-auto px-6 py-5">
          <div
            ref={receiptRef}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: '12px',
              lineHeight: '1.5',
              width: '76mm',
              margin: '0 auto',
              padding: '10px',
              textAlign: 'center',
              color: '#000',
            }}
          >
            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              <strong style={{ fontSize: '14px' }}>
                {(company?.companyName ?? 'Inversiones Willians Marte').toUpperCase()}
              </strong>
              {company?.companyTaxId && <><br />RNC: {company.companyTaxId}</>}
              {company?.companyPhone && <><br />Tel: {company.companyPhone}</>}
              {company?.companyAddress && <><br />{company.companyAddress}</>}
            </div>

            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>RECIBO DE PAGO</strong><br />
              <span style={{ fontSize: '11px' }}>No. {padReceipt}</span><br />
              <strong style={{ fontSize: '10px' }}>
                {mode === 'two-part' ? 'ORIGINAL BLANCO · COPIA AMARILLA' : mode === 'company' ? 'ORIGINAL · EMPRESA' : 'COPIA · INVERSIONISTA'}
              </strong>
            </div>

            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px', textAlign: 'left' }}>
              <strong>Inversionista:</strong> {investor.name}<br />
              <strong>Código:</strong> {investor.code}<br />
              {investment?.code && (
                <>
                  <strong>Inversión:</strong> {investment.code}<br />
                </>
              )}
              <strong>Período:</strong> {monthLabel} {payment.periodYear}<br />
            </div>

            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px', textAlign: 'left' }}>
              <strong>Monto pagado:</strong>{' '}
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{fmt(Number(payment.amount))}</span><br />
              <span style={{ fontSize: '10px' }}>{amountToSpanishWords(Number(payment.amount)).toUpperCase()}</span><br />
              <strong>Fecha:</strong> {fmtDate(payment.paymentDate)}<br />
              <strong>Método:</strong> {payment.paymentMethod ?? '—'}<br />
              <strong>Referencia:</strong> {payment.reference ?? '—'}
            </div>

            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ border: '1px dashed #000', height: '52px', margin: '8px 0', paddingTop: '32px' }}>
                Firma del inversionista
              </div>
              <div style={{ border: '1px dashed #000', height: '52px', margin: '8px 0', paddingTop: '32px' }}>
                Firma del representante
              </div>
            </div>

            <div style={{ fontSize: '10px', color: '#666' }}>
              Generado el {fmtDate(payment.createdAt)}<br />
              Gracias por su confianza
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-border-soft px-6 py-4">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-full border border-primary-border bg-card px-6 text-sm font-bold text-text-primary"
            onClick={handlePrint}
            type="button"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
          <button
            className="inline-flex h-11 items-center gap-2 rounded-full border border-primary-border bg-card px-6 text-sm font-bold text-state-success hover:bg-primary-soft"
            onClick={handleWhatsApp}
            type="button"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
          <button
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white hover:bg-primary-hover"
            onClick={handleDownload}
            type="button"
          >
            <Download className="h-4 w-4" />
            Guardar PDF
          </button>
          <button
            className="inline-flex h-11 items-center rounded-full border border-primary-border bg-card px-6 text-sm font-bold text-text-primary"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
