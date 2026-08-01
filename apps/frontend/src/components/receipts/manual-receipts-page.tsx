'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  PanelTop,
  Printer,
  ReceiptText,
  RotateCcw,
} from 'lucide-react';
import { amountToSpanishWords } from '@/components/loans/loan-disbursement-receipt.helpers';
import { getSettings } from '@/lib/api/settings';
import { cn } from '@/lib/utils';
import {
  buildReceiptPrintDocument,
  formatReceiptAmount,
  formatReceiptDate,
  parseReceiptAmount,
  type ManualReceiptData,
  type ReceiptTemplate,
} from './manual-receipt.helpers';

const DRAFT_KEY = 'iwm:manual-receipt-draft';

function officeDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' });
}

function createEmptyReceipt(): ManualReceiptData {
  const date = officeDate();
  return {
    receiptNumber: `MAN-${date.replaceAll('-', '')}-001`,
    issueDate: date,
    recipientName: '',
    recipientId: '',
    amount: '',
    concept: '',
    paymentMethod: 'Efectivo',
    reference: '',
    notes: '',
    issuedBy: '',
    companyName: 'Inversiones Willians Marte',
    companyTaxId: '',
    companyPhone: '',
    companyAddress: '',
  };
}

const templates: Array<{
  value: ReceiptTemplate;
  label: string;
  detail: string;
  icon: typeof ReceiptText;
}> = [
  { value: 'pos', label: 'POS', detail: '80 mm', icon: ReceiptText },
  { value: 'vertical', label: 'Vertical', detail: 'Carta', icon: FileText },
  { value: 'horizontal', label: 'Horizontal', detail: 'Carta', icon: PanelTop },
];

const fieldClass =
  'mt-1.5 h-11 w-full rounded-control border border-border bg-card px-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary-soft';
const labelClass = 'text-xs font-bold text-text-secondary';

function ReceiptPreview({
  data,
  template,
  amountWords,
}: {
  data: ManualReceiptData;
  template: ReceiptTemplate;
  amountWords: string;
}) {
  const isPos = template === 'pos';
  const isHorizontal = template === 'horizontal';

  return (
    <article
      className={cn(
        'mx-auto bg-white text-[#17231d] shadow-[0_12px_36px_rgba(23,35,29,0.15)]',
        isPos
          ? 'min-h-[560px] w-full max-w-[302px] p-5 font-mono text-[11px]'
          : isHorizontal
            ? 'aspect-[11/8.5] w-full max-w-[820px] p-[5%] text-sm'
            : 'aspect-[8.5/11] w-full max-w-[620px] p-[6%] text-sm',
      )}
    >
      <header
        className={cn(
          'mb-5 border-[#285c43] pb-4',
          isPos
            ? 'border-b border-dashed text-center'
            : 'flex items-start justify-between gap-5 border-b-[3px]',
        )}
      >
        <div>
          <h2 className={cn('font-bold', isPos ? 'text-sm' : 'text-xl')}>
            {data.companyName || 'Inversiones Willians Marte'}
          </h2>
          {data.companyTaxId && <p className="mt-1">RNC: {data.companyTaxId}</p>}
          {data.companyPhone && <p className="mt-1">Tel: {data.companyPhone}</p>}
          {data.companyAddress && <p className="mt-1">{data.companyAddress}</p>}
        </div>
        <div className={cn(isPos ? 'mt-3' : 'shrink-0 text-right')}>
          <p className={cn('font-bold text-[#285c43]', isPos ? 'text-sm' : 'text-lg')}>RECIBO</p>
          <p className="mt-1">No. {data.receiptNumber || '-'}</p>
          <p className="mt-1">{formatReceiptDate(data.issueDate)}</p>
        </div>
      </header>

      <section className="my-5 border border-[#9fcbb3] bg-[#edf7f1] p-4 text-center">
        <strong className={cn('block', isPos ? 'text-lg' : 'text-2xl')}>
          {formatReceiptAmount(data.amount)}
        </strong>
        <small className="mt-1.5 block uppercase leading-relaxed">{amountWords}</small>
      </section>

      <section className={cn(isHorizontal && 'grid grid-cols-2 gap-x-8')}>
        {[
          ['Recibido de', data.recipientName],
          ['Cédula / RNC', data.recipientId],
          ['Método de pago', data.paymentMethod],
          ['Referencia', data.reference],
        ].map(([label, value]) =>
          value || label === 'Recibido de' || label === 'Método de pago' ? (
            <div className="flex justify-between gap-4 border-b border-[#d8e1dc] py-2" key={label}>
              <span className="text-[#5d6d64]">{label}</span>
              <strong className="break-words text-right">{value || '-'}</strong>
            </div>
          ) : null,
        )}
      </section>

      <section className="mt-5 border border-[#d8e1dc] p-3.5">
        <strong className="block text-[#285c43]">Concepto</strong>
        <p className="mt-1.5 break-words">{data.concept || '-'}</p>
        {data.notes && <small className="mt-2 block break-words text-[#5d6d64]">{data.notes}</small>}
      </section>

      <section className={cn('grid text-center', isPos ? 'mt-14 grid-cols-1 gap-12' : 'mt-20 grid-cols-2 gap-8')}>
        <div className="border-t border-[#17231d] pt-2">Entregado por</div>
        <div className="border-t border-[#17231d] pt-2">
          Recibido por
          {data.issuedBy && <small className="mt-1 block">{data.issuedBy}</small>}
        </div>
      </section>
    </article>
  );
}

