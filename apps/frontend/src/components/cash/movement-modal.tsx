'use client';

import { memo, type FormEvent, type ReactNode, useMemo, useRef, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import { getClient, getClients } from '@/lib/api/clients';
import { formatDop } from '@/lib/currency';
import type { Client, LoanSummary } from '@inversiones/shared';

type MovementType = 'in' | 'out';

export interface MovementFormValues {
  type: MovementType;
  person: string;
  amount: string;
  category: string;
  method: string;
  description: string;
  clientId?: number;
  loanId?: string;
}

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: MovementFormValues) => void;
}

const categories = [
  'Pago de préstamo',
  'Desembolso',
  'Gasto operativo',
  'Ingreso de inversionista',
  'Retiro de socio',
];

const methods = ['Efectivo', 'Transferencia', 'Tarjeta'];

const initialValues: MovementFormValues = {
  type: 'in',
  person: '',
  amount: '',
  category: 'Pago de préstamo',
  method: 'Efectivo',
  description: '',
};

function inputClass(hasError = false) {
  return `h-11 w-full rounded-[10px] border bg-white px-4 text-sm font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition placeholder:text-[#8F9691] focus:border-[#2F7654] ${
    hasError ? 'border-[#E4A58B]' : 'border-[#DDEBE3]'
  }`;
}

function MovementTypeCard({
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
  const isIncome = tone === 'in';

  return (
    <button
      className={`flex h-[82px] flex-1 items-center gap-4 rounded-[18px] border px-5 text-left transition hover:-translate-y-0.5 ${
        active
          ? isIncome
            ? 'border-[#2F7654] bg-[#EAF6EF] shadow-[0_8px_20px_rgba(95,163,125,0.1)]'
            : 'border-[#E6B89A] bg-[#FFF2E8] shadow-[0_8px_20px_rgba(201,111,74,0.08)]'
          : 'border-[#DDEBE3] bg-white shadow-[0_5px_14px_rgba(40,92,67,0.035)]'
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
          isIncome ? 'bg-[#B8DCC5] text-[#173D2C]' : 'bg-[#FFE3D2] text-[#9F3F25]'
        }`}
      >
        {icon}
      </span>
      <span>
        <span className="block text-base font-bold text-[#173D2C]">{label}</span>
        <span className="mt-0.5 block text-sm font-medium text-[#5C6D63]">{subtitle}</span>
      </span>
    </button>
  );
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
      <span className={`mb-2 block text-sm font-bold ${error ? 'text-[#9F3F25]' : 'text-[#5C6D63]'}`}>{label}</span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  error,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  error?: boolean;
}) {
  return (
    <FormField error={error} label={label}>
      <div className="relative">
        <select
          className={`${inputClass(error)} appearance-none pr-10`}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F9691]" />
      </div>
    </FormField>
  );
}

