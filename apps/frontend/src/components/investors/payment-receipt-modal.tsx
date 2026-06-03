'use client';

import { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import type { InvestorItem, InvestorPaymentItem } from '@inversiones/shared';

const fmt = (n: number) => `RD$${n.toLocaleString('es-DO', { maximumFractionDigits: 0 })}`;
const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface PaymentReceiptModalProps {
  payment: InvestorPaymentItem;
  investor: InvestorItem;
  onClose: () => void;
}

export function PaymentReceiptModal({ payment, investor, onClose }: PaymentReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const padReceipt = String(payment.receiptNumber).padStart(5, '0');

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
          @page { margin: 0; size: 80mm auto; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.5;
            width: 80mm;
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
      filename: `Recibo_${investor.name.replace(/\s+/g, '_')}_${MONTHS[payment.periodMonth - 1]}${payment.periodYear}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: [80, 200] as [number, number], orientation: 'portrait' as const },
    };

    const worker = html2pdf().set(opt).from(content);
    await worker.save();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_28px_80px_rgba(0,0,0,0.26)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 bg-[#f1f8f4] px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#173d2c]">Recibo de pago</h2>
            <p className="mt-1 text-sm font-medium text-[#7e9086]">
              Recibo #{padReceipt} — {investor.name}
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-[#3d443f] hover:bg-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Receipt content */}
        <div className="overflow-auto px-6 py-5">
          <div
            ref={receiptRef}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: '12px',
              lineHeight: '1.5',
              width: '80mm',
              margin: '0 auto',
              padding: '10px',
              textAlign: 'center',
              color: '#000',
            }}
          >
            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              <strong style={{ fontSize: '14px' }}>INVERSIONES WILLIANS MARTE</strong><br />
              RNC: 123-456789-0<br />
              Tel: 809-000-0000
            </div>

            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>RECIBO DE PAGO</strong><br />
              <span style={{ fontSize: '11px' }}>No. {padReceipt}</span>
            </div>

            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px', textAlign: 'left' }}>
              <strong>Inversionista:</strong> {investor.name}<br />
              <strong>Código:</strong> {investor.code}<br />
              <strong>Período:</strong> {MONTHS[payment.periodMonth - 1]} {payment.periodYear}<br />
            </div>

            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px', textAlign: 'left' }}>
              <strong>Monto pagado:</strong>{' '}
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{fmt(Number(payment.amount))}</span><br />
              <strong>Fecha:</strong> {fmtDate(payment.paymentDate)}<br />
              <strong>Método:</strong> {payment.paymentMethod ?? '—'}<br />
              <strong>Referencia:</strong> {payment.reference ?? '—'}
            </div>

            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              <strong>Firma del inversionista</strong><br />
              <div
                style={{
                  border: '1px dashed #000',
                  borderRadius: '4px',
                  height: '60px',
                  margin: '8px auto',
                  maxWidth: '200px',
                }}
              />
            </div>

            <div style={{ fontSize: '10px', color: '#666' }}>
              Generado el {fmtDate(payment.createdAt)}<br />
              Gracias por su confianza
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-[#edf2ef] px-6 py-4">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[#ddebe3] bg-white px-6 text-sm font-bold text-[#173d2c]"
            onClick={handlePrint}
            type="button"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
          <button
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#285c43] px-6 text-sm font-bold text-white hover:bg-[#1f4a34]"
            onClick={handleDownload}
            type="button"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </button>
          <button
            className="inline-flex h-11 items-center rounded-full border border-[#ddebe3] bg-white px-6 text-sm font-bold text-[#173d2c]"
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