export function ManualReceiptsPage() {
  const [receipt, setReceipt] = useState<ManualReceiptData>(createEmptyReceipt);
  const [template, setTemplate] = useState<ReceiptTemplate>('vertical');
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const saved = window.localStorage.getItem(DRAFT_KEY);
    let savedReceipt: Partial<ManualReceiptData> | null = null;
    if (saved) {
      try {
        savedReceipt = JSON.parse(saved) as Partial<ManualReceiptData>;
      } catch {
        window.localStorage.removeItem(DRAFT_KEY);
      }
    }

    queueMicrotask(() => {
      if (cancelled) return;
      if (savedReceipt) setReceipt((current) => ({ ...current, ...savedReceipt }));
      setDraftReady(true);
    });

    getSettings()
      .then((settings) => {
        if (cancelled) return;
        setReceipt((current) => ({
          ...current,
          companyName:
            !current.companyName || current.companyName === 'Inversiones Willians Marte'
              ? settings.companyName
              : current.companyName,
          companyTaxId: current.companyTaxId || settings.companyTaxId || '',
          companyPhone: current.companyPhone || settings.companyPhone || '',
          companyAddress: current.companyAddress || settings.companyAddress || '',
        }));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (draftReady) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(receipt));
  }, [draftReady, receipt]);

  const amountWords = useMemo(() => {
    const amount = parseReceiptAmount(receipt.amount);
    return amount ? amountToSpanishWords(amount) : 'cero pesos con 00/100';
  }, [receipt.amount]);

  function update<K extends keyof ManualReceiptData>(key: K, value: ManualReceiptData[K]) {
    setReceipt((current) => ({ ...current, [key]: value }));
  }

  function resetReceipt() {
    setReceipt((current) => ({
      ...createEmptyReceipt(),
      companyName: current.companyName,
      companyTaxId: current.companyTaxId,
      companyPhone: current.companyPhone,
      companyAddress: current.companyAddress,
    }));
  }

  function printReceipt() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.opener = null;
    printWindow.document.write(buildReceiptPrintDocument(receipt, template, amountWords));
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <header className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-text-primary">Recibos</h1>
          <p className="mt-1.5 text-sm text-text-secondary">Crea y prepara recibos manuales.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="flex h-11 items-center gap-2 rounded-control border border-border bg-card px-4 text-sm font-bold text-text-primary transition hover:bg-surface-muted"
            onClick={resetReceipt}
            type="button"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Nuevo
          </button>
          <button
            className="flex h-11 items-center gap-2 rounded-control bg-primary-accent px-5 text-sm font-bold text-white shadow-action transition hover:-translate-y-0.5"
            onClick={printReceipt}
            type="button"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Imprimir
          </button>
        </div>
      </header>

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(420px,0.72fr)_minmax(620px,1.28fr)]">
        <section className="rounded-panel border border-border-soft bg-card p-5 shadow-card">
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.09em] text-text-secondary">Plantilla</p>
            <div className="grid grid-cols-3 gap-1 rounded-control bg-surface-subtle p-1">
              {templates.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    aria-pressed={template === option.value}
                    className={cn(
                      'flex min-h-14 items-center justify-center gap-2 rounded-control px-2 text-left transition',
                      template === option.value
                        ? 'bg-card text-text-primary shadow-card'
                        : 'text-text-secondary hover:bg-card/70',
                    )}
                    key={option.value}
                    onClick={() => setTemplate(option.value)}
                    type="button"
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <strong className="block truncate text-xs">{option.label}</strong>
                      <small className="block text-[10px] font-medium">{option.detail}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Número de recibo
              <input className={fieldClass} value={receipt.receiptNumber} onChange={(e) => update('receiptNumber', e.target.value)} />
            </label>
            <label className={labelClass}>Fecha
              <input className={fieldClass} type="date" value={receipt.issueDate} onChange={(e) => update('issueDate', e.target.value)} />
            </label>
            <label className={cn(labelClass, 'sm:col-span-2')}>Recibido de
              <input className={fieldClass} placeholder="Nombre o razón social" value={receipt.recipientName} onChange={(e) => update('recipientName', e.target.value)} />
            </label>
            <label className={labelClass}>Cédula / RNC
              <input className={fieldClass} value={receipt.recipientId} onChange={(e) => update('recipientId', e.target.value)} />
            </label>
            <label className={labelClass}>Monto
              <input className={fieldClass} inputMode="decimal" placeholder="0.00" value={receipt.amount} onChange={(e) => update('amount', e.target.value)} />
            </label>
            <label className={labelClass}>Método de pago
              <select className={fieldClass} value={receipt.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value)}>
                <option>Efectivo</option><option>Transferencia</option><option>Cheque</option><option>Tarjeta</option><option>Otro</option>
              </select>
            </label>
            <label className={labelClass}>Referencia
              <input className={fieldClass} value={receipt.reference} onChange={(e) => update('reference', e.target.value)} />
            </label>
            <label className={cn(labelClass, 'sm:col-span-2')}>Concepto
              <textarea className={cn(fieldClass, 'h-24 resize-y py-3')} value={receipt.concept} onChange={(e) => update('concept', e.target.value)} />
            </label>
            <label className={cn(labelClass, 'sm:col-span-2')}>Notas
              <textarea className={cn(fieldClass, 'h-20 resize-y py-3')} value={receipt.notes} onChange={(e) => update('notes', e.target.value)} />
            </label>
            <label className={cn(labelClass, 'sm:col-span-2')}>Emitido por
              <input className={fieldClass} value={receipt.issuedBy} onChange={(e) => update('issuedBy', e.target.value)} />
            </label>
          </div>

          <details className="mt-6 border-t border-border-soft pt-5">
            <summary className="cursor-pointer text-sm font-bold text-text-primary">Datos de la empresa</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={cn(labelClass, 'sm:col-span-2')}>Empresa
                <input className={fieldClass} value={receipt.companyName} onChange={(e) => update('companyName', e.target.value)} />
              </label>
              <label className={labelClass}>RNC
                <input className={fieldClass} value={receipt.companyTaxId} onChange={(e) => update('companyTaxId', e.target.value)} />
              </label>
              <label className={labelClass}>Teléfono
                <input className={fieldClass} value={receipt.companyPhone} onChange={(e) => update('companyPhone', e.target.value)} />
              </label>
              <label className={cn(labelClass, 'sm:col-span-2')}>Dirección
                <input className={fieldClass} value={receipt.companyAddress} onChange={(e) => update('companyAddress', e.target.value)} />
              </label>
            </div>
          </details>
        </section>

        <section className="min-w-0 overflow-auto rounded-panel border border-border-soft bg-surface-muted p-4 shadow-card sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.09em] text-text-secondary">Vista previa</p>
            <span className="text-xs font-semibold text-text-muted">{templates.find((item) => item.value === template)?.label}</span>
          </div>
          <ReceiptPreview amountWords={amountWords} data={receipt} template={template} />
        </section>
      </div>
    </div>
  );
}
