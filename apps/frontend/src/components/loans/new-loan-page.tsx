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
  Search,
  UserRound,
} from 'lucide-react';
import { getLoanProducts, type LoanProductItem } from '@/lib/api/loan-products';
import { createLoan } from '@/lib/api/loans';
import { getClients } from '@/lib/api/clients';
import type { Client } from '@inversiones/shared';

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
      {label && <span className="mb-1.5 block text-xs font-bold text-[#6F8076]">{label}</span>}
      <div className="flex h-[42px] items-center rounded-[8px] border border-[#DDEBE3] bg-white px-3 text-sm font-medium text-[#173D2C] shadow-[0_2px_6px_rgba(40,92,67,0.05)] transition focus-within:border-[#4F9B76] focus-within:ring-2 focus-within:ring-[#EAF6EF]">
        {prefix && <span className="mr-2 shrink-0 text-xs text-[#7A8A80]">{prefix}</span>}
        <input
          className="h-full min-w-0 flex-1 bg-transparent outline-none"
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          value={value}
          readOnly={readOnly}
        />
        {suffix && <span className="ml-2 shrink-0 text-xs text-[#7A8A80]">{suffix}</span>}
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
      {label && <span className="mb-1.5 block text-xs font-bold text-[#6F8076]">{label}</span>}
      <div className="relative">
        <select
          className="h-[42px] w-full appearance-none rounded-[8px] border border-[#DDEBE3] bg-white px-3 pr-8 text-sm font-medium text-[#173D2C] shadow-[0_2px_6px_rgba(40,92,67,0.05)] outline-none transition focus:border-[#4F9B76] focus:ring-2 focus:ring-[#EAF6EF]"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A7B5AD]" />
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
    <div className="rounded-[14px] border border-[#EDF2EF] bg-white shadow-[0_4px_14px_rgba(40,92,67,0.03)]">
      <div className="flex min-h-[72px] items-center gap-3 px-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[2px] border-white bg-[#EAF6EF] shadow-[0_4px_12px_rgba(40,92,67,0.1)]">
          <UserRound className="h-5 w-5 text-[#5FA37D]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold leading-tight text-[#173D2C]">{fullName}</p>
          <p className="mt-0.5 text-xs font-medium text-[#7A8A80]">{client.identification ?? '—'}</p>
        </div>
        <button
          className="shrink-0 rounded-lg border border-[#DDEBE3] px-2.5 py-1 text-xs font-bold text-[#5FA37D] transition hover:bg-[#F0F7F3]"
          onClick={() => setShowSearch(!showSearch)}
          type="button"
        >
          Cambiar
        </button>
      </div>

      {showSearch && (
        <div className="border-t border-[#EDF2EF] px-4 py-3">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A9CDBB]" />
            <input
              autoFocus
              className="h-[38px] w-full rounded-[10px] border border-[#DDEBE3] bg-[#F8FBF9] pl-9 pr-3 text-sm font-medium text-[#173D2C] outline-none transition placeholder:text-[#A0AFA8] focus:border-[#285C43] focus:bg-white"
              placeholder="Buscar cliente por nombre, cédula o teléfono…"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {results.length > 0 && (
            <div className="max-h-[180px] space-y-1 overflow-y-auto">
              {results.map((c) => (
                <button
                  key={c.id}
                  className="w-full rounded-[8px] border border-[#EDF2EF] p-2.5 text-left text-xs transition hover:bg-[#F6FAF7]"
                  onClick={() => handleSelect(c)}
                  type="button"
                >
                  <p className="font-bold text-[#173D2C]">{c.firstName} {c.lastName}</p>
                  <p className="mt-0.5 text-[#777D7A]">{c.identification ?? '—'} · {c.phone ?? '—'}</p>
                </button>
              ))}
            </div>
          )}
          {query.length >= 2 && results.length === 0 && (
            <p className="text-xs text-[#777D7A]">Sin resultados</p>
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
    <section className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm lg:p-5">
      <div className="mb-4 flex items-center gap-2 text-[#173D2C]">
        <Calculator className="h-4 w-4 text-[#5FA37D]" />
        <h2 className="text-sm font-bold">Resumen del préstamo</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#EDF2EF] bg-[#F8FBF9] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7A8A80]">Capital</p>
          <p className="mt-1 text-lg font-bold text-[#173D2C]">{formatCurrency(amount)}</p>
        </div>
        <div className="rounded-lg border border-[#EDF2EF] bg-[#F8FBF9] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7A8A80]">Interés generado</p>
          <p className="mt-1 text-lg font-bold text-[#B45B38]">{formatCurrency(interest)}</p>
          <p className="mt-0.5 text-[10px] text-[#7A8A80]">{interestPercent.toFixed(1)}% del capital</p>
        </div>
        <div className="rounded-lg border border-[#EDF2EF] bg-[#F8FBF9] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7A8A80]">Total a pagar</p>
          <p className="mt-1 text-lg font-bold text-[#2F7654]">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[#EDF2EF] bg-[#FAFBFA] p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7A8A80]">Datos del préstamo</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
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

function MainInfoCard({
  amount,
  onAmountChange,
  customInterestRate,
  onCustomInterestRateChange,
  term,
  onTermChange,
  termUnit,
  onTermUnitChange,
  amortizationType,
  purpose,
  onPurposeChange,
}: {
  amount: string;
  onAmountChange: (v: string) => void;
  customInterestRate: string;
  onCustomInterestRateChange: (v: string) => void;
  term: string;
  onTermChange: (v: string) => void;
  termUnit: 'months' | 'fortnights' | 'weeks';
  onTermUnitChange: (v: 'months' | 'fortnights' | 'weeks') => void;
  amortizationType: AmortizationType;
  purpose: string;
  onPurposeChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute -top-3 left-5 z-10 inline-flex items-center gap-1.5 rounded-lg bg-[#E7F4EC] px-3 py-1.5 text-sm font-bold text-[#2F7654] shadow-sm">
        Información Principal
      </span>
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-neutral-100 bg-white p-4 pt-6 shadow-sm lg:p-5 lg:pt-7"
        initial={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
      >
        <div className="space-y-3">
          <TextInput
            label="Monto a prestar"
            value={formatNumberInput(amount)}
            onChange={(v) => onAmountChange(v.replace(/,/g, ''))}
            prefix="RD$"
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextInput
              label="Porcentaje de interés"
              value={customInterestRate}
              onChange={onCustomInterestRateChange}
              suffix="%"
            />
            {amortizationType !== 'INDEFINITE' && (
              <div>
                <span className="mb-1.5 block text-xs font-bold text-[#6F8076]">Plazo</span>
                <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
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
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#6F8076]">Descripción / propósito</span>
            <textarea
              className="h-[72px] w-full resize-none rounded-[8px] border border-[#DDEBE3] bg-white px-3 py-2.5 text-sm font-medium text-[#173D2C] shadow-[0_2px_6px_rgba(40,92,67,0.05)] outline-none transition placeholder:text-[#8F9691] focus:border-[#4F9B76] focus:ring-2 focus:ring-[#EAF6EF]"
              placeholder="Ej. Capital de trabajo para negocio familiar..."
              value={purpose}
              onChange={(e) => onPurposeChange(e.target.value)}
            />
          </label>
        </div>
      </motion.section>
    </div>
  );
}

function PaymentConfigCard({
  customPayment,
  onCustomPaymentChange,
  amortizationType,
  onAmortizationTypeChange,
  paymentFrequency,
  onPaymentFrequencyChange,
  firstPaymentDate,
  onFirstPaymentDateChange,
}: {
  customPayment: string;
  onCustomPaymentChange: (v: string) => void;
  amortizationType: AmortizationType;
  onAmortizationTypeChange: (v: AmortizationType) => void;
  paymentFrequency: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY';
  onPaymentFrequencyChange: (v: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY') => void;
  firstPaymentDate: string;
  onFirstPaymentDateChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute -top-3 left-5 z-10 inline-flex items-center gap-1.5 rounded-lg bg-[#E7F4EC] px-3 py-1.5 text-sm font-bold text-[#2F7654] shadow-sm">
        Configuración de pago
      </span>
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-neutral-100 bg-white p-4 pt-6 shadow-sm lg:p-5 lg:pt-7"
        initial={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
      >
        <div className="space-y-3">
          <TextInput
            label="Monto de cuota"
            value={formatNumberInput(customPayment)}
            onChange={(v) => onCustomPaymentChange(v.replace(/,/g, ''))}
            prefix="RD$"
          />
          <div>
            <span className="mb-1.5 block text-xs font-bold text-[#6F8076]">Amortización</span>
            <div className="flex gap-1.5">
              {amortizationOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`min-h-[34px] flex-1 rounded-[8px] border px-3 text-xs font-bold transition ${
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SelectInput
              label="Frecuencia"
              options={freqOptions.map((o) => o.label)}
              value={freqOptions.find((o) => o.value === paymentFrequency)?.label ?? 'Mensual'}
              onChange={(v) => onPaymentFrequencyChange(freqOptions.find((o) => o.label === v)?.value ?? 'MONTHLY')}
            />
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#6F8076]">Primera cuota</span>
              <input
                type="date"
                value={firstPaymentDate}
                onChange={(e) => onFirstPaymentDateChange(e.target.value)}
                className="h-[42px] w-full rounded-[8px] border border-[#DDEBE3] bg-white px-3 text-sm font-medium text-[#173D2C] shadow-[0_2px_6px_rgba(40,92,67,0.05)] outline-none transition focus:border-[#4F9B76] focus:ring-2 focus:ring-[#EAF6EF]"
              />
            </label>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function NewLoanStepTwo({
  amount,
  term,
  onAmountChange,
  onTermChange,
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
  amount: string;
  term: string;
  onAmountChange: (value: string) => void;
  onTermChange: (value: string) => void;
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
  const rate = customInterestRate || '0';

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
    () => computeSchedule(summary.principal, parseNumber(rate), summary.months, amortizationType, customPayment),
    [summary.principal, rate, summary.months, amortizationType, customPayment],
  );

  return (
    <div className="mt-8 space-y-5">
      {selectedClient && (
        <SelectableClientCard client={selectedClient} onSelectClient={onSelectClient} />
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MainInfoCard
          amount={amount}
          onAmountChange={onAmountChange}
          customInterestRate={customInterestRate}
          onCustomInterestRateChange={onCustomInterestRateChange}
          term={term}
          onTermChange={onTermChange}
          termUnit={termUnit}
          onTermUnitChange={onTermUnitChange}
          amortizationType={amortizationType}
          purpose={purpose}
          onPurposeChange={onPurposeChange}
        />
        <PaymentConfigCard
          customPayment={customPayment}
          onCustomPaymentChange={onCustomPaymentChange}
          amortizationType={amortizationType}
          onAmortizationTypeChange={onAmortizationTypeChange}
          paymentFrequency={paymentFrequency}
          onPaymentFrequencyChange={onPaymentFrequencyChange}
          firstPaymentDate={firstPaymentDate}
          onFirstPaymentDateChange={onFirstPaymentDateChange}
        />
      </div>

      <button
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2F7654] text-sm font-bold text-white shadow-[0_6px_16px_rgba(47,118,84,0.15)] transition hover:-translate-y-0.5 hover:bg-[#285C43]"
        onClick={() => setShowSchedule(!showSchedule)}
        type="button"
      >
        <Calculator className="h-4 w-4" />
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
      className="min-h-[120px] rounded-xl border border-neutral-100 bg-white p-5 shadow-sm"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A7B5AD]">{label}</p>
      <p className={`mt-3 text-2xl font-bold leading-none ${highlight ? 'text-[#B45B38]' : 'text-[#173D2C]'}`}>
        {value}
      </p>
      {helper && <p className="mt-2 text-xs font-medium text-[#6F8076]">{helper}</p>}
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
    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
      className="mt-5 rounded-xl border border-neutral-100 bg-white px-5 py-5 shadow-sm"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[2px] border-white bg-[#EAF6EF] shadow-[0_4px_12px_rgba(40,92,67,0.1)]">
            <UserRound className="h-5 w-5 text-[#5FA37D]" />
          </div>
          <div>
            <p className="text-base font-bold leading-tight text-[#173D2C]">{fullName}</p>
            <p className="mt-0.5 text-xs font-medium text-[#7A8A80]">{client.identification ?? '—'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pills.map((pill, index) => (
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
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
      className={`grid min-w-[860px] grid-cols-[100px_1.2fr_1.2fr_1.2fr_1.2fr] items-center border-t border-[#EDF2EF] px-5 py-3 text-sm ${
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
      className="overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <h2 className="text-sm font-bold text-[#173D2C]">Tabla de amortización</h2>
        <p className="text-xs font-medium text-[#7A8A80]">{term} {term === 1 ? 'mes' : 'meses'} en total</p>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[860px] grid-cols-[100px_1.2fr_1.2fr_1.2fr_1.2fr] bg-[#F3FAF6] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7A8A80]">
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
        className="flex h-12 w-full items-center justify-center gap-2 border-t border-[#EDF2EF] bg-white text-sm font-medium text-[#4F9B76] transition hover:bg-[#F6FAF7]"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        <ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? 'Ocultar cuotas restantes' : 'Ver las 6 cuotas restantes'}
      </button>
    </motion.section>
  );
}

function roundToNearestHundred(value: number): number {
  return Math.round(value / 100) * 100;
}

function computeSchedule(principal: number, annualRate: number, months: number, amortizationType: AmortizationType = 'SIMPLE', customPayment?: string) {
  const monthlyRate = annualRate / 100 / 12;
  const useCustomPayment = customPayment && parseNumber(customPayment) > 0;

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
    const rawInterest = principal * monthlyRate;
    const roundedPayment = useCustomPayment ? Math.round(rawInterest * 100) / 100 : roundToNearestHundred(rawInterest);
    let totalInterest = 0;
    const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [];

    for (let i = 1; i <= months; i++) {
      totalInterest += roundedPayment;
      schedule.push({
        number: i,
        payment: roundedPayment,
        principal: 0,
        interest: roundedPayment,
        balance: Math.round(principal * 100) / 100,
      });
    }

    const totalInterestRounded = Math.round(totalInterest * 100) / 100;
    return { schedule, totalPayment: totalInterestRounded, totalPrincipal: 0, totalInterest: totalInterestRounded, payment: roundedPayment };
  }

  if (useCustomPayment) {
    const payment = parseNumber(customPayment);
    let balance = principal;
    let totalInterest = 0;
    const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [];

    for (let i = 1; i <= months; i++) {
      const interest = balance * monthlyRate;
      const princ = Math.min(payment - interest, balance);
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

    return {
      schedule,
      totalPayment: Math.round((principal + totalInterest) * 100) / 100,
      totalPrincipal: principal,
      totalInterest: Math.round(totalInterest * 100) / 100,
      payment,
    };
  }

  const rawPayment = monthlyRate > 0
    ? principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)
    : months > 0 ? principal / months : 0;

  const payment = roundToNearestHundred(rawPayment);
  let balance = principal;
  let totalInterest = 0;
  const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [];

  for (let i = 1; i < months; i++) {
    const interest = balance * monthlyRate;
    const princ = payment - interest;

    if (princ < 0) {
      const safePrincipal = Math.max(balance * 0.01, 0);
      balance -= safePrincipal;
      totalInterest += interest;
      schedule.push({
        number: i,
        payment: Math.round((safePrincipal + interest) * 100) / 100,
        principal: Math.round(safePrincipal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(Math.max(balance, 0) * 100) / 100,
      });
    } else {
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
  }

  const lastInterest = balance * monthlyRate;
  const lastPayment = balance + lastInterest;
  totalInterest += lastInterest;

  schedule.push({
    number: months,
    payment: Math.round(lastPayment * 100) / 100,
    principal: Math.round(balance * 100) / 100,
    interest: Math.round(lastInterest * 100) / 100,
    balance: 0,
  });

  const totalPayment = Math.round((principal + totalInterest) * 100) / 100;
  return { schedule, totalPayment, totalPrincipal: principal, totalInterest: Math.round(totalInterest * 100) / 100, payment: Math.round(payment * 100) / 100 };
}

function Header() {
  return (
    <>
      <Link
        className="inline-flex items-center gap-3 text-sm font-bold text-[#5C6D63] transition hover:text-[#173D2C]"
        href="/inicio"
      >
        <ArrowLeft className="h-5 w-5" />
        Volver
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
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
      </div>
    </>
  );
}

function WizardActions({
  canConfirm,
  saving,
  onConfirm,
}: {
  canConfirm: boolean;
  saving: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-8 flex justify-end bg-[#F3F4F6]/92 px-5 py-4 backdrop-blur-sm lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0">
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2F7654] px-7 text-sm font-bold text-white shadow-[0_10px_20px_rgba(47,118,84,0.2)] transition hover:-translate-y-0.5 hover:bg-[#285C43] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canConfirm || saving}
        onClick={onConfirm}
        type="button"
      >
        <Check className="h-4 w-4" />
        {saving ? 'Creando...' : 'Confirmar y crear préstamo'}
      </button>
    </div>
  );
}

export function NewLoanPage() {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<LoanProductItem | null>(null);
  const [productsError, setProductsError] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
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
    getLoanProducts()
      .then((data) => {
        if (data.length > 0) setSelectedProduct(data[0]);
      })
      .catch(() => {
        setProductsError(
          'No se pudieron cargar los productos de préstamo. Verifica la conexión con el backend.',
        );
      });
  }, []);

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
        <Header />

        {productsError && (
          <p className="mt-6 rounded-[14px] border border-[#F1C9B7] bg-[#FFF4EE] px-4 py-3 text-sm font-medium text-[#B45B38]">
            {productsError}
          </p>
        )}

        <NewLoanStepTwo
          amount={amount}
          onAmountChange={setAmount}
          onSelectClient={setSelectedClient}
          onTermChange={setTerm}
          selectedClient={selectedClient}
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

        {selectedClient && (
          <WizardActions
            onConfirm={handleCreate}
            canConfirm={!!selectedClient && !!selectedProduct && !!amount && !!term}
            saving={saving}
          />
        )}
      </div>
    </main>
  );
}
