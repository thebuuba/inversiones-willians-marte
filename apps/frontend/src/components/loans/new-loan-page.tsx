'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calculator,
  Check,
  ChevronDown,
  Landmark,
  ReceiptText,
  Search,
  TrendingUp,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { getLoanProducts, type LoanProductItem } from '@/lib/api/loan-products';
import { createLoan } from '@/lib/api/loans';
import { getClients, getClientBasic } from '@/lib/api/clients';
import { invalidateCache, invalidateCachePrefix } from '@/lib/use-client-cache';
import { formatDop } from '@/lib/currency';
import {
  canCalculateLoan,
  computeSchedule,
  getInstallmentIsoDate,
  getLoanSummaryTotals,
  getPeriodicInterestRate,
  normalizeLoanTerm,
  parseNumber,
  parseStrictNumber,
  shouldShowCalculatedLoanActions,
  solveRate,
  type AmortizationType,
  type LoanTermUnit,
} from './new-loan-form.helpers';
import { CarterasCard } from './carteras-card';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { getNextMonthIsoDate } from '@/components/ui/date-picker.helpers';
import type { Client } from '@inversiones/shared';

function getDefaultFirstPaymentDate(): string {
  return getNextMonthIsoDate();
}

function formatCurrency(value: number): string {
  return formatDop(value, { decimals: 2 });
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
  error,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  prefix?: string;
  suffix?: string;
  className?: string;
  readOnly?: boolean;
  error?: string;
}) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-xs font-bold text-[#5C6D63]">{label}</span>}
      <div className={`flex h-[42px] items-center rounded-[8px] border bg-white px-3 text-sm font-medium text-[#173D2C] shadow-[0_2px_6px_rgba(40,92,67,0.05)] transition focus-within:ring-2 ${
        error ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-100' : 'border-[#DDEBE3] focus-within:border-[#285C43] focus-within:ring-[#EAF6EF]'
      }`}>
        {prefix && <span className="mr-2 shrink-0 text-xs text-[#5C6D63]">{prefix}</span>}
        <input
          className="h-full min-w-0 flex-1 bg-transparent outline-none"
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          value={value}
          readOnly={readOnly}
        />
        {suffix && <span className="ml-2 shrink-0 text-xs text-[#5C6D63]">{suffix}</span>}
      </div>
      {error && <span className="mt-1 block text-xs font-medium text-red-500">{error}</span>}
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
  className = '',
  error,
}: {
  label?: string;
  value: string;
  options: string[];
  onChange?: (v: string) => void;
  className?: string;
  error?: string;
}) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-xs font-bold text-[#5C6D63]">{label}</span>}
      <div className="relative">
        <select
          className={`h-[42px] w-full appearance-none rounded-[8px] border bg-white px-3 pr-8 text-sm font-medium text-[#173D2C] shadow-[0_2px_6px_rgba(40,92,67,0.05)] outline-none transition focus:ring-2 ${
            error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-[#DDEBE3] focus:border-[#285C43] focus:ring-[#EAF6EF]'
          }`}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A7B5AD]" />
      </div>
      {error && <span className="mt-1 block text-xs font-medium text-red-500">{error}</span>}
    </label>
  );
}

