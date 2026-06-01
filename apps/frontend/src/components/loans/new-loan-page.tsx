'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calculator,
  Check,
  ChevronDown,
  Plus,
  Search,
  UserRound,
} from 'lucide-react';
import { getLoanProducts, type LoanProductItem } from '@/lib/api/loan-products';
import { createLoan } from '@/lib/api/loans';
import { getClient, getClients } from '@/lib/api/clients';
import type { Client } from '@inversiones/shared';

type WizardStep = 1 | 2;

function formatCurrency(value: number): string {
  return `RD$${new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function parseNumber(value: string): number {
  const parsed = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumberInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function LoanWizardStepper({ step }: { step: WizardStep }) {
  const totalSteps = 2;
  return (
    <div className="flex items-center justify-end gap-2.5">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((item, index) => {
        const completed = item < step;
        const active = item === step;

        return (
          <div className="flex items-center gap-2.5" key={item}>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                completed
                  ? 'bg-[#B8DCC5] text-[#2F7654]'
                  : active
                    ? 'bg-[#2F7654] text-white shadow-[0_10px_20px_rgba(47,118,84,0.18)]'
                    : 'bg-[#EEF3EF] text-[#B9C8BD]'
              }`}
            >
              {completed ? <Check className="h-[18px] w-[18px]" /> : item}
            </span>
            {index < totalSteps - 1 && (
              <span className={`h-px w-10 ${completed ? 'bg-[#5FA37D]' : 'bg-[#E4ECE7]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ClientSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative mb-5">
      <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A9CDBB]" />
      <input
        className="h-[52px] w-full rounded-[16px] border border-[#DDEBE3] bg-[#F8FBF9] pl-14 pr-5 text-base font-medium text-[#173D2C] outline-none transition placeholder:text-[#A0AFA8] focus:border-[#285C43] focus:bg-white focus:shadow-[0_0_0_4px_rgba(95,163,125,0.12)]"
        placeholder="Buscar cliente por nombre, cédula o teléfono…"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ClientSelectorCard() {
  return (
    <div className="w-full rounded-[16px] border border-dashed border-[#A9CDBB] bg-[#F7FBF9] p-5 text-left">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#285C43] text-white">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#173D2C]">Seleccionar cliente</p>
          <p className="mt-1 text-sm text-[#7A8A80]">Escribe el nombre, cédula o teléfono arriba</p>
        </div>
      </div>
    </div>
  );
}

function LoanPreviewPlaceholder() {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[360px] items-center justify-center rounded-[22px] border border-dashed border-[#DDEBE3] bg-white px-6 text-center"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
    >
      <div>
        <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-[22px] bg-[#EAF6EF] text-[#4F9B76]">
          <UserRound className="h-9 w-9" strokeWidth={2} />
        </div>
        <h2 className="mt-6 text-lg font-bold text-[#173D2C]">Selecciona un cliente</h2>
        <p className="mt-2 text-sm font-medium text-[#7A8A80]">Busca y selecciona el solicitante del préstamo.</p>
      </div>
    </motion.section>
  );
}

function SelectedClientPreview({ client }: { client: Client }) {
  const fullName = `${client.firstName} ${client.lastName}`;

  return (
    <motion.aside
      animate={{ opacity: 1, x: 0 }}
      className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm lg:p-8"
      initial={{ opacity: 0, x: 18 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#EAF6EF]">
          <UserRound className="h-6 w-6 text-[#5FA37D]" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#7A8A80]">CLIENTE SELECCIONADO</h2>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative h-[70px] w-[70px] shrink-0">
          <div className="flex h-full w-full items-center justify-center rounded-[18px] border-[3px] border-white bg-[#EAF6EF] shadow-[0_8px_18px_rgba(40,92,67,0.12)]">
            <UserRound className="h-8 w-8 text-[#5FA37D]" />
          </div>
          <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-[3px] border-white bg-[#5FA37D]" />
        </div>
        <div>
          <p className="text-xl font-bold leading-tight text-[#173D2C]">{fullName}</p>
          <p className="mt-1.5 text-sm font-medium text-[#7A8A80]">{client.identification ?? '—'}</p>
          <p className="mt-0.5 text-sm font-medium text-[#7A8A80]">{client.phone ?? '—'}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-[14px] bg-[#DDEBE3] px-4 py-2.5 text-xs font-bold text-[#5FA37D]">
        <Check className="h-4 w-4" />
        Cliente verificado
      </div>
    </motion.aside>
  );
}

function ContinueButton({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      className={`inline-flex h-14 items-center justify-center gap-3 rounded-full px-8 text-sm font-bold transition ${
        enabled
          ? 'bg-[#2F7654] text-white shadow-[0_14px_26px_rgba(47,118,84,0.22)] hover:-translate-y-0.5 hover:bg-[#285C43]'
          : 'cursor-not-allowed bg-[#EEF3EF] text-[#B9C8BD]'
      }`}
      disabled={!enabled}
      onClick={onClick}
      type="button"
    >
      Continuar
      <ChevronDown className="h-5 w-5 -rotate-90" />
    </button>
  );
}

function NewLoanStepOne({
  selectedClient,
  onSelectClient,
}: {
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const shownClients = results.length > 0 ? results : selectedClient ? [selectedClient] : [];

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(() => {
      getClients(query).then(setResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="mt-9 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(400px,0.75fr)]">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm lg:p-8"
        initial={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="mb-6 text-lg font-bold text-[#173D2C]">Seleccionar cliente</h2>
        <ClientSearchInput value={query} onChange={setQuery} />
        {shownClients.length > 0 && (
          <div className="mb-4 space-y-2">
            {shownClients.map((client) => (
              <button
                key={client.id}
                className={`w-full rounded-[14px] border p-4 text-left text-sm transition ${
                  selectedClient?.id === client.id
                    ? 'border-[#5FA37D] bg-[#EAF6EF]'
                    : 'border-[#DDEBE3] bg-white hover:bg-[#F6FAF7]'
                }`}
                onClick={() => onSelectClient(client)}
                type="button"
              >
                <p className="font-bold text-[#173D2C]">{client.firstName} {client.lastName}</p>
                <p className="mt-1 text-[#777D7A]">{client.identification ?? '—'} · {client.phone ?? '—'}</p>
              </button>
            ))}
          </div>
        )}
        <ClientSelectorCard />
        <Link
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-3 rounded-[14px] border border-dashed border-[#A9CDBB] bg-white text-sm font-bold text-[#5FA37D] transition hover:bg-[#F7FBF9] hover:-translate-y-0.5"
          href="/clientes/nuevo"
        >
          <Plus className="h-5 w-5" />
          Agregar cliente
        </Link>
      </motion.section>

      {selectedClient ? <SelectedClientPreview client={selectedClient} /> : <LoanPreviewPlaceholder />}
    </div>
  );
}

function LoanTypeOption({
  title,
  description,
  active,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex min-h-[92px] items-start gap-4 rounded-[18px] border px-5 py-5 text-left transition hover:-translate-y-0.5 ${
        active
          ? 'border-[#5FA37D] bg-[#EAF6EF] shadow-[0_8px_18px_rgba(95,163,125,0.08)]'
          : 'border-[#EDF2EF] bg-white shadow-[0_5px_14px_rgba(40,92,67,0.025)] hover:border-[#DDEBE3]'
      }`}
      onClick={onClick}
      type="button"
    >
      <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${active ? 'bg-[#5FA37D]' : 'bg-[#C7CCC9]'}`} />
      <span>
        <span className={`block text-base font-bold ${active ? 'text-[#2F7654]' : 'text-[#173D2C]'}`}>{title}</span>
        <span className="mt-2 block text-sm font-medium text-[#7A8A80]">{description}</span>
      </span>
    </button>
  );
}

function LoanTypeSelector({
  products,
  selectedProduct,
  onSelectProduct,
}: {
  products: LoanProductItem[];
  selectedProduct: LoanProductItem | null;
  onSelectProduct: (product: LoanProductItem) => void;
}) {
    return (
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm lg:p-8"
        initial={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
      <h2 className="mb-7 text-xl font-bold text-[#173D2C]">Producto de préstamo</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {products.map((product) => (
          <LoanTypeOption
            active={selectedProduct?.id === product.id}
            description={`${product.interestRate}% · ${product.paymentFrequency === 'MONTHLY' ? 'Mensual' : product.paymentFrequency}`}
            key={product.id}
            onClick={() => onSelectProduct(product)}
            title={product.name}
          />
        ))}
      </div>
    </motion.section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  className = '',
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  prefix?: string;
  suffix?: string;
  className?: string;
  readOnly?: boolean;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-[#6F8076]">{label}</span>
      <div className="flex h-[52px] items-center rounded-[10px] border border-[#DDEBE3] bg-white px-4 text-base font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] transition focus-within:border-[#4F9B76] focus-within:ring-2 focus-within:ring-[#EAF6EF]">
        {prefix && <span className="mr-3 shrink-0 text-[#7A8A80]">{prefix}</span>}
        <input
          className="h-full min-w-0 flex-1 bg-transparent outline-none"
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          value={value}
          readOnly={readOnly}
        />
        {suffix && <span className="ml-3 shrink-0 text-[#7A8A80]">{suffix}</span>}
      </div>
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
  className = '',
}: {
  label?: string;
  value: string;
  options: string[];
  onChange?: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-2 block text-sm font-bold text-[#6F8076]">{label}</span>}
      <div className="relative">
        <select
          className="h-[52px] w-full appearance-none rounded-[10px] border border-[#DDEBE3] bg-white px-4 pr-9 text-base font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition focus:border-[#4F9B76] focus:ring-2 focus:ring-[#EAF6EF]"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A7B5AD]" />
      </div>
    </label>
  );
}

function SelectableClientCard({
  client,
  onSelectClient,
}: {
  client: Client;
  onSelectClient: (client: Client) => void;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const fullName = `${client.firstName} ${client.lastName}`;

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(() => {
      getClients(query).then(setResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(newClient: Client) {
    onSelectClient(newClient);
    setShowSearch(false);
    setQuery('');
    setResults([]);
  }

  return (
    <div className="rounded-[20px] border border-[#EDF2EF] bg-white shadow-[0_8px_24px_rgba(40,92,67,0.035)]">
      <div className="flex min-h-[92px] items-center gap-4 px-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-[#EAF6EF] shadow-[0_7px_18px_rgba(40,92,67,0.14)]">
          <UserRound className="h-7 w-7 text-[#5FA37D]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold leading-tight text-[#173D2C]">{fullName}</p>
          <p className="mt-1 text-sm font-medium text-[#7A8A80]">{client.identification ?? '—'}</p>
        </div>
        <button
          className="shrink-0 rounded-lg border border-[#DDEBE3] px-3 py-1.5 text-xs font-bold text-[#5FA37D] transition hover:bg-[#F0F7F3]"
          onClick={() => setShowSearch(!showSearch)}
          type="button"
        >
          Cambiar
        </button>
      </div>

      {showSearch && (
        <div className="border-t border-[#EDF2EF] px-5 py-4">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9CDBB]" />
            <input
              autoFocus
              className="h-[44px] w-full rounded-[12px] border border-[#DDEBE3] bg-[#F8FBF9] pl-10 pr-4 text-sm font-medium text-[#173D2C] outline-none transition placeholder:text-[#A0AFA8] focus:border-[#285C43] focus:bg-white"
              placeholder="Buscar cliente por nombre, cédula o teléfono…"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {results.length > 0 && (
            <div className="max-h-[200px] space-y-1 overflow-y-auto">
              {results.map((c) => (
                <button
                  key={c.id}
                  className="w-full rounded-[10px] border border-[#EDF2EF] p-3 text-left text-sm transition hover:bg-[#F6FAF7]"
                  onClick={() => handleSelect(c)}
                  type="button"
                >
                  <p className="font-bold text-[#173D2C]">{c.firstName} {c.lastName}</p>
                  <p className="mt-0.5 text-xs text-[#777D7A]">{c.identification ?? '—'} · {c.phone ?? '—'}</p>
                </button>
              ))}
            </div>
          )}
          {query.length >= 2 && results.length === 0 && (
            <p className="text-sm text-[#777D7A]">Sin resultados</p>
          )}
        </div>
      )}
    </div>
  );
}

function LoanSummaryPanel({
  amount,
  interest,
  total,
  customInterestRate,
  amortizationType,
  paymentFrequency,
  firstPaymentDate,
}: {
  amount: number;
  interest: number;
  total: number;
  customInterestRate: string;
  amortizationType: AmortizationType;
  paymentFrequency: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY';
  firstPaymentDate: string;
}) {
  const interestPercent = amount > 0 ? (interest / amount) * 100 : 0;

  const amortLabels: Record<AmortizationType, string> = {
    SIMPLE: 'Simple',
    INDEFINITE: 'Plazo indefinido',
    NO_INTEREST: 'Sin intereses',
  };

  const freqLabels: Record<string, string> = {
    MONTHLY: 'Mensual',
    FORTNIGHTLY: 'Quincenal',
    WEEKLY: 'Semanal',
  };

  return (
    <section className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm lg:p-8">
      <div className="mb-6 flex items-center gap-3 text-[#173D2C]">
        <Calculator className="h-5 w-5 text-[#5FA37D]" />
        <h2 className="text-lg font-bold">Resumen del préstamo</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-[#EDF2EF] bg-[#F8FBF9] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#7A8A80]">Capital</p>
          <p className="mt-2 text-2xl font-bold text-[#173D2C]">{formatCurrency(amount)}</p>
        </div>
        <div className="rounded-xl border border-[#EDF2EF] bg-[#F8FBF9] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#7A8A80]">Interés generado</p>
          <p className="mt-2 text-2xl font-bold text-[#B45B38]">{formatCurrency(interest)}</p>
          <p className="mt-1 text-xs text-[#7A8A80]">{interestPercent.toFixed(1)}% del capital</p>
        </div>
        <div className="rounded-xl border border-[#EDF2EF] bg-[#F8FBF9] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#7A8A80]">Total a pagar</p>
          <p className="mt-2 text-2xl font-bold text-[#2F7654]">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[#EDF2EF] bg-[#FAFBFA] p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[#7A8A80]">Datos del préstamo</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#7A8A80]">Amortización</span>
            <span className="font-medium text-[#173D2C]">{amortLabels[amortizationType]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A8A80]">Interés</span>
            <span className="font-medium text-[#173D2C]">{customInterestRate || '—'}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A8A80]">Frecuencia</span>
            <span className="font-medium text-[#173D2C]">{freqLabels[paymentFrequency] || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A8A80]">Primera cuota</span>
            <span className="font-medium text-[#173D2C]">{firstPaymentDate || '—'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

type AmortizationType = 'SIMPLE' | 'INDEFINITE' | 'NO_INTEREST';

const amortizationOptions: { label: string; value: AmortizationType }[] = [
  { label: 'Simple', value: 'SIMPLE' },
  { label: 'Plazo indefinido', value: 'INDEFINITE' },
  { label: 'Sin intereses', value: 'NO_INTEREST' },
];

const termUnitOptions = [
  { label: 'Meses', value: 'months' as const },
  { label: 'Quincenas', value: 'fortnights' as const },
  { label: 'Semanas', value: 'weeks' as const },
];

const freqOptions: { label: string; value: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY' }[] = [
  { label: 'Mensual', value: 'MONTHLY' },
  { label: 'Quincenal', value: 'FORTNIGHTLY' },
  { label: 'Semanal', value: 'WEEKLY' },
];

function LoanParametersCard({
  amount,
  onAmountChange,
  customPayment,
  onCustomPaymentChange,
  customInterestRate,
  onCustomInterestRateChange,
  term,
  onTermChange,
  termUnit,
  onTermUnitChange,
  amortizationType,
  onAmortizationTypeChange,
  paymentFrequency,
  onPaymentFrequencyChange,
  firstPaymentDate,
  onFirstPaymentDateChange,
  purpose,
  onPurposeChange,
}: {
  amount: string;
  onAmountChange: (v: string) => void;
  customPayment: string;
  onCustomPaymentChange: (v: string) => void;
  customInterestRate: string;
  onCustomInterestRateChange: (v: string) => void;
  term: string;
  onTermChange: (v: string) => void;
  termUnit: 'months' | 'fortnights' | 'weeks';
  onTermUnitChange: (v: 'months' | 'fortnights' | 'weeks') => void;
  amortizationType: AmortizationType;
  onAmortizationTypeChange: (v: AmortizationType) => void;
  paymentFrequency: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY';
  onPaymentFrequencyChange: (v: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY') => void;
  firstPaymentDate: string;
  onFirstPaymentDateChange: (v: string) => void;
  purpose: string;
  onPurposeChange: (v: string) => void;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm lg:p-8"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
    >
      <h2 className="mb-7 text-xl font-bold text-[#173D2C]">Parámetros del préstamo</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextInput
            label="Monto a prestar"
            value={formatNumberInput(amount)}
            onChange={(v) => onAmountChange(v.replace(/,/g, ''))}
            prefix="RD$"
          />
          <TextInput
            label="Monto de cuota"
            value={formatNumberInput(customPayment)}
            onChange={(v) => onCustomPaymentChange(v.replace(/,/g, ''))}
            prefix="RD$"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextInput
            label="Porcentaje de interés"
            value={customInterestRate}
            onChange={onCustomInterestRateChange}
            suffix="%"
          />
          {amortizationType !== 'INDEFINITE' && (
            <div>
              <span className="mb-2 block text-sm font-bold text-[#6F8076]">Plazo</span>
              <div className="grid grid-cols-[minmax(0,1fr)_135px] gap-3">
                <TextInput label="" onChange={onTermChange} value={term} />
                <SelectInput
                  options={termUnitOptions.map((o) => o.label)}
                  value={termUnitOptions.find((o) => o.value === termUnit)?.label ?? 'Meses'}
                  onChange={(v) => onTermUnitChange(termUnitOptions.find((o) => o.label === v)?.value ?? 'months')}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm font-bold text-[#6F8076]">Amortización</span>
          <div className="flex gap-2">
            {amortizationOptions.map((opt) => (
              <button
                key={opt.value}
                className={`min-h-[42px] flex-1 rounded-[10px] border px-4 text-sm font-bold transition ${
                  amortizationType === opt.value
                    ? 'border-[#5FA37D] bg-[#EAF6EF] text-[#2F7654]'
                    : 'border-[#DDEBE3] bg-white text-[#6F8076] hover:border-[#C6D9CE]'
                }`}
                onClick={() => onAmortizationTypeChange(opt.value)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SelectInput
            label="Frecuencia"
            options={freqOptions.map((o) => o.label)}
            value={freqOptions.find((o) => o.value === paymentFrequency)?.label ?? 'Mensual'}
            onChange={(v) => onPaymentFrequencyChange(freqOptions.find((o) => o.label === v)?.value ?? 'MONTHLY')}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#6F8076]">Primera cuota</span>
            <input
              type="date"
              value={firstPaymentDate}
              onChange={(e) => onFirstPaymentDateChange(e.target.value)}
              className="h-[52px] w-full rounded-[10px] border border-[#DDEBE3] bg-white px-4 text-base font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition focus:border-[#4F9B76] focus:ring-2 focus:ring-[#EAF6EF]"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[#6F8076]">Descripción / propósito</span>
          <textarea
            className="h-[104px] w-full resize-none rounded-[10px] border border-[#DDEBE3] bg-white px-4 py-4 text-base font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition placeholder:text-[#8F9691] focus:border-[#4F9B76] focus:ring-2 focus:ring-[#EAF6EF]"
            placeholder="Ej. Capital de trabajo para negocio familiar..."
            value={purpose}
            onChange={(e) => onPurposeChange(e.target.value)}
          />
        </label>
      </div>
    </motion.section>
  );
}

function NewLoanStepTwo({
  selectedProduct,
  onSelectProduct,
  amount,
  term,
  onAmountChange,
  onTermChange,
  products,
  selectedClient,
  onSelectClient,
  termUnit,
  onTermUnitChange,
  paymentFrequency,
  onPaymentFrequencyChange,
  purpose,
  onPurposeChange,
  customInterestRate,
  onCustomInterestRateChange,
  customPayment,
  onCustomPaymentChange,
  amortizationType,
  onAmortizationTypeChange,
  firstPaymentDate,
  onFirstPaymentDateChange,
}: {
  selectedProduct: LoanProductItem | null;
  onSelectProduct: (product: LoanProductItem) => void;
  amount: string;
  term: string;
  onAmountChange: (value: string) => void;
  onTermChange: (value: string) => void;
  products: LoanProductItem[];
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  termUnit: 'months' | 'fortnights' | 'weeks';
  onTermUnitChange: (v: 'months' | 'fortnights' | 'weeks') => void;
  paymentFrequency: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY';
  onPaymentFrequencyChange: (v: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY') => void;
  purpose: string;
  onPurposeChange: (v: string) => void;
  customInterestRate: string;
  onCustomInterestRateChange: (v: string) => void;
  customPayment: string;
  onCustomPaymentChange: (v: string) => void;
  amortizationType: AmortizationType;
  onAmortizationTypeChange: (v: AmortizationType) => void;
  firstPaymentDate: string;
  onFirstPaymentDateChange: (v: string) => void;
}) {
  const rate = customInterestRate || (selectedProduct ? String(selectedProduct.interestRate) : '0');

  const [showSchedule, setShowSchedule] = useState(false);

  const summary = useMemo(() => {
    const principal = parseNumber(amount);
    const monthlyRate = parseNumber(rate) / 100;
    const rawMonths = Math.round(parseNumber(term));
    const months = amortizationType === 'INDEFINITE' ? Math.max(rawMonths, 12) : Math.max(rawMonths, 1);

    if (amortizationType === 'NO_INTEREST') {
      const payment = principal / months;
      return { principal, months, payment, total: principal, interest: 0 };
    }

    if (amortizationType === 'INDEFINITE') {
      const payment = principal * monthlyRate;
      return { principal, months, payment, total: payment * months, interest: payment * months };
    }

    const calcPayment = monthlyRate > 0 ? (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)) : principal / months;
    const payment = parseNumber(customPayment) || calcPayment;
    const total = payment * months;

    return {
      principal,
      months,
      payment,
      total,
      interest: Math.max(0, total - principal),
    };
  }, [amount, rate, term, customPayment, amortizationType]);

  const scheduleData = useMemo(
    () => computeSchedule(summary.principal, parseNumber(rate), summary.months, amortizationType),
    [summary.principal, rate, summary.months, amortizationType],
  );

  return (
    <>
      {selectedClient && (
        <div className="mb-6 w-full">
          <SelectableClientCard client={selectedClient} onSelectClient={onSelectClient} />
        </div>
      )}
      <div className="space-y-8">
        <LoanParametersCard
          amount={amount}
          onAmountChange={onAmountChange}
          customPayment={customPayment}
          onCustomPaymentChange={onCustomPaymentChange}
          customInterestRate={customInterestRate}
          onCustomInterestRateChange={onCustomInterestRateChange}
          term={term}
          onTermChange={onTermChange}
          termUnit={termUnit}
          onTermUnitChange={onTermUnitChange}
          amortizationType={amortizationType}
          onAmortizationTypeChange={onAmortizationTypeChange}
          paymentFrequency={paymentFrequency}
          onPaymentFrequencyChange={onPaymentFrequencyChange}
          firstPaymentDate={firstPaymentDate}
          onFirstPaymentDateChange={onFirstPaymentDateChange}
          purpose={purpose}
          onPurposeChange={onPurposeChange}
        />

        <button
          className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#2F7654] text-base font-bold text-white shadow-[0_10px_24px_rgba(47,118,84,0.18)] transition hover:-translate-y-0.5 hover:bg-[#285C43]"
          onClick={() => setShowSchedule(!showSchedule)}
          type="button"
        >
          <Calculator className="h-5 w-5" />
          {showSchedule ? 'Ocultar cuotas' : 'Calcular préstamo'}
        </button>

        {showSchedule && (
          <AmortizationTableCard
            schedule={scheduleData.schedule}
            totalPayment={scheduleData.totalPayment}
            totalPrincipal={scheduleData.totalPrincipal}
            totalInterest={scheduleData.totalInterest}
            term={summary.months}
          />
        )}

        <LoanSummaryPanel
          amount={summary.principal}
          interest={summary.interest}
          total={summary.total}
          customInterestRate={customInterestRate}
          amortizationType={amortizationType}
          paymentFrequency={paymentFrequency}
          firstPaymentDate={firstPaymentDate}
        />
      </div>
    </>
  );
}

function SummaryMetricCard({
  label,
  value,
  helper,
  highlight = false,
}: {
  label: string;
  value: string;
  helper?: string;
  highlight?: boolean;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[136px] rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A7B5AD]">{label}</p>
      <p className={`mt-4 text-[30px] font-bold leading-none ${highlight ? 'text-[#B45B38]' : 'text-[#173D2C]'}`}>
        {value}
      </p>
      {helper && <p className="mt-3 text-sm font-medium text-[#6F8076]">{helper}</p>}
    </motion.section>
  );
}

function LoanSummaryCards({
  amount,
  payment,
  interest,
  total,
  term,
}: {
  amount: number;
  payment: number;
  interest: number;
  total: number;
  term: number;
}) {
  const interestPercent = amount > 0 ? ((interest / amount) * 100).toFixed(1) : '0';
  return (
    <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <SummaryMetricCard label="CAPITAL" value={formatCurrency(amount)} />
      <SummaryMetricCard helper="mensual" label="CUOTA" value={formatCurrency(payment)} />
      <SummaryMetricCard helper={`${interestPercent}% sobre capital`} highlight label="TOTAL INTERESES" value={formatCurrency(interest)} />
      <SummaryMetricCard helper={`en ${term} ${term === 1 ? 'mes' : 'meses'}`} label="TOTAL A PAGAR" value={formatCurrency(total)} />
    </div>
  );
}

function LoanClientSummary({
  client,
  product,
  amount,
  term,
}: {
  client: Client;
  product: LoanProductItem | null;
  amount: string;
  term: string;
}) {
  const fullName = `${client.firstName} ${client.lastName}`;
  const freqLabel = product?.paymentFrequency === 'MONTHLY' ? 'Mensual' : product?.paymentFrequency ?? '';
  const rateLabel = product ? `${product.interestRate}%` : '';
  const pills = [product?.name ?? '', freqLabel, rateLabel].filter(Boolean);

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-2xl border border-neutral-100 bg-white px-7 py-7 shadow-sm"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-[#EAF6EF] shadow-[0_7px_18px_rgba(40,92,67,0.14)]">
            <UserRound className="h-7 w-7 text-[#5FA37D]" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-[#173D2C]">{fullName}</p>
            <p className="mt-1 text-sm font-medium text-[#7A8A80]">{client.identification ?? '—'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {pills.map((pill, index) => (
            <span
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                index === 0 ? 'bg-[#E7F4EC] text-[#2F7654]' : 'bg-[#F3FAF6] text-[#5C6D63]'
              }`}
              key={pill}
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function AmortizationRow({ row, total = false }: { row: { number: number | string; payment: number | string; principal: number | string; interest: number | string; balance: number | string }; total?: boolean }) {
  const fmt = (v: number | string) => (typeof v === 'number' ? formatCurrency(v) : v);
  return (
    <div
      className={`grid min-w-[980px] grid-cols-[120px_1.2fr_1.2fr_1.2fr_1.2fr] items-center border-t border-[#EDF2EF] px-7 py-5 text-base ${
        total ? 'bg-[#F3FAF6] font-bold' : row.number === 5 ? 'bg-[#F6FAF7]' : 'bg-white'
      }`}
    >
      <span className={total ? 'text-[#6F8076]' : 'font-medium text-[#7A8A80]'}>{row.number}</span>
      <span className="text-right font-bold text-[#173D2C]">{fmt(row.payment)}</span>
      <span className="text-right font-medium text-[#2F7654]">{fmt(row.principal)}</span>
      <span className="text-right font-medium text-[#B45B38]">{fmt(row.interest)}</span>
      <span className={`text-right font-bold ${total ? 'text-[#A7B5AD]' : 'text-[#173D2C]'}`}>{fmt(row.balance)}</span>
    </div>
  );
}

function AmortizationTableCard({
  schedule,
  totalPayment,
  totalPrincipal,
  totalInterest,
  term,
}: {
  schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[];
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  term: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? schedule : schedule.slice(0, 6);

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
    >
      <div className="flex items-center justify-between gap-4 px-7 py-6">
        <h2 className="text-lg font-bold text-[#173D2C]">Tabla de amortización</h2>
        <p className="text-sm font-medium text-[#7A8A80]">{term} {term === 1 ? 'mes' : 'meses'} en total</p>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[980px] grid-cols-[120px_1.2fr_1.2fr_1.2fr_1.2fr] bg-[#F3FAF6] px-7 py-5 text-sm font-bold uppercase tracking-[0.08em] text-[#7A8A80]">
          <span>#</span>
          <span className="text-right">CUOTA</span>
          <span className="text-right">CAPITAL</span>
          <span className="text-right">INTERÉS</span>
          <span className="text-right">SALDO</span>
        </div>

        <motion.div layout>
          {visibleRows.map((row) => (
            <AmortizationRow key={row.number} row={row} />
          ))}
        </motion.div>

        <AmortizationRow
          row={{
            number: 'TOTAL',
            payment: totalPayment,
            principal: totalPrincipal,
            interest: totalInterest,
            balance: 0,
          }}
          total
        />
      </div>

      <button
        className="flex h-16 w-full items-center justify-center gap-3 border-t border-[#EDF2EF] bg-white text-base font-medium text-[#4F9B76] transition hover:bg-[#F6FAF7]"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        <ChevronDown className={`h-5 w-5 transition ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? 'Ocultar cuotas restantes' : 'Ver las 6 cuotas restantes'}
      </button>
    </motion.section>
  );
}

function computeSchedule(principal: number, annualRate: number, months: number, amortizationType: AmortizationType = 'SIMPLE') {
  const monthlyRate = annualRate / 100 / 12;

  if (amortizationType === 'NO_INTEREST') {
    const payment = months > 0 ? principal / months : 0;
    let balance = principal;
    const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [];

    for (let i = 1; i <= months; i++) {
      const princ = Math.min(payment, balance);
      balance -= princ;
      schedule.push({
        number: i,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(princ * 100) / 100,
        interest: 0,
        balance: Math.round(Math.max(balance, 0) * 100) / 100,
      });
    }

    return { schedule, totalPayment: principal, totalPrincipal: principal, totalInterest: 0, payment: Math.round(payment * 100) / 100 };
  }

  if (amortizationType === 'INDEFINITE') {
    let totalInterest = 0;
    const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [];

    for (let i = 1; i <= months; i++) {
      const interest = principal * monthlyRate;
      totalInterest += interest;
      schedule.push({
        number: i,
        payment: Math.round(interest * 100) / 100,
        principal: 0,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(principal * 100) / 100,
      });
    }

    const totalInterestRounded = Math.round(totalInterest * 100) / 100;
    return { schedule, totalPayment: totalInterestRounded, totalPrincipal: 0, totalInterest: totalInterestRounded, payment: Math.round(principal * monthlyRate * 100) / 100 };
  }

  const payment = monthlyRate > 0
    ? principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)
    : months > 0 ? principal / months : 0;

  let balance = principal;
  let totalInterest = 0;
  const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [];

  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const princ = payment - interest;
    balance -= princ;
    totalInterest += interest;
    schedule.push({
      number: i,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(princ * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(Math.max(balance, 0) * 100) / 100,
    });
  }

  if (schedule.length > 0) {
    const last = schedule[schedule.length - 1];
    if (last.balance !== 0) {
      last.principal += last.balance;
      last.payment = last.principal + last.interest;
      last.balance = 0;
    }
  }

  const totalPayment = Math.round((principal + totalInterest) * 100) / 100;
  return { schedule, totalPayment, totalPrincipal: principal, totalInterest: Math.round(totalInterest * 100) / 100, payment: Math.round(payment * 100) / 100 };
}

function Header({ step }: { step: WizardStep }) {
  return (
    <>
      {step === 1 && (
        <Link
          className="inline-flex items-center gap-3 text-sm font-bold text-[#5C6D63] transition hover:text-[#173D2C]"
          href="/inicio"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
      )}

      <div className={`${step === 1 ? 'mt-8' : ''} grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end`}>
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E7F4EC] px-3 py-1 text-sm font-bold text-[#2F7654]">
            <span className="h-2 w-2 rounded-full bg-[#5FA37D]" />
            Nuevo préstamo
          </span>
          <h1 className="mt-6 text-[36px] font-bold leading-none text-[#173D2C] sm:text-[42px]">
            Crear préstamo
          </h1>
          <p className="mt-4 max-w-[720px] text-base font-medium leading-7 text-[#7A8A80]">
            Configura los parámetros y revisa el cálculo antes de confirmar.
          </p>
        </div>
        <LoanWizardStepper step={step} />
      </div>
    </>
  );
}

function WizardActions({
  step,
  selectedClient,
  canContinue,
  canConfirm,
  saving,
  onBack,
  onConfirm,
  onContinue,
}: {
  step: WizardStep;
  selectedClient: boolean;
  canContinue: boolean;
  canConfirm: boolean;
  saving: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onContinue: () => void;
}) {
  if (step === 1) {
    return (
      <div className="sticky bottom-0 -mx-5 mt-8 flex justify-end bg-[#F3F4F6]/92 px-5 py-4 backdrop-blur-sm lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0">
        <ContinueButton enabled={selectedClient} onClick={onContinue} />
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 -mx-5 mt-9 flex flex-col justify-between gap-4 bg-[#F3F4F6]/92 px-5 py-4 backdrop-blur-sm sm:flex-row lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0">
      <button
        className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-[#DDEBE3] bg-white px-8 text-sm font-bold text-[#173D2C] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6FAF7] hover:shadow-md"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft className="h-5 w-5" />
        Atrás
      </button>
      <button
        className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#2F7654] px-9 text-sm font-bold text-white shadow-[0_14px_26px_rgba(47,118,84,0.24)] transition hover:-translate-y-0.5 hover:bg-[#285C43] disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!canConfirm || saving}
        onClick={onConfirm}
        type="button"
      >
        <Check className="h-5 w-5" />
        {saving ? 'Creando...' : 'Confirmar y crear préstamo'}
      </button>
    </div>
  );
}

export function NewLoanPage({ initialClientId }: { initialClientId?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(initialClientId ? 2 : 1);
  const [loadingClient, setLoadingClient] = useState(!!initialClientId);
  const [products, setProducts] = useState<LoanProductItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<LoanProductItem | null>(null);
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [termUnit, setTermUnit] = useState<'months' | 'fortnights' | 'weeks'>('months');
  const [paymentFrequency, setPaymentFrequency] = useState<'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY'>('MONTHLY');
  const [purpose, setPurpose] = useState('');
  const [customInterestRate, setCustomInterestRate] = useState('');
  const [customPayment, setCustomPayment] = useState('');
  const [amortizationType, setAmortizationType] = useState<AmortizationType>('SIMPLE');
  const [firstPaymentDate, setFirstPaymentDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLoanProducts().then(setProducts);
  }, []);

  useEffect(() => {
    if (!initialClientId) return;
    getClient(initialClientId)
      .then(setSelectedClient)
      .catch(() => setSelectedClient(null))
      .finally(() => setLoadingClient(false));
  }, [initialClientId]);

  async function handleCreate() {
    if (!selectedClient || !selectedProduct || !amount || !term) return;
    setSaving(true);
    try {
      const totalTerm = termUnit === 'weeks' ? Math.round(Number(term) / 4) : termUnit === 'fortnights' ? Math.round(Number(term) / 2.17) : Number(term);
      await createLoan({
        clientId: selectedClient.id,
        productId: selectedProduct.id,
        principal: Number(amount),
        term: totalTerm,
        startDate: firstPaymentDate || new Date().toISOString(),
      });
      router.push(`/clientes/${selectedClient.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] px-5 py-7 font-sans text-[#173D2C] lg:px-9 lg:py-8">
      <div className="mx-auto max-w-[1720px]">
        <Header step={step} />

        {loadingClient ? (
          <div className="flex items-center justify-center py-20 text-sm text-neutral-400">Cargando cliente...</div>
        ) : step === 1 ? (
          <NewLoanStepOne
            selectedClient={selectedClient}
            onSelectClient={setSelectedClient}
          />
        ) : (
          <NewLoanStepTwo
            amount={amount}
            onAmountChange={setAmount}
            onSelectClient={setSelectedClient}
            onSelectProduct={setSelectedProduct}
            onTermChange={setTerm}
            products={products}
            selectedClient={selectedClient}
            selectedProduct={selectedProduct}
            term={term}
            termUnit={termUnit}
            onTermUnitChange={setTermUnit}
            paymentFrequency={paymentFrequency}
            onPaymentFrequencyChange={setPaymentFrequency}
            purpose={purpose}
            onPurposeChange={setPurpose}
            customInterestRate={customInterestRate}
            onCustomInterestRateChange={setCustomInterestRate}
            customPayment={customPayment}
            onCustomPaymentChange={setCustomPayment}
            amortizationType={amortizationType}
            onAmortizationTypeChange={setAmortizationType}
            firstPaymentDate={firstPaymentDate}
            onFirstPaymentDateChange={setFirstPaymentDate}
          />
        )}

        <WizardActions
          onBack={() => setStep(1)}
          onConfirm={handleCreate}
          onContinue={() => setStep(2)}
          selectedClient={!!selectedClient}
          canContinue={!!selectedClient}
          canConfirm={!!selectedClient && !!selectedProduct && !!amount && !!term}
          saving={saving}
          step={step}
        />
      </div>
    </main>
  );
}
