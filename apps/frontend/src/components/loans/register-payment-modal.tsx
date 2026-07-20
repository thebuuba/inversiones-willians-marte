'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { DatePickerInput } from '@/components/ui/date-picker-input';

export interface RegisterPaymentValues {
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

interface RegisterPaymentModalProps {
  isOpen: boolean;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: RegisterPaymentValues) => Promise<void>;
}

const methods = ['Efectivo', 'Transferencia', 'Tarjeta'];
const today = () => new Date().toISOString().slice(0, 10);

export function RegisterPaymentModal({
  isOpen,
  saving,
  error,
  onClose,
  onSubmit,
}: RegisterPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState(methods[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const amountNumber = Number(amount);
  const invalidAmount = submitted && (!Number.isFinite(amountNumber) || amountNumber <= 0);
  const invalidDate = submitted && !paymentDate;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0 || !paymentDate) return;

    await onSubmit({
      amount: amountNumber,
      paymentDate,
      paymentMethod,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  const inputClass = 'h-11 w-full rounded-xl border border-primary-border bg-white px-4 text-sm font-medium text-text-primary outline-none transition focus:border-primary-accent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-[2px]" onClick={onClose}>
      <form
        className="w-full max-w-[560px] rounded-2xl border border-border-soft bg-white shadow-[0_28px_80px_rgba(0,0,0,0.26)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="flex items-start justify-between gap-4 rounded-t-2xl bg-[#f1f8f4] px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Registrar cobro</h2>
            <p className="mt-1 text-sm font-medium text-text-muted">El pago se aplicará a las cuotas pendientes del préstamo.</p>
          </div>
          <button aria-label="Cerrar modal" className="rounded-full p-1.5 text-[#3d443f] hover:bg-white" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-text-secondary">Monto</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-text-secondary">RD$</span>
              <input className={`${inputClass} pl-14 ${invalidAmount ? 'border-[#e4a58b]' : ''}`} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} placeholder="0.00" value={amount} />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-text-secondary">Fecha</span>
            <DatePickerInput className={inputClass} invalid={invalidDate} onChange={setPaymentDate} value={paymentDate} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-text-secondary">Método de pago</span>
            <select className={inputClass} onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}>
              {methods.map((method) => <option key={method}>{method}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-text-secondary">Referencia</span>
            <input className={inputClass} onChange={(event) => setReference(event.target.value)} placeholder="Opcional" value={reference} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-text-secondary">Notas</span>
            <textarea className="h-24 w-full resize-none rounded-xl border border-primary-border bg-white px-4 py-3 text-sm font-medium text-text-primary outline-none transition focus:border-primary-accent" onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" value={notes} />
          </label>
          {error ? <p className="text-sm font-medium text-state-danger sm:col-span-2">{error}</p> : null}
        </div>

        <footer className="flex justify-end gap-3 border-t border-border-soft px-6 py-4">
          <button className="h-11 rounded-full border border-primary-border bg-white px-6 text-sm font-bold text-text-primary" disabled={saving} onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="h-11 rounded-full bg-primary px-6 text-sm font-bold text-white disabled:opacity-60" disabled={saving} type="submit">
            {saving ? 'Registrando...' : 'Registrar cobro'}
          </button>
        </footer>
      </form>
    </div>
  );
}