function ClientSearchCard({
  selectedClient,
  onSelectClient,
}: {
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
}) {
  const [changingClient, setChangingClient] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const showSearch = !selectedClient || changingClient;

  useEffect(() => {
    if (!showSearch) return;
    if (query.length < 2) return;
    const timer = setTimeout(() => {
      getClients(query).then((r) => setResults(r.data));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, showSearch]);

  function handleSelect(client: Client) {
    onSelectClient(client);
    setChangingClient(false);
    setQuery('');
    setResults([]);
  }

  if (selectedClient && !showSearch) {
    const fullName = `${selectedClient.firstName} ${selectedClient.lastName}`;
    return (
      <div className="rounded-[14px] border border-[#EDF2EF] bg-white shadow-[0_4px_14px_rgba(40,92,67,0.03)]">
        <div className="flex min-h-[72px] items-center gap-3 px-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[2px] border-white bg-[#EAF6EF] shadow-[0_4px_12px_rgba(40,92,67,0.1)]">
            <UserRound className="h-5 w-5 text-[#2F7654]" />
          </div>
          <button
            className="min-w-0 flex-1 text-left"
            onClick={() => setChangingClient(true)}
            type="button"
          >
            <p className="truncate text-base font-bold leading-tight text-[#173D2C]">{fullName}</p>
            <p className="mt-0.5 text-xs font-medium text-[#5C6D63]">{selectedClient.identification ?? '—'}</p>
          </button>
          <button
            className="shrink-0 rounded-lg border border-[#DDEBE3] px-2.5 py-1 text-xs font-bold text-[#2F7654] transition hover:bg-[#F0F7F3]"
            onClick={() => setChangingClient(true)}
            type="button"
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-[#EDF2EF] bg-white shadow-[0_4px_14px_rgba(40,92,67,0.03)]">
      <div className="px-4 py-3">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5C6D63]" />
          <input
            autoFocus
            className="h-[42px] w-full rounded-[10px] border border-[#DDEBE3] bg-[#F8FBF9] pl-9 pr-3 text-sm font-medium text-[#173D2C] outline-none transition placeholder:text-[#5C6D63] focus:border-[#285C43] focus:bg-white"
            placeholder="Buscar cliente por nombre, cédula o teléfono…"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length < 2) setResults([]);
            }}
          />
        </div>
        {results.length > 0 && (
          <div className="max-h-[200px] space-y-1 overflow-y-auto">
            {results.map((c) => (
              <button
                key={c.id}
                className="w-full rounded-[8px] border border-[#EDF2EF] p-2.5 text-left text-xs transition hover:bg-[#F6FAF7]"
                onClick={() => handleSelect(c)}
                type="button"
              >
                <p className="font-bold text-[#173D2C]">{c.firstName} {c.lastName}</p>
                <p className="mt-0.5 text-[#5C6D63]">{c.identification ?? '—'} · {c.phone ?? '—'}</p>
              </button>
            ))}
          </div>
        )}
        {query.length >= 2 && results.length === 0 && (
          <p className="text-xs text-[#5C6D63]">Sin resultados</p>
        )}
        {selectedClient && (
          <button
            className="mt-2 text-xs font-bold text-[#2F7654] transition hover:text-[#285C43]"
            onClick={() => setChangingClient(false)}
            type="button"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

function LoanSummaryPanel({
  amount,
  interest,
  total,
}: {
  amount: number;
  interest: number;
  total: number;
}) {
  const interestPercent = amount > 0 ? (interest / amount) * 100 : 0;

  return (
    <div className="relative">
      <span className="absolute -top-3 left-5 z-10 inline-flex items-center gap-1.5 rounded-lg bg-[#E7F4EC] px-3 py-1 text-xs font-bold text-[#2F7654] shadow-sm">
        <ReceiptText className="h-3 w-3" />
        Resumen del préstamo
      </span>
      <section className="overflow-hidden rounded-xl border border-[#DDEBE3] bg-white shadow-[0_4px_14px_rgba(40,92,67,0.05)]">
        <div className="grid grid-cols-1 divide-y divide-[#DDEBE3] md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="flex min-h-[74px] items-center justify-between gap-3 px-4 py-4">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Capital</p>
              <p className="mt-1.5 truncate text-xl font-bold leading-none text-[#111827]">{formatCurrency(amount)}</p>
              <p className="mt-1 text-xs font-medium text-[#6B7280]">Monto solicitado</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F0F1F4] text-[#374151]">
              <Landmark className="h-4 w-4" />
            </span>
          </div>
          <div className="flex min-h-[74px] items-center justify-between gap-3 px-4 py-4">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Interés generado</p>
              <p className="mt-1.5 truncate text-xl font-bold leading-none text-[#B73B2F]">{formatCurrency(interest)}</p>
              <p className="mt-1 text-xs font-medium text-[#6B7280]"><span className="font-bold text-[#B73B2F]">{interestPercent.toFixed(1)}%</span> del capital</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#FBE5E3] text-[#C7392E]">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="flex min-h-[74px] items-center justify-between gap-3 px-4 py-4">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Total a pagar</p>
              <p className="mt-1.5 truncate text-xl font-bold leading-none text-[#2F7654]">{formatCurrency(total)}</p>
              <p className="mt-1 text-xs font-medium text-[#6B7280]">Capital + intereses</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#E7F4EC] text-[#2F7654]">
              <WalletCards className="h-4 w-4" />
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

const amortizationOptions: { label: string; value: AmortizationType }[] = [
  { label: 'Fija', value: 'SIMPLE' },
  { label: 'Plazo indefinido', value: 'INDEFINITE' },
  { label: 'Sin intereses', value: 'NO_INTEREST' },
];

const freqOptions: { label: string; value: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY' }[] = [
  { label: 'Mensual', value: 'MONTHLY' },
  { label: 'Quincenal', value: 'FORTNIGHTLY' },
  { label: 'Semanal', value: 'WEEKLY' },
];

function getTermUnitForFrequency(frequency: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY'): LoanTermUnit {
  if (frequency === 'WEEKLY') return 'weeks';
  if (frequency === 'FORTNIGHTLY') return 'fortnights';
  return 'months';
}

function MainInfoCard({
  amount,
  onAmountChange,
  customInterestRate,
  onCustomInterestRateChange,
  term,
  onTermChange,
  amortizationType,
  onAmortizationTypeChange,
  paymentFrequency,
  onPaymentFrequencyChange,
  firstPaymentDate,
  onFirstPaymentDateChange,
  customPayment,
  onCustomPaymentChange,
  purpose,
  onPurposeChange,
  errors,
}: {
  amount: string;
  onAmountChange: (v: string) => void;
  customInterestRate: string;
  onCustomInterestRateChange: (v: string) => void;
  term: string;
  onTermChange: (v: string) => void;
  amortizationType: AmortizationType;
  onAmortizationTypeChange: (v: AmortizationType) => void;
  paymentFrequency: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY';
  onPaymentFrequencyChange: (v: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY') => void;
  firstPaymentDate: string;
  onFirstPaymentDateChange: (v: string) => void;
  customPayment: string;
  onCustomPaymentChange: (v: string) => void;
  purpose: string;
  onPurposeChange: (v: string) => void;
  errors?: Record<string, string>;
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <TextInput
              label="Monto a prestar"
              value={formatNumberInput(amount)}
              onChange={(v) => onAmountChange(v.replace(/,/g, ''))}
              prefix="RD$"
              error={errors?.amount}
            />
            <TextInput
              label="Porcentaje de interés"
              value={customInterestRate}
              onChange={onCustomInterestRateChange}
              suffix="%"
              error={errors?.interestRate}
            />
            {amortizationType !== 'INDEFINITE' && (
              <div>
                <span className="mb-1.5 block text-xs font-bold text-[#5C6D63]">Plazo</span>
                <TextInput label="" onChange={onTermChange} value={term} error={errors?.term} />
              </div>
            )}
            <SelectInput
              label="Amortización"
              options={amortizationOptions.map((option) => option.label)}
              value={amortizationOptions.find((option) => option.value === amortizationType)?.label ?? 'Fija'}
              onChange={(value) => onAmortizationTypeChange(amortizationOptions.find((option) => option.label === value)?.value ?? 'SIMPLE')}
              error={errors?.amortizationType}
            />
            <SelectInput
              label="Frecuencia"
              options={freqOptions.map((o) => o.label)}
              value={freqOptions.find((o) => o.value === paymentFrequency)?.label ?? 'Mensual'}
              onChange={(v) => onPaymentFrequencyChange(freqOptions.find((o) => o.label === v)?.value ?? 'MONTHLY')}
              error={errors?.paymentFrequency}
            />
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#5C6D63]">Primera cuota</span>
              <DatePickerInput
                value={firstPaymentDate}
                onChange={onFirstPaymentDateChange}
                invalid={!!errors?.firstPaymentDate}
                className="h-[42px] w-full rounded-[8px] border border-[#DDEBE3] bg-white px-3 text-sm font-medium text-[#173D2C] shadow-[0_2px_6px_rgba(40,92,67,0.05)] outline-none transition focus:border-[#285C43] focus:ring-2 focus:ring-[#EAF6EF]"
              />
              {errors?.firstPaymentDate && <span className="mt-1 block text-xs font-medium text-red-500">{errors.firstPaymentDate}</span>}
            </label>
            <TextInput
              label="Monto de cuota (opcional)"
              value={formatNumberInput(customPayment)}
              onChange={(v) => onCustomPaymentChange(v.replace(/,/g, ''))}
              prefix="RD$"
            />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#5C6D63]">Descripción / propósito</span>
            <textarea
              className="h-[72px] w-full resize-none rounded-[8px] border border-[#DDEBE3] bg-white px-3 py-2.5 text-sm font-medium text-[#173D2C] shadow-[0_2px_6px_rgba(40,92,67,0.05)] outline-none transition placeholder:text-[#8F9691] focus:border-[#285C43] focus:ring-2 focus:ring-[#EAF6EF]"
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

function NewLoanStepTwo({
  amount,
  term,
  onAmountChange,
  onTermChange,
  selectedClient,
  onSelectClient,
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
  selectedPortfolioId,
  onSelectPortfolio,
  saving,
  onSave,
}: {
  amount: string;
  term: string;
  onAmountChange: (value: string) => void;
  onTermChange: (value: string) => void;
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
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
  selectedPortfolioId: string | null;
  onSelectPortfolio: (id: string | null) => void;
  saving: boolean;
  onSave: () => void;
}) {
  const rate = customInterestRate || '0';
  const rawRate = parseStrictNumber(rate) ?? 0;
  const customPaymentVal = parseNumber(customPayment);
  const termUnit = getTermUnitForFrequency(paymentFrequency);

  const [showSchedule, setShowSchedule] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const parsedAmount = parseStrictNumber(amount);
    if (!parsedAmount || parsedAmount <= 0) newErrors.amount = 'Ingresa un monto válido';

    const parsedRate = parseStrictNumber(customInterestRate);
    const parsedCustomPayment = parseStrictNumber(customPayment);
    if ((!parsedRate || parsedRate < 0) && (!parsedCustomPayment || parsedCustomPayment <= 0)) {
      newErrors.interestRate = 'Ingresa un interés o monto de cuota';
    }

    if (amortizationType !== 'INDEFINITE') {
      const parsedTerm = normalizeLoanTerm(term, termUnit);
      if (!parsedTerm || parsedTerm <= 0) newErrors.term = 'Ingresa un plazo válido';
    }

    if (!amortizationType) newErrors.amortizationType = 'Selecciona un tipo de amortización';

    if (!paymentFrequency) newErrors.paymentFrequency = 'Selecciona una frecuencia';

    const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(firstPaymentDate) && !Number.isNaN(new Date(`${firstPaymentDate}T00:00:00Z`).getTime());
    if (!dateValid) newErrors.firstPaymentDate = 'Selecciona una fecha válida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleCalculate() {
    if (validate()) setShowSchedule(true);
    else setShowSchedule(false);
  }

  const { adjustedRate, summary } = useMemo(() => {
    const principal = parseStrictNumber(amount) ?? 0;
    const normalizedTerm = normalizeLoanTerm(term, termUnit);
    const months = normalizedTerm;
    const periodicRate = getPeriodicInterestRate(rawRate, paymentFrequency);

    if (amortizationType === 'NO_INTEREST') {
      const payment = months > 0 ? principal / months : 0;
      return { adjustedRate: 0, summary: { principal, months, payment, total: principal, interest: 0 } };
    }

    if (amortizationType === 'INDEFINITE') {
      const rate = periodicRate / 100;
      const payment = principal * rate;
      return { adjustedRate: periodicRate, summary: { principal, months: 1, payment, total: payment, interest: payment } };
    }

    const fixedInterest = principal * (periodicRate / 100);
    const principalPart = months > 0 ? principal / months : 0;
    const calcPayment = fixedInterest + principalPart;
    const hasCustomPayment = customPaymentVal > 0;

    if (hasCustomPayment) {
      const solvedRate = solveRate(principal, customPaymentVal, months) * 100;
      const adjusted = solvedRate > 0 ? solvedRate : rawRate;
      const payment = customPaymentVal;
      const total = payment * months;
      return {
        adjustedRate: adjusted,
        summary: { principal, months, payment, total, interest: Math.max(0, total - principal) },
      };
    }

    const payment = calcPayment;
    const total = payment * months;
    return {
      adjustedRate: periodicRate,
      summary: { principal, months, payment, total, interest: Math.max(0, total - principal) },
    };
  }, [amount, rawRate, term, termUnit, paymentFrequency, amortizationType, customPaymentVal]);

  const effectiveRate = adjustedRate;

  const scheduleData = useMemo(
    () => computeSchedule(summary.principal, effectiveRate, summary.months, amortizationType, customPayment),
    [summary.principal, effectiveRate, summary.months, amortizationType, customPayment],
  );
  const summaryTotals = getLoanSummaryTotals(summary.principal, scheduleData.totalInterest);
  const calculationReady = canCalculateLoan({
    amount,
    interestRate: customInterestRate,
    term,
    termUnit,
    amortizationType,
    paymentFrequency,
    firstPaymentDate,
    customPayment,
  });

  return (
    <div className="mt-8 space-y-5">
      <ClientSearchCard selectedClient={selectedClient} onSelectClient={onSelectClient} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <MainInfoCard
          amount={amount}
          onAmountChange={onAmountChange}
          customInterestRate={customInterestRate}
          onCustomInterestRateChange={onCustomInterestRateChange}
          term={term}
          onTermChange={onTermChange}
          amortizationType={amortizationType}
          onAmortizationTypeChange={onAmortizationTypeChange}
          paymentFrequency={paymentFrequency}
          onPaymentFrequencyChange={onPaymentFrequencyChange}
          firstPaymentDate={firstPaymentDate}
          onFirstPaymentDateChange={onFirstPaymentDateChange}
          customPayment={customPayment}
          onCustomPaymentChange={onCustomPaymentChange}
          purpose={purpose}
          onPurposeChange={onPurposeChange}
          errors={errors}
        />
        <CarterasCard
          selectedPortfolioId={selectedPortfolioId}
          onSelectPortfolio={onSelectPortfolio}
        />
      </div>

      <button
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2F7654] text-sm font-bold text-white shadow-[0_6px_16px_rgba(47,118,84,0.15)] transition hover:-translate-y-0.5 hover:bg-[#285C43]"
        onClick={handleCalculate}
        type="button"
      >
        <Calculator className="h-4 w-4" />
        {showSchedule ? 'Recalcular préstamo' : 'Calcular préstamo'}
      </button>

      {showSchedule && (
        <AmortizationTableCard
          schedule={scheduleData.schedule}
          totalPayment={scheduleData.totalPayment}
          totalPrincipal={scheduleData.totalPrincipal}
          totalInterest={scheduleData.totalInterest}
          term={summary.months}
          firstPaymentDate={firstPaymentDate}
          paymentFrequency={paymentFrequency}
        />
      )}

      {shouldShowCalculatedLoanActions(showSchedule) && (
        <LoanSummaryPanel
          amount={summary.principal}
          interest={summaryTotals.interest}
          total={summaryTotals.total}
        />
      )}

      {shouldShowCalculatedLoanActions(showSchedule) && (
        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F7654] text-sm font-bold text-white shadow-[0_8px_20px_rgba(47,118,84,0.2)] transition hover:-translate-y-0.5 hover:bg-[#285C43] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          disabled={!calculationReady || !selectedClient || saving}
          onClick={onSave}
          type="button"
        >
          <Check className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar préstamo'}
        </button>
      )}
    </div>
  );
}

function AmortizationRow({
  row,
  total = false,
  totalInstallments,
}: {
  row: { number: number | string; date?: string; payment: number | string; principal: number | string; interest: number | string; balance: number | string };
  total?: boolean;
  totalInstallments: number;
}) {
  const fmt = (v: number | string) => (typeof v === 'number' ? formatCurrency(v) : v);
  const installmentLabel = typeof row.number === 'number' ? `${row.number}/${totalInstallments}` : row.number;

  return (
    <div
      className={`grid min-w-[980px] grid-cols-[90px_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr] items-center border-t border-[#EDF2EF] px-5 py-3 text-sm ${
        total ? 'bg-[#F3FAF6] font-bold' : row.number === 5 ? 'bg-[#F6FAF7]' : 'bg-white'
      }`}
    >
      <span className={total ? 'text-[#5C6D63]' : 'font-medium text-[#5C6D63]'}>{installmentLabel}</span>
      <span className="font-medium text-[#173D2C]">{row.date ?? '—'}</span>
      <span className="text-right font-medium text-[#9F3F25]">{fmt(row.interest)}</span>
      <span className="text-right font-medium text-[#2F7654]">{fmt(row.principal)}</span>
      <span className="text-right font-bold text-[#173D2C]">{fmt(row.payment)}</span>
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
  firstPaymentDate,
  paymentFrequency,
}: {
  schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[];
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  term: number;
  firstPaymentDate: string;
  paymentFrequency: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY';
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <h2 className="text-sm font-bold text-[#173D2C]">Tabla de amortización</h2>
        <p className="text-xs font-medium text-[#5C6D63]">{term} {term === 1 ? 'cuota' : 'cuotas'} en total</p>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[90px_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr] bg-[#F3FAF6] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5C6D63]">
              <span>CUOTA</span>
              <span>FECHA</span>
              <span className="text-right">INTERÉS</span>
              <span className="text-right">CAPITAL</span>
              <span className="text-right">A PAGAR</span>
              <span className="text-right">CAPITAL RESTANTE</span>
            </div>

            <motion.div layout>
              {schedule.map((row) => (
                <AmortizationRow
                  key={row.number}
                  row={{
                    ...row,
                    date: getInstallmentIsoDate(firstPaymentDate, row.number, paymentFrequency),
                  }}
                  totalInstallments={term}
                />
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
              totalInstallments={term}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function Header({ clientId }: { clientId: number | null }) {
  const backHref = clientId ? `/clientes/${clientId}` : '/inicio';
  return (
    <>
      <Link
        className="inline-flex items-center gap-3 text-sm font-bold text-[#5C6D63] transition hover:text-[#173D2C]"
        href={backHref}
      >
        <ArrowLeft className="h-5 w-5" />
        Volver
      </Link>

      <div className="mt-8">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-[#173D2C]">
            Crear préstamo
          </h1>
        </div>
      </div>
    </>
  );
}

export function NewLoanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<LoanProductItem | null>(null);
  const [productsError, setProductsError] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY'>('MONTHLY');
  const [purpose, setPurpose] = useState('');
  const [customInterestRate, setCustomInterestRate] = useState('');
  const [customPayment, setCustomPayment] = useState('');
  const [amortizationType, setAmortizationType] = useState<AmortizationType>('SIMPLE');
  const [firstPaymentDate, setFirstPaymentDate] = useState(getDefaultFirstPaymentDate);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    getLoanProducts()
      .then((data) => {
        if (data.length > 0) setSelectedProduct(data[0]);
      })
      .catch(() => {
        setProductsError(
          'No se pudieron cargar los productos de préstamo. Verifica la conexión con el backend.',
        );
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    const clientId = searchParams.get('cliente');
    if (clientId) {
      getClientBasic(clientId).then((client) => setSelectedClient(client));
    }
  }, [searchParams]);

  function handleAmortizationTypeChange(value: AmortizationType) {
    setAmortizationType(value);
    if (value === 'INDEFINITE' && !firstPaymentDate) {
      setFirstPaymentDate(getDefaultFirstPaymentDate());
    }
  }

  const termUnit = getTermUnitForFrequency(paymentFrequency);

  const calculationReady = canCalculateLoan({
    amount,
    interestRate: customInterestRate,
    term,
    termUnit,
    amortizationType,
    paymentFrequency,
    firstPaymentDate,
    customPayment,
  });

  async function handleCreate() {
    const principal = parseStrictNumber(amount);
    if (!selectedClient || !selectedProduct || !calculationReady || principal === null) return;
    setSaving(true);
    try {
      const totalTerm = amortizationType === 'INDEFINITE' ? 1 : normalizeLoanTerm(term, termUnit);
      await createLoan({
        clientId: selectedClient.id,
        productId: selectedProduct.id,
        principal,
        term: totalTerm,
        startDate: firstPaymentDate || new Date().toISOString(),
        portfolioId: selectedPortfolioId ?? undefined,
        amortizationType: amortizationType === 'INDEFINITE' ? 'INDEFINITE' : undefined,
        notes: purpose || undefined,
      });
      invalidateCachePrefix('loans:');
      invalidateCachePrefix('clients:');
      invalidateCache('dashboard');
      invalidateCache('portfolio');
      invalidateCache('monthlyCollections');
      invalidateCache('weeklyMovement');
      invalidateCache('upcomingPayments');
      router.push(`/clientes/${selectedClient.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] px-5 py-7 font-sans text-[#173D2C] lg:px-9 lg:py-8">
      <div className="mx-auto max-w-[1720px]">
        <Header clientId={selectedClient?.id ?? null} />

        {loadingProducts && (
          <div className="mt-8 space-y-5">
            <div className="h-[72px] animate-pulse rounded-[14px] bg-white/70" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
              <div className="h-[380px] animate-pulse rounded-xl bg-white/70" />
              <div className="h-[200px] animate-pulse rounded-xl bg-white/70" />
            </div>
          </div>
        )}

        {productsError && (
          <p className="mt-6 rounded-[14px] border border-[#F1C9B7] bg-[#FFF4EE] px-4 py-3 text-sm font-medium text-[#9F3F25]">
            {productsError}
          </p>
        )}

        {!loadingProducts && <NewLoanStepTwo
          amount={amount}
          onAmountChange={setAmount}
          onSelectClient={setSelectedClient}
          onTermChange={setTerm}
          selectedClient={selectedClient}
          term={term}
          paymentFrequency={paymentFrequency}
          onPaymentFrequencyChange={setPaymentFrequency}
          purpose={purpose}
          onPurposeChange={setPurpose}
          customInterestRate={customInterestRate}
          onCustomInterestRateChange={setCustomInterestRate}
          customPayment={customPayment}
          onCustomPaymentChange={setCustomPayment}
          amortizationType={amortizationType}
          onAmortizationTypeChange={handleAmortizationTypeChange}
          firstPaymentDate={firstPaymentDate}
          onFirstPaymentDateChange={setFirstPaymentDate}
          selectedPortfolioId={selectedPortfolioId}
          onSelectPortfolio={setSelectedPortfolioId}
          saving={saving}
          onSave={handleCreate}
        />}
      </div>
    </main>
  );
}
