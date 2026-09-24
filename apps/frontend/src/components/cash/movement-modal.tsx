'use client';

import { memo, type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Wallet, X } from 'lucide-react';
import { formatCurrencyInput } from '@/lib/currency';

type MovementType = 'in' | 'out' | '';

export interface MovementFormValues {
  type: MovementType;
  person: string;
  amount: string;
  method: string;
  category: string;
  description: string;
  affectsBalance: boolean;
}

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: MovementFormValues) => Promise<void>;
}

const methods = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta'];
const categories = [
  'Otro',
  'Gasto operativo',
  'Ingreso adicional',
  'Aporte inversionista',
  'Retiro de socio',
];

const initialValues: MovementFormValues = {
  type: 'in',
  person: '',
  amount: '',
  method: 'Efectivo',
  category: 'Otro',
  description: '',
  affectsBalance: true,
};

function inputClass(hasError = false) {
  return `h-11 w-full rounded-[18px] border-0 bg-surface-subtle px-4 text-sm font-medium text-text-primary shadow-card outline-none transition-colors placeholder:text-text-secondary/60 focus:ring-2 focus:ring-brand-sky ${
    hasError ? 'ring-2 ring-state-danger' : ''
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
        className={`mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] ${error ? 'text-state-danger' : 'text-text-secondary'}`}
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
      className={`flex min-h-[66px] flex-1 items-center gap-3 rounded-[22px] border px-4 text-left transition-colors ${
        active
          ? income
            ? 'border-emerald-700 bg-emerald-50'
            : 'border-rose-500 bg-rose-50'
          : 'border-transparent bg-surface-subtle hover:bg-card'
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-card ${income ? 'bg-emerald-500' : 'bg-rose-500'}`}
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
  const shouldReduceMotion = useReducedMotion();

  const amountNumber = useMemo(
    () => Number(values.amount.replace(/[^\d.]/g, '')) || 0,
    [values.amount],
  );
  const errors = {
    type: submitted && values.type === '',
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
    if (!values.type || values.person.trim().length === 0 || amountNumber <= 0) return;

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
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 py-6 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <div
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 motion-reduce:transition-none ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeModal}
      />
      <motion.form
        animate={{ opacity: isOpen ? 1 : 0, scale: shouldReduceMotion ? 1 : isOpen ? 1 : 0.82 }}
        aria-labelledby="movement-modal-title"
        aria-modal="true"
        className="relative max-h-[calc(100dvh-3rem)] w-full max-w-[510px] overflow-y-auto rounded-[18px] bg-page shadow-modal"
        initial={false}
        onSubmit={handleSubmit}
        role="dialog"
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                scale: { type: 'spring', stiffness: 380, damping: isOpen ? 17 : 18, mass: 0.8 },
                opacity: { duration: isOpen ? 0.14 : 0.12, delay: isOpen ? 0 : 0.25 },
              }
        }
      >
        <header className="flex items-start justify-between gap-4 border-b border-border-soft px-6 py-5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-blue-100 text-brand-sky">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-text-primary" id="movement-modal-title">
                Movimiento manual
              </h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                Registra una entrada o salida del día.
              </p>
            </div>
          </div>
          <button
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center rounded-[9px] text-text-secondary transition-colors hover:bg-surface-muted-ui hover:text-text-primary"
            onClick={closeModal}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-5 px-6 py-6">
          <div>
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
            {errors.type && (
              <p className="mt-2 text-sm font-semibold text-state-danger">
                Selecciona si el movimiento es una entrada o una salida.
              </p>
            )}
          </div>

          <FormField error={errors.person} label="Persona o concepto *">
            <input
              className={inputClass(errors.person)}
              onChange={(event) => updateValue('person', event.target.value)}
              placeholder="Ej. Compra de agua o Carmen Reyes"
              value={values.person}
            />
          </FormField>

          <div>
            <FormField error={errors.amount} label="Monto *">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-text-secondary">
                  RD$
                </span>
                <input
                  className={`${inputClass(errors.amount)} pl-12 tabular-nums`}
                  inputMode="decimal"
                  onChange={(event) =>
                    updateValue('amount', formatCurrencyInput(event.target.value))
                  }
                  pattern="[0-9,]+([.][0-9]{0,2})?"
                  placeholder="0"
                  value={values.amount}
                />
              </div>
            </FormField>
            <div className="mt-2 flex flex-wrap gap-5 px-3">
              {[500, 1000, 2000, 5000].map((increment) => (
                <button
                  className="text-xs font-semibold text-text-secondary hover:text-brand-sky"
                  key={increment}
                  onClick={() =>
                    updateValue('amount', formatCurrencyInput(String(amountNumber + increment)))
                  }
                  type="button"
                >
                  +{increment.toLocaleString('en-US')}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <FormField label="Categoría">
              <div className="relative">
                <select
                  className={`${inputClass()} appearance-none pr-10`}
                  onChange={(event) => updateValue('category', event.target.value)}
                  value={values.category}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              </div>
            </FormField>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-[12px] p-2 transition-colors">
            <input
              checked={!values.affectsBalance}
              className="peer sr-only"
              onChange={(event) => updateValue('affectsBalance', !event.target.checked)}
              type="checkbox"
            />
            <span
              aria-hidden="true"
              className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-slate-200 shadow-card transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-brand-sky peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-sky peer-focus-visible:ring-offset-2"
            />
            <span>
              <span className="block text-sm font-bold text-text-primary">
                Dinero externo al negocio
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
                Se registra para control, pero no suma ni resta en el cuadre de caja.
              </span>
            </span>
          </label>

          <FormField label="Descripción (opcional)">
            <textarea
              className="h-20 w-full resize-none rounded-[18px] border-0 bg-surface-subtle px-4 py-3 text-sm font-medium text-text-primary shadow-card outline-none transition-colors placeholder:text-text-secondary/60 focus:ring-2 focus:ring-brand-sky"
              onChange={(event) => updateValue('description', event.target.value)}
              placeholder="Agrega algún detalle si es necesario"
              value={values.description}
            />
          </FormField>

          {submitError && <p className="text-sm font-semibold text-state-danger">{submitError}</p>}
        </div>

        <footer className="flex justify-end gap-3 border-t border-border-soft px-6 py-4">
          <button
            className="h-11 rounded-[18px] bg-card px-5 text-sm font-bold text-text-primary shadow-card transition-colors hover:bg-surface-muted-ui"
            disabled={saving}
            onClick={closeModal}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="h-11 rounded-[18px] bg-brand-sky px-5 text-sm font-bold text-white shadow-action transition-colors hover:bg-primary disabled:cursor-wait disabled:opacity-70"
            disabled={saving}
            type="submit"
          >
            {saving
              ? 'Registrando...'
              : values.type === 'out'
                ? 'Registrar salida'
                : 'Registrar entrada'}
          </button>
        </footer>
      </motion.form>
    </div>
  );
});
