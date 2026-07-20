'use client';

import { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { formatDop } from '@/lib/currency';
import type { InvestorInvestmentDetail, InvestorItem, InvestorInvestmentMovementItem } from '@inversiones/shared';

const fmt = (n: number | string) => formatDop(n);
const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

const safeFilename = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'inversionista';

interface CapitalAdditionReceiptModalProps {
  movement: InvestorInvestmentMovementItem;
  investor: InvestorItem;
  investment: InvestorInvestmentDetail;
  previousCapital: number;
  previousMonthlyPayment: number;
  onClose: () => void;
}

export function CapitalAdditionReceiptModal({
  movement,
  investor,
  investment,
  previousCapital,
  previousMonthlyPayment,
  onClose,
}: CapitalAdditionReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const newCapital = Number(investment.capital);
  const newMonthlyPayment = Number(investment.monthlyPayment);
  const capitalDiff = newCapital - previousCapital;
  const monthlyDiff = newMonthlyPayment - previousMonthlyPayment;
  const receiptFilename = [
    'Adicion_Capital',
    safeFilename(investor.name),
    safeFilename(investment.code),
    fmtDate(movement.movementDate),
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
        <title>Comprobante de Adicion de Capital</title>
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
      filename: `${receiptFilename}.pdf`,
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
        className="flex w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-border-soft bg-white shadow-[0_28px_80px_rgba(0,0,0,0.26)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 bg-[#f1f8f4] px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Comprobante de adición</h2>
            <p className="mt-1 text-sm font-medium text-text-muted">
              {investor.name} — {investment.code}
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
              <strong>COMPROBANTE DE ADICIÓN</strong><br />
              <span style={{ fontSize: '11px' }}>Aporte de capital</span>
            </div>

            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px', textAlign: 'left' }}>
              <strong>Inversionista:</strong> {investor.name}<br />
              <strong>Código:</strong> {investor.code}<br />
              {investment.code && (
                <><strong>Inversión:</strong> {investment.code}<br /></>
              )}
              <strong>Fecha:</strong> {fmtDate(movement.movementDate)}<br />
              {movement.notes && <><strong>Notas:</strong> {movement.notes}<br /></>}
            </div>

            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px', textAlign: 'left' }}>
              <table>
                <tr>
                  <td className="label">Capital anterior:</td>
                  <td className="value">{fmt(previousCapital)}</td>
                </tr>
                <tr>
                  <td className="label">Capital añadido:</td>
                  <td className="value" style={{ color: '#2f7654', fontWeight: 'bold' }}>{fmt(capitalDiff)}</td>
                </tr>
                <tr>
                  <td className="label">Nuevo capital:</td>
                  <td className="value" style={{ fontWeight: 'bold' }}>{fmt(newCapital)}</td>
                </tr>
              </table>
            </div>

            <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px', textAlign: 'left' }}>
              <table>
                <tr>
                  <td className="label">Retorno mensual anterior:</td>
                  <td className="value">{fmt(previousMonthlyPayment)}</td>
                </tr>
                <tr>
                  <td className="label">Nuevo retorno mensual:</td>
                  <td className="value" style={{ color: '#2f7654', fontWeight: 'bold' }}>{fmt(newMonthlyPayment)}</td>
                </tr>
                <tr>
                  <td className="label">Incremento mensual:</td>
                  <td className="value" style={{ color: monthlyDiff >= 0 ? '#2f7654' : '#9f3f25', fontWeight: 'bold' }}>{fmt(monthlyDiff)}</td>
                </tr>
              </table>
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
              Generado el {fmtDate(movement.createdAt)}<br />
              Gracias por su confianza
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3 border-t border-border-soft">
          <div className="rounded-xl bg-primary-soft p-4 border border-[#c2dfcb]/60">
            <p className="text-sm font-semibold text-primary-accent">
              Nuevo retorno mensual calculado: {fmt(newMonthlyPayment)}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Basado en el nuevo capital de {fmt(newCapital)} a una tasa de {Number(investment.rate)}% mensual.
              {investment.nextDueDate && (
                <> Próximo vencimiento: {fmtDate(investment.nextDueDate)}.</>
              )}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="inline-flex h-11 items-center gap-2 rounded-full border border-primary-border bg-white px-6 text-sm font-bold text-text-primary"
              onClick={handlePrint}
              type="button"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white hover:bg-[#1f4a34]"
              onClick={handleDownload}
              type="button"
            >
              <Download className="h-4 w-4" />
              Guardar PDF
            </button>
            <button
              className="inline-flex h-11 items-center rounded-full border border-primary-border bg-white px-6 text-sm font-bold text-text-primary"
              onClick={onClose}
              type="button"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
