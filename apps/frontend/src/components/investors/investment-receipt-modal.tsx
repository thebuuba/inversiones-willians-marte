'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Printer, X } from 'lucide-react';
import type { InvestorInvestmentSummary, InvestorItem } from '@inversiones/shared';
import { amountToSpanishWords } from '@/components/loans/loan-disbursement-receipt.helpers';
import { getSettings, type SystemSettings } from '@/lib/api/settings';
import { formatDop } from '@/lib/currency';

type OutputMode = 'two-part' | 'company' | 'investor';

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

export function InvestmentReceiptModal({
  investment,
  investor,
  onClose,
}: {
  investment: InvestorInvestmentSummary;
  investor: InvestorItem;
  onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<OutputMode>('two-part');
  const [company, setCompany] = useState<SystemSettings | null>(null);

  useEffect(() => {
    getSettings().then(setCompany).catch(() => undefined);
  }, []);

  async function handlePrint() {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Recibo ${investment.code}</title>
      <style>
        @page { margin: 0; size: 76mm auto; }
        html, body { margin: 0; padding: 0; width: 76mm; }
        * { box-sizing: border-box; }
      </style></head><body>${receiptRef.current.innerHTML}</body></html>
    `);
    printWindow.document.close();
    await new Promise((resolve) => setTimeout(resolve, 250));
    printWindow.print();
    printWindow.close();
  }

  async function handleDownload() {
    if (!receiptRef.current) return;
    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf()
      .set({
        margin: 0,
        filename: `Recibo_Inversion_${investment.code}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: [76, 210] as [number, number], orientation: 'portrait' as const },
      })
      .from(receiptRef.current)
      .save();
  }

  const copyLabel =
    mode === 'two-part'
      ? 'ORIGINAL BLANCO · COPIA AMARILLA'
      : mode === 'company'
        ? 'ORIGINAL · EMPRESA'
        : 'COPIA · INVERSIONISTA';

  return (
    <div
      aria-labelledby="investment-receipt-title"
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
            <h2 className="text-xl font-bold text-text-primary" id="investment-receipt-title">
              Recibo de inversión
            </h2>
            <p className="mt-1 text-sm font-medium text-text-muted">
              {investment.code} — {investor.name}
            </p>
          </div>
          <button
            aria-label="Cerrar recibo"
            className="flex h-11 w-11 items-center justify-center rounded-full text-text-primary hover:bg-card"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-border-soft px-6 py-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary">Formato de salida</p>
          <div className="flex flex-wrap gap-2">
            {([
              ['two-part', 'Autocopiante'],
              ['company', 'Solo original'],
              ['investor', 'Solo copia'],
            ] as const).map(([value, label]) => (
              <button
                aria-pressed={mode === value}
                className={`min-h-11 rounded-full px-4 text-sm font-bold ${
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
            <div
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
                <strong style={{ fontSize: '13px' }}>
                  {(company?.companyName ?? 'Inversiones Willians Marte').toUpperCase()}
                </strong>
                {company?.companyTaxId && <><br />RNC: {company.companyTaxId}</>}
                {company?.companyPhone && <><br />Tel: {company.companyPhone}</>}
                {company?.companyAddress && <><br />{company.companyAddress}</>}
              </div>

              <div style={{ margin: '7px 0' }}>
                <strong style={{ fontSize: '14px' }}>RECIBO DE INVERSIÓN</strong><br />
                No. {investment.code}<br />
                <strong>{copyLabel}</strong>
              </div>

              <div style={{ borderBottom: '1px dashed #000', borderTop: '1px dashed #000', padding: '6px 0', textAlign: 'left' }}>
                <strong>Fecha:</strong> {formatDate(investment.createdAt)}<br />
                <strong>Inversionista:</strong> {investor.name}<br />
                <strong>Código:</strong> {investor.code}<br />
                <strong>Inversión:</strong> {investment.code}<br />
                <strong>Cédula:</strong> {investor.cedula ?? '—'}
              </div>

              <div style={{ borderBottom: '1px dashed #000', padding: '7px 0', textAlign: 'left' }}>
                <strong>Capital recibido:</strong><br />
                <span style={{ fontSize: '15px', fontWeight: 700 }}>{formatDop(investment.capital)}</span><br />
                <span style={{ fontSize: '10px' }}>
                  {amountToSpanishWords(Number(investment.capital)).toUpperCase()}
                </span>
              </div>

              <div style={{ borderBottom: '1px dashed #000', padding: '6px 0', textAlign: 'left' }}>
                <strong>Tasa:</strong> {Number(investment.rate)}% mensual<br />
                <strong>Retorno mensual:</strong> {formatDop(investment.monthlyPayment)}<br />
                <strong>Inicio:</strong> {formatDate(investment.startDate)}<br />
                <strong>Plazo:</strong> {investment.term ?? 'Indefinido'}
              </div>

              <p style={{ fontSize: '10px', margin: '7px 0' }}>
                Se certifica la recepción del capital indicado para esta inversión.
              </p>
              <div style={{ display: 'grid', gap: '7px' }}>
                <div style={{ border: '1px dashed #000', minHeight: '45px', paddingTop: '27px' }}>
                  Firma del inversionista
                </div>
                <div style={{ border: '1px dashed #000', minHeight: '45px', paddingTop: '27px' }}>
                  Firma del representante
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-border-soft px-6 py-4">
          <button
            className="inline-flex min-h-11 items-center rounded-full border border-primary-border bg-card px-5 text-sm font-bold text-text-primary hover:bg-primary-soft"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </button>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary-border bg-card px-5 text-sm font-bold text-text-primary hover:bg-primary-soft"
            onClick={handleDownload}
            type="button"
          >
            <Download className="h-4 w-4" />
            Guardar PDF
          </button>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white hover:bg-primary-hover"
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