function ClientSearch({
  error,
  onSelect,
}: {
  error: boolean;
  onSelect: (client: Client) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(timerRef.current);
    if (value.length < 2) {
      setResults([]);
      setShow(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      const result = await getClients(value);
      setResults(result.data);
      setShow(result.data.length > 0);
    }, 300);
  };

  const handleSelect = (client: Client) => {
    setQuery(`${client.firstName} ${client.lastName}`);
    setShow(false);
    onSelect(client);
  };

  return (
    <div ref={containerRef} className="relative sm:col-span-2">
      <FormField error={error} label="Buscar cliente">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F9691]" />
          <input
            autoComplete="off"
            className={`${inputClass(error)} pl-12`}
            onChange={handleChange}
            placeholder="Buscar por nombre, cédula o teléfono..."
            value={query}
          />
        </div>
      </FormField>
      {show && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-[12px] border border-[#DDEBE3] bg-white shadow-[0_12px_32px_rgba(40,92,67,0.12)]">
          {results.map((client) => (
            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-[#F3FAF6]"
              key={client.id}
              onClick={() => handleSelect(client)}
              type="button"
            >
              <span className="font-bold text-[#173D2C]">{client.firstName} {client.lastName}</span>
              <span className="text-[#5C6D63]">{client.identification}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const MovementModal = memo(function MovementModal({ isOpen, onClose, onSubmit }: MovementModalProps) {
  const [values, setValues] = useState<MovementFormValues>(initialValues);
  const [submitted, setSubmitted] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientLoans, setClientLoans] = useState<LoanSummary[]>([]);

  const isLoanPayment = values.category === 'Pago de préstamo';

  const resetState = () => {
    setSubmitted(false);
    setValues(initialValues);
    setSelectedClient(null);
    setClientLoans([]);
  };

  async function handleSelectClient(client: Client) {
    setSelectedClient(client);
    setValues((prev) => ({
      ...prev,
      person: `${client.firstName} ${client.lastName}`,
      clientId: client.id,
      loanId: undefined,
    }));
    const detail = await getClient(client.id);
    setClientLoans(detail.loans.filter((l) => l.status === 'ACTIVE'));
  }

  const amountNumber = useMemo(
    () => Number(values.amount.replace(/[^\d.]/g, '')) || 0,
    [values.amount],
  );

  const errors = useMemo(
    () => ({
      person: submitted && values.person.trim().length === 0,
      amount: submitted && amountNumber <= 0,
      category: submitted && values.category.trim().length === 0,
      loan: submitted && isLoanPayment && !values.loanId,
    }),
    [submitted, values.person, values.category, amountNumber, isLoanPayment, values.loanId],
  );

  const updateValue = <Key extends keyof MovementFormValues>(key: Key, value: MovementFormValues[Key]) => {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
  };

  const handleCategoryChange = (value: string) => {
    updateValue('category', value);
    if (value !== 'Pago de préstamo') {
      updateValue('clientId', undefined);
      updateValue('loanId', undefined);
      setSelectedClient(null);
      setClientLoans([]);
    }
  };

  const closeModal = () => {
    resetState();
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (values.person.trim().length === 0 || amountNumber <= 0 || values.category.trim().length === 0) {
      return;
    }
    if (isLoanPayment && !values.loanId) {
      return;
    }

    onSubmit({ ...values, person: values.person.trim(), amount: String(amountNumber) });
    resetState();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 py-6 ${
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      } transition-opacity duration-200`}
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={closeModal}
      />
      <form
        className={`w-full max-w-[680px] overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_28px_80px_rgba(0,0,0,0.26)] ${
          isOpen ? 'scale-100 opacity-100' : 'scale-[0.96] opacity-0'
        } transition-all duration-200`}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="flex items-start justify-between gap-5 bg-[#F1F8F4] px-7 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#B8DCC5] text-[#173D2C]">
              <Wallet className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold leading-tight text-[#173D2C]">Registrar movimiento</h2>
              <p className="mt-1 text-sm font-medium text-[#5C6D63]">
                Las entradas suman al saldo y las salidas lo descuentan.
              </p>
            </div>
          </div>
          <button
            aria-label="Cerrar modal"
            className="rounded-full p-1.5 text-[#3D443F] transition hover:bg-white hover:text-[#173D2C]"
            onClick={closeModal}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="px-7 py-6">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MovementTypeCard
              active={values.type === 'in'}
              icon={<ArrowDownLeft className="h-5 w-5" />}
              label="Entrada"
              onClick={() => updateValue('type', 'in')}
              subtitle="Suma al saldo"
              tone="in"
            />
            <MovementTypeCard
              active={values.type === 'out'}
              icon={<ArrowUpRight className="h-5 w-5" />}
              label="Salida"
              onClick={() => updateValue('type', 'out')}
              subtitle="Descuenta del saldo"
              tone="out"
            />
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            {isLoanPayment ? (
              <ClientSearch
                error={errors.person}
                onSelect={handleSelectClient}
              />
            ) : (
              <FormField error={errors.person} label="Persona o entidad">
                <input
                  className={inputClass(errors.person)}
                  onChange={(event) => updateValue('person', event.target.value)}
                  placeholder="Ej. Carmen Reyes"
                  value={values.person}
                />
              </FormField>
            )}

            <FormField error={errors.amount} label="Monto">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#5C6D63]">
                  RD$
                </span>
                <input
                  className={`${inputClass(errors.amount)} pl-14`}
                  inputMode="decimal"
                  onChange={(event) => updateValue('amount', event.target.value)}
                  placeholder="0.00"
                  value={values.amount}
                />
              </div>
            </FormField>

            <SelectField
              error={errors.category}
              label="Categoría"
              onChange={handleCategoryChange}
              options={categories}
              value={values.category}
            />

            <SelectField
              label="Método de pago"
              onChange={(value) => updateValue('method', value)}
              options={methods}
              value={values.method}
            />

            <FormField className="sm:col-span-2" label="Descripción">
              <textarea
                className="h-[95px] w-full resize-none rounded-[10px] border border-[#DDEBE3] bg-white px-4 py-3 text-sm font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition placeholder:text-[#8F9691] focus:border-[#2F7654]"
                onChange={(event) => updateValue('description', event.target.value)}
                placeholder="Detalles del movimiento..."
                value={values.description}
              />
            </FormField>
          </div>
        </div>

        {selectedClient && (
          <div className="px-7 pb-4">
            <FormField error={errors.loan} label="Préstamo">
              <select
                className={`${inputClass(errors.loan)} appearance-none pr-10`}
                onChange={(e) => updateValue('loanId', e.target.value)}
                value={values.loanId ?? ''}
              >
                <option value="">Seleccionar préstamo...</option>
                {clientLoans.length === 0 && <option value="" disabled>Sin préstamos activos</option>}
                {clientLoans.map((loan) => (
                  <option key={loan.id} value={loan.id}>
                    {loan.product?.name ?? 'Préstamo'} · {formatDop(loan.balance)} · Cuota {loan.paymentFreq}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        )}

        <footer className="flex flex-col items-stretch justify-end gap-3 border-t border-[#EDF2EF] px-7 py-5 sm:flex-row">
          <button
            className="h-11 rounded-full border border-[#DDEBE3] bg-white px-8 text-sm font-bold text-[#173D2C] transition hover:bg-[#F4FAF6]"
            onClick={closeModal}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="h-11 rounded-full bg-[#2f7654] px-8 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.18)] transition hover:bg-[#285c43]"
            type="submit"
          >
            Registrar movimiento
          </button>
        </footer>
      </form>
    </div>
  );
});
