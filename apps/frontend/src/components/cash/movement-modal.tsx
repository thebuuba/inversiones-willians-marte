'use client';

import { memo, type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Wallet, X } from 'lucide-react';

type MovementType = 'in' | 'out';

export interface MovementFormValues {
  type: MovementType;
  person: string;
  amount: string;
  method: string;
  description: string;
  affectsBalance: boolean;
}

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: MovementFormValues) => Promise<void>;
}

const methods = ['Efectivo', 'Transferencia', 'Tarjeta'];

const initialValues: MovementFormValues = {
  type: 'in',
  person: '',
  amount: '',
  method: 'Efectivo',
  description: '',
  affectsBalance: true,
};

function inputClass(hasError = false) {
  return `h-11 w-full rounded-[10px] border bg-card px-3.5 text-sm font-medium text-text-primary outline-none transition-colors placeholder:text-text-secondary/60 focus:border-primary-accent ${
    hasError ? 'border-state-danger' : 'border-primary-border'
  }`;
}

function FormField({
  label,
  error,
  children,
  className = '',
}: {
  label: string;
  error?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span
        className={`mb-2 block text-sm font-bold ${error ? 'text-state-danger' : 'text-text-secondary'}`}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function MovementTypeButton({
  active,
  icon,
  label,
  subtitle,
  tone,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  subtitle: string;
  tone: MovementType;
  onClick: () => void;
}) {
  const income = tone === 'in';

  return (
    <button
      aria-pressed={active}
      className={`flex min-h-[68px] flex-1 items-center gap-3 rounded-[12px] border px-4 text-left transition-colors ${
        active
          ? income
            ? 'border-primary-accent bg-primary-soft'
            : 'border-[#e6b89a] bg-[#fff4ec]'
          : 'border-primary-border bg-card hover:bg-surface-subtle'
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${income ? 'bg-[#b8dcc5] text-primary' : 'bg-[#ffe3d2] text-state-danger'}`}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold text-text-primary">{label}</span>
        <span className="mt-0.5 block text-xs text-text-secondary">{subtitle}</span>
      </span>
    </button>
  );
}

export const MovementModal = memo(function MovementModal({
  isOpen,
  onClose,
  onSubmit,
}: MovementModalProps) {
  const [values, setValues] = useState<MovementFormValues>(initialValues);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const amountNumber = useMemo(
    () => Number(values.amount.replace(/[^\d.]/g, '')) || 0,
    [values.amount],
  );
  const errors = {
    person: submitted && values.person.trim().length === 0,
    amount: submitted && amountNumber <= 0,
  };

  function updateValue<Key extends keyof MovementFormValues>(
    key: Key,
    value: MovementFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function resetState() {
    setValues(initialValues);
    setSubmitted(false);
    setSaving(false);
    setSubmitError('');
  }

  function closeModal() {
    if (saving) return;
    resetState();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (values.person.trim().length === 0 || amountNumber <= 0) return;

    setSaving(true);
    setSubmitError('');
    try {
      await onSubmit({ ...values, person: values.person.trim(), amount: String(amountNumber) });
      resetState();
    } catch {
      setSaving(false);
      setSubmitError('No se pudo registrar el movimiento. Intenta de nuevo.');
    }
  }

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 transition-opacity duration-150 ${
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <form
        aria-labelledby="movement-modal-title"
        aria-modal="true"
        className={`w-full max-w-[600px] overflow-hidden rounded-[16px] border border-border-soft bg-card shadow-modal transition-[opacity,transform] duration-150 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-0'
        }`}
        onSubmit={handleSubmit}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border-soft px-6 py-5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text-primary" id="movement-modal-title">
                Movimiento manual
              </h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                Registra una entrada o salida del día.
              </p>
            </div>
          </div>
          <button
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-[9px] text-text-secondary transition-colors hover:bg-surface-muted-ui hover:text-text-primary"
            onClick={closeModal}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-5 px-6 py-6">
          <div className="flex gap-3">
            <MovementTypeButton
              active={values.type === 'in'}
              icon={<ArrowDownLeft className="h-4 w-4" />}
              label="Entrada"
              onClick={() => updateValue('type', 'in')}
              subtitle={values.affectsBalance ? 'Suma al cuadre' : 'Se registra sin sumar'}
              tone="in"
            />
            <MovementTypeButton
              active={values.type === 'out'}
              icon={<ArrowUpRight className="h-4 w-4" />}
              label="Salida"
              onClick={() => updateValue('type', 'out')}
              subtitle={values.affectsBalance ? 'Resta del cuadre' : 'Se registra sin restar'}
              tone="out"
            />
          </div>

          <FormField error={errors.person} label="Persona o concepto">
            <input
              className={inputClass(errors.person)}
              onChange={(event) => updateValue('person', event.target.value)}
              placeholder="Ej. Compra de agua o Carmen Reyes"
              value={values.person}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField error={errors.amount} label="Monto">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-text-secondary">
                  RD$
                </span>
                <input
                  className={`${inputClass(errors.amount)} pl-12 tabular-nums`}
                  inputMode="decimal"
                  onChange={(event) => updateValue('amount', event.target.value)}
                  placeholder="0.00"
                  value={values.amount}
                />
              </div>
            </FormField>

            <FormField label="Método">
              <div className="relative">
                <select
                  className={`${inputClass()} appearance-none pr-10`}
                  onChange={(event) => updateValue('method', event.target.value)}
                  value={values.method}
                >
                  {methods.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              </div>
            </FormField>
          </div>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-[12px] border p-4 transition-colors ${
              values.affectsBalance
                ? 'border-primary-border bg-card'
                : 'border-[#d4c39b] bg-[#fffaf0]'
            }`}
          >
            <input
              checked={!values.affectsBalance}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#8A6A20]"
              onChange={(event) => updateValue('affectsBalance', !event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-bold text-text-primary">
                Dinero externo al negocio
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
                Se registra para control, pero no suma ni resta en el cuadre de Caja.
              </span>
            </span>
          </label>

          <FormField label="Descripción (opcional)">
            <textarea
              className="h-20 w-full resize-none rounded-[10px] border border-primary-border bg-card px-3.5 py-3 text-sm font-medium text-text-primary outline-none transition-colors placeholder:text-text-secondary/60 focus:border-primary-accent"
              onChange={(event) => updateValue('description', event.target.value)}
              placeholder="Agrega algún detalle si es necesario"
              value={values.description}
            />
          </FormField>

          {submitError && <p className="text-sm font-semibold text-state-danger">{submitError}</p>}
        </div>

        <footer className="flex justify-end gap-3 border-t border-border-soft px-6 py-4">
          <button
            className="h-10 rounded-full border border-primary-border bg-card px-6 text-sm font-bold text-text-primary transition-colors hover:bg-surface-muted-ui"
            disabled={saving}
            onClick={closeModal}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="h-10 rounded-full bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
            disabled={saving}
            type="submit"
          >
            {saving ? 'Registrando...' : 'Registrar'}
          </button>
        </footer>
      </form>
    </div>
  );
});
