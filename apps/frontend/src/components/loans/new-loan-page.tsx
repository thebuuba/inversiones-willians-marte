'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  AlertCircle,
  Banknote,
  Calculator,
  Check,
  ChevronDown,
  ChevronRight,
  Landmark,
  PlayCircle,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  TrendingUp,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { getLoanProducts, type LoanProductItem } from '@/lib/api/loan-products';
import { createLoan, getPayoffQuote } from '@/lib/api/loans';
import { getClient, getClients, getClientBasic } from '@/lib/api/clients';
import { invalidateCache, invalidateCachePrefix } from '@/lib/use-client-cache';
import { formatDop } from '@/lib/currency';
import {
  canCalculateLoan,
  computeSchedule,
  countRemainingInstallments,
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
import type {
  Client,
  LoanOperationType,
  LoanPayoffQuote,
  LoanReceipt,
  LoanSummary,
} from '@inversiones/shared';
import { LoanDisbursementReceiptModal } from './loan-disbursement-receipt-modal';

const LOAN_CARD_SHADOW = 'shadow-card';

function getDefaultFirstPaymentDate(): string {
  return getNextMonthIsoDate();
}

function formatCurrency(value: number): string {
  return formatDop(value);
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
      {label && <span className="mb-1.5 block text-xs font-bold text-text-secondary">{label}</span>}
      <div
        className={`flex h-[42px] items-center rounded-control-compact border bg-card px-3 text-sm font-medium text-text-primary shadow-soft transition focus-within:ring-2 ${
          error
            ? 'border-state-danger focus-within:border-state-danger focus-within:ring-state-danger-bg'
            : 'border-primary-border focus-within:border-primary focus-within:ring-primary-soft'
        }`}
      >
        {prefix && <span className="mr-2 shrink-0 text-xs text-text-secondary">{prefix}</span>}
        <input
          className="h-full min-w-0 flex-1 bg-transparent outline-none"
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          value={value}
          readOnly={readOnly}
        />
        {suffix && <span className="ml-2 shrink-0 text-xs text-text-secondary">{suffix}</span>}
      </div>
      {error && <span className="mt-1 block text-xs font-medium text-state-danger">{error}</span>}
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
      {label && <span className="mb-1.5 block text-xs font-bold text-text-secondary">{label}</span>}
      <div className="relative">
        <select
          className={`h-[42px] w-full appearance-none rounded-control-compact border bg-card px-3 pr-8 text-sm font-medium text-text-primary shadow-soft outline-none transition focus:ring-2 ${
            error
              ? 'border-state-danger focus:border-state-danger focus:ring-state-danger-bg'
              : 'border-primary-border focus:border-primary focus:ring-primary-soft'
          }`}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-subtle" />
      </div>
      {error && <span className="mt-1 block text-xs font-medium text-state-danger">{error}</span>}
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
      <div className={`rounded-[14px] bg-card ${LOAN_CARD_SHADOW}`}>
        <div className="flex min-h-[72px] items-center gap-3 px-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft shadow-card">
            <UserRound className="h-5 w-5 text-primary-accent" />
          </div>
          <button
            className="min-w-0 flex-1 text-left"
            onClick={() => setChangingClient(true)}
            type="button"
          >
            <p className="truncate text-base font-bold leading-tight text-text-primary">
              {fullName}
            </p>
            <p className="mt-0.5 text-xs font-medium text-text-secondary">
              {selectedClient.identification ?? '—'}
            </p>
          </button>
          <button
            className="shrink-0 rounded-control-compact border border-primary-border px-2.5 py-1 text-xs font-bold text-primary-accent transition hover:bg-primary-soft"
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
    <div className={`rounded-[14px] bg-card ${LOAN_CARD_SHADOW}`}>
      <div className="px-4 py-3">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
          <input
            autoFocus
            className="h-[42px] w-full rounded-control border border-primary-border bg-surface-subtle pl-9 pr-3 text-sm font-medium text-text-primary outline-none transition placeholder:text-text-secondary focus:border-primary focus:bg-card"
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
                className="w-full rounded-control-compact border border-border-soft p-2.5 text-left text-xs transition hover:bg-surface-subtle"
                onClick={() => handleSelect(c)}
                type="button"
              >
                <p className="font-bold text-text-primary">
                  {c.firstName} {c.lastName}
                </p>
                <p className="mt-0.5 text-text-secondary">
                  {c.identification ?? '—'} · {c.phone ?? '—'}
                </p>
              </button>
            ))}
          </div>
        )}
        {query.length >= 2 && results.length === 0 && (
          <p className="text-xs text-text-secondary">Sin resultados</p>
        )}
        {selectedClient && (
          <button
            className="mt-2 text-xs font-bold text-primary-accent transition hover:text-primary"
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

type ReplacementType = Exclude<LoanOperationType, 'NORMAL'>;

function ReplacementOptions({
  selectedClient,
  selectedType,
  selectedCount,
  onApply,
}: {
  selectedClient: Client | null;
  selectedType: ReplacementType | null;
  selectedCount: number;
  onApply: (type: ReplacementType, loanIds: string[], total: number) => void;
}) {
  const [openType, setOpenType] = useState<ReplacementType | null>(null);
  const [loans, setLoans] = useState<LoanSummary[]>([]);
  const [quotes, setQuotes] = useState<Record<string, LoanPayoffQuote>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!openType || !selectedClient) return;
    let active = true;
    const payoffDate = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Santo_Domingo',
    });
    getClient(selectedClient.id)
      .then(async (client) => {
        const activeLoans = client.loans.filter((loan) =>
          ['ACTIVE', 'OVERDUE'].includes(loan.status),
        );
        const loanQuotes = await Promise.all(
          activeLoans.map(
            async (loan) => [loan.id, await getPayoffQuote(loan.id, payoffDate)] as const,
          ),
        );
        if (!active) return;
        setLoans(activeLoans);
        setQuotes(Object.fromEntries(loanQuotes));
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar los préstamos activos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [openType, selectedClient]);

  function close() {
    setOpenType(null);
    setSelectedIds([]);
  }

  function open(type: ReplacementType) {
    setLoans([]);
    setQuotes({});
    setSelectedIds([]);
    setError('');
    setLoading(true);
    setOpenType(type);
  }

  const selectedTotal = selectedIds.reduce((total, id) => total + (quotes[id]?.totalToPay ?? 0), 0);

  const options = [
    {
      type: 'REENGAGEMENT' as const,
      label: 'Realizar reenganche',
      icon: RotateCcw,
      tone: 'bg-primary-soft text-primary-accent',
    },
    {
      type: 'REFINANCE' as const,
      label: 'Refinanciar préstamo',
      icon: RefreshCw,
      tone: 'bg-state-neutral-bg text-text-secondary',
    },
  ];

  return (
    <>
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {options.map((option) => {
          const Icon = option.icon;
          const active = selectedType === option.type || openType === option.type;
          return (
            <button
              key={option.type}
              className={`flex min-h-16 items-center gap-3 rounded-control-comfortable border bg-card px-4 text-left transition hover:-translate-y-0.5 hover:border-primary-border ${LOAN_CARD_SHADOW} ${active ? 'border-primary-accent ring-2 ring-primary-soft' : 'border-primary-border'}`}
              disabled={!selectedClient}
              onClick={() => (openType === option.type ? close() : open(option.type))}
              type="button"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control-comfortable ${option.tone}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1 text-sm font-bold text-text-primary">
                {option.label}
                {active && (
                  <span className="mt-0.5 block text-xs font-medium text-text-secondary">
                    {selectedCount} préstamo(s)
                  </span>
                )}
              </span>
              <ChevronRight
                className={`h-4 w-4 text-text-muted transition ${openType === option.type ? 'rotate-90' : ''}`}
              />
            </button>
          );
        })}
      </section>

      {openType && selectedClient && (
        <section
          aria-live="polite"
          className={`overflow-hidden rounded-[14px] bg-card ${LOAN_CARD_SHADOW}`}
        >
          <header className="flex items-center gap-3 border-b border-primary-border bg-surface-subtle px-5 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-control-comfortable bg-primary-soft text-primary-accent">
              {openType === 'REENGAGEMENT' ? (
                <RotateCcw className="h-5 w-5" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
            </span>
            <h2 className="flex-1 text-base font-bold text-text-primary">
              Seleccionar préstamo(s) para{' '}
              {openType === 'REENGAGEMENT' ? 'reenganche' : 'refinanciamiento'}
            </h2>
            <button
              className="text-xs font-bold text-text-secondary transition hover:text-primary-accent"
              onClick={close}
              type="button"
            >
              Cerrar
            </button>
          </header>

          <div className="space-y-4 p-5">
            {loading ? (
              <p className="py-10 text-center text-sm font-medium text-text-secondary">
                Cargando préstamos activos...
              </p>
            ) : error ? (
              <p className="rounded-control-comfortable bg-state-danger-bg p-4 text-sm font-medium text-state-danger">{error}</p>
            ) : loans.length === 0 ? (
              <p className="rounded-control-comfortable bg-surface-subtle p-5 text-center text-sm font-medium text-text-secondary">
                Este cliente no tiene préstamos activos.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-control-comfortable bg-primary-soft p-4 text-sm font-bold text-primary-accent">
                  <Banknote className="h-5 w-5 text-primary-accent" />
                  Este cliente cuenta con {loans.length} préstamo(s) activo(s)
                </div>
                {loans.map((loan) => {
                  const quote = quotes[loan.id];
                  const checked = selectedIds.includes(loan.id);
                  const remainingInstallments = loan.schedule
                    ? countRemainingInstallments(loan.schedule)
                    : loan.term;
                  return (
                    <label
                      key={loan.id}
                      className={`grid cursor-pointer grid-cols-[auto_repeat(5,minmax(0,1fr))] items-center gap-4 rounded-control-comfortable border p-4 transition ${checked ? 'border-primary-accent bg-surface-subtle ring-2 ring-primary-soft' : 'border-primary-border hover:bg-surface-subtle'}`}
                    >
                      <input
                        checked={checked}
                        className="h-5 w-5 accent-primary-accent"
                        onChange={() =>
                          setSelectedIds((ids) =>
                            checked ? ids.filter((id) => id !== loan.id) : [...ids, loan.id],
                          )
                        }
                        type="checkbox"
                      />
                      <span>
                        <small className="block font-bold uppercase text-text-muted">Préstamo</small>
                        <strong className="text-text-primary">#{loan.loanNumber}</strong>
                      </span>
                      <span>
                        <small className="block font-bold uppercase text-text-muted">Inicio</small>
                        <strong className="text-text-primary">
                          {new Date(loan.startDate).toLocaleDateString('es-DO')}
                        </strong>
                      </span>
                      <span>
                        <small className="block font-bold uppercase text-text-muted">
                          Total a saldar
                        </small>
                        <strong className="text-text-primary">
                          {quote ? formatCurrency(quote.totalToPay) : '...'}
                        </strong>
                      </span>
                      <span>
                        <small className="block font-bold uppercase text-text-muted">
                          Capital restante
                        </small>
                        <strong className="text-text-primary">
                          {quote ? formatCurrency(quote.capitalOutstanding) : '...'}
                        </strong>
                      </span>
                      <span>
                        <small className="block font-bold uppercase text-text-muted">
                          {loan.interestType === 'INDEFINITE' ? 'Modalidad' : 'Cuotas restantes'}
                        </small>
                        <strong className="text-text-primary">
                          {loan.interestType === 'INDEFINITE'
                            ? 'Indefinido'
                            : `${remainingInstallments}/${loan.term}`}
                        </strong>
                      </span>
                    </label>
                  );
                })}
              </>
            )}
          </div>

          <footer className="flex items-center justify-between gap-4 border-t border-primary-border bg-surface-subtle px-5 py-4">
            <p className="text-sm font-bold text-text-primary">
              Total a saldar: {formatCurrency(selectedTotal)}
            </p>
            <button
              className="h-11 rounded-full bg-primary-accent px-5 text-sm font-bold text-white transition hover:bg-primary disabled:opacity-40"
              disabled={selectedIds.length === 0}
              onClick={() => {
                onApply(openType, selectedIds, selectedTotal);
                close();
              }}
              type="button"
            >
              Aplicar {openType === 'REENGAGEMENT' ? 'reenganche' : 'refinanciamiento'}
            </button>
          </footer>
        </section>
      )}
    </>
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
      <span className="absolute -top-3 left-5 z-10 inline-flex items-center gap-1.5 rounded-control-compact bg-primary-soft px-3 py-1 text-xs font-bold text-primary-accent shadow-card">
        <ReceiptText className="h-3 w-3" />
        Resumen del préstamo
      </span>
      <section className={`overflow-hidden rounded-control-comfortable bg-card ${LOAN_CARD_SHADOW}`}>
        <div className="grid grid-cols-1 divide-y divide-primary-border md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="flex min-h-[74px] items-center justify-between gap-3 px-4 py-4">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-text-secondary">
                Capital
              </p>
              <p className="mt-1.5 truncate text-xl font-bold leading-none text-text-primary">
                {formatCurrency(amount)}
              </p>
              <p className="mt-1 text-xs font-medium text-text-secondary">Monto solicitado</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-muted-ui text-text-primary">
              <Landmark className="h-4 w-4" />
            </span>
          </div>
          <div className="flex min-h-[74px] items-center justify-between gap-3 px-4 py-4">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-text-secondary">
                Interés generado
              </p>
              <p className="mt-1.5 truncate text-xl font-bold leading-none text-state-danger">
                {formatCurrency(interest)}
              </p>
              <p className="mt-1 text-xs font-medium text-text-secondary">
                <span className="font-bold text-state-danger">{interestPercent.toFixed(1)}%</span> del
                capital
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-state-danger-bg text-state-danger">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="flex min-h-[74px] items-center justify-between gap-3 px-4 py-4">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-text-secondary">
                Total a pagar
              </p>
              <p className="mt-1.5 truncate text-xl font-bold leading-none text-primary-accent">
                {formatCurrency(total)}
              </p>
              <p className="mt-1 text-xs font-medium text-text-secondary">Capital + intereses</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary-accent">
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

function toApiPaymentFrequency(frequency: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY') {
  return frequency === 'FORTNIGHTLY' ? 'BIWEEKLY' : frequency;
}

function MainInfoCard({
  amount,
  onAmountChange,
  amountReadOnly,
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
  amountReadOnly?: boolean;
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
      <span className="absolute -top-3 left-5 z-10 inline-flex items-center gap-1.5 rounded-control-compact bg-primary-soft px-3 py-1.5 text-sm font-bold text-primary-accent shadow-card">
        Información Principal
      </span>
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-control-comfortable bg-card p-4 pt-6 ${LOAN_CARD_SHADOW} lg:p-5 lg:pt-7`}
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
              readOnly={amountReadOnly}
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
                <span className="mb-1.5 block text-xs font-bold text-text-secondary">Plazo</span>
                <TextInput label="" onChange={onTermChange} value={term} error={errors?.term} />
              </div>
            )}
            <SelectInput
              label="Amortización"
              options={amortizationOptions.map((option) => option.label)}
              value={
                amortizationOptions.find((option) => option.value === amortizationType)?.label ??
                'Fija'
              }
              onChange={(value) =>
                onAmortizationTypeChange(
                  amortizationOptions.find((option) => option.label === value)?.value ?? 'SIMPLE',
                )
              }
              error={errors?.amortizationType}
            />
            <SelectInput
              label="Frecuencia"
              options={freqOptions.map((o) => o.label)}
              value={freqOptions.find((o) => o.value === paymentFrequency)?.label ?? 'Mensual'}
              onChange={(v) =>
                onPaymentFrequencyChange(freqOptions.find((o) => o.label === v)?.value ?? 'MONTHLY')
              }
              error={errors?.paymentFrequency}
            />
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-text-secondary">
                Primera cuota
              </span>
              <DatePickerInput
                value={firstPaymentDate}
                onChange={onFirstPaymentDateChange}
                invalid={!!errors?.firstPaymentDate}
                className="h-[42px] w-full rounded-control-compact border border-primary-border bg-card px-3 text-sm font-medium text-text-primary shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
              {errors?.firstPaymentDate && (
                <span className="mt-1 block text-xs font-medium text-state-danger">
                  {errors.firstPaymentDate}
                </span>
              )}
            </label>
            <TextInput
              label="Monto de cuota (opcional)"
              value={formatNumberInput(customPayment)}
              onChange={(v) => onCustomPaymentChange(v.replace(/,/g, ''))}
              prefix="RD$"
            />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-text-secondary">
              Descripción / propósito
            </span>
            <textarea
              className="h-[72px] w-full resize-none rounded-control-compact border border-primary-border bg-card px-3 py-2.5 text-sm font-medium text-text-primary shadow-soft outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary-soft"
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
  historicalLoan,
  onHistoricalLoanChange,
  loanStartDate,
  onLoanStartDateChange,
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
  operationType,
  sourceLoanIds,
  settlementTotal,
  onApplyReplacement,
  paidInstallments,
  onPaidInstallmentsChange,
  paidLateFee,
  onPaidLateFeeChange,
  lateFeeEnabled,
  onLateFeeEnabledChange,
  lateFeeMode,
  onLateFeeModeChange,
  lateFeeCalculation,
  onLateFeeCalculationChange,
  lateFeeValue,
  onLateFeeValueChange,
  lateFeeGraceDays,
  onLateFeeGraceDaysChange,
  generateReceipt,
  onGenerateReceiptChange,
}: {
  historicalLoan: boolean;
  onHistoricalLoanChange: (value: boolean) => void;
  loanStartDate: string;
  onLoanStartDateChange: (value: string) => void;
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
  operationType: ReplacementType | null;
  sourceLoanIds: string[];
  settlementTotal: number;
  onApplyReplacement: (type: ReplacementType, loanIds: string[], total: number) => void;
  paidInstallments: string;
  onPaidInstallmentsChange: (value: string) => void;
  paidLateFee: string;
  onPaidLateFeeChange: (value: string) => void;
  lateFeeEnabled: boolean;
  onLateFeeEnabledChange: (value: boolean) => void;
  lateFeeMode: 'PER_INSTALLMENT' | 'DAILY';
  onLateFeeModeChange: (value: 'PER_INSTALLMENT' | 'DAILY') => void;
  lateFeeCalculation: 'PERCENTAGE' | 'AMOUNT';
  onLateFeeCalculationChange: (value: 'PERCENTAGE' | 'AMOUNT') => void;
  lateFeeValue: string;
  onLateFeeValueChange: (value: string) => void;
  lateFeeGraceDays: string;
  onLateFeeGraceDaysChange: (value: string) => void;
  generateReceipt: boolean;
  onGenerateReceiptChange: (value: boolean) => void;
}) {
  const rate = customInterestRate || '0';
  const rawRate = parseStrictNumber(rate) ?? 0;
  const customPaymentVal = parseNumber(customPayment);
  const termUnit = getTermUnitForFrequency(paymentFrequency);

  const [showSchedule, setShowSchedule] = useState(false);
  const [openLateFee, setOpenLateFee] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const parsedAmount = parseStrictNumber(amount);
    if (!parsedAmount || parsedAmount <= 0) newErrors.amount = 'Ingresa un monto válido';
    if (operationType === 'REENGAGEMENT' && (parsedAmount ?? 0) <= settlementTotal) {
      newErrors.amount = 'El monto debe superar las deudas a saldar';
    }

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

    const dateValid =
      /^\d{4}-\d{2}-\d{2}$/.test(firstPaymentDate) &&
      !Number.isNaN(new Date(`${firstPaymentDate}T00:00:00Z`).getTime());
    if (!dateValid) newErrors.firstPaymentDate = 'Selecciona una fecha válida';
    if (
      historicalLoan &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(loanStartDate) ||
        Number.isNaN(new Date(`${loanStartDate}T00:00:00Z`).getTime()))
    ) {
      newErrors.loanStartDate = 'Selecciona una fecha válida';
    } else if (historicalLoan && loanStartDate > firstPaymentDate) {
      newErrors.loanStartDate = 'La entrega debe ser anterior a la primera cuota';
    }
    const paidCount = Number(paidInstallments || 0);
    if (!Number.isInteger(paidCount) || paidCount < 0 || paidCount > summary.months) {
      newErrors.paidInstallments = `Debe ser un número entre 0 y ${summary.months}`;
    }
    if (parseNumber(paidLateFee) > 0 && paidCount === 0) {
      newErrors.paidInstallments = 'Indica al menos una cuota cobrada';
    }

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
      return {
        adjustedRate: 0,
        summary: { principal, months, payment, total: principal, interest: 0 },
      };
    }

    if (amortizationType === 'INDEFINITE') {
      const rate = periodicRate / 100;
      const payment = principal * rate;
      return {
        adjustedRate: periodicRate,
        summary: { principal, months: 1, payment, total: payment, interest: payment },
      };
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
    () =>
      computeSchedule(
        summary.principal,
        effectiveRate,
        summary.months,
        amortizationType,
        customPayment,
      ),
    [summary.principal, effectiveRate, summary.months, amortizationType, customPayment],
  );
  const summaryTotals = getLoanSummaryTotals(summary.principal, scheduleData.totalInterest);
  const paidCount = Number(paidInstallments || 0);
  const paidRows = Number.isInteger(paidCount) ? scheduleData.schedule.slice(0, paidCount) : [];
  const paidPrincipal = paidRows.reduce((sum, row) => sum + row.principal, 0);
  const paidInterest = paidRows.reduce((sum, row) => sum + row.interest, 0);
  const historicalDataValid =
    (!historicalLoan || Number.isInteger(paidCount)) &&
    paidCount >= 0 &&
    paidCount <= summary.months &&
    (parseNumber(paidLateFee) === 0 || paidCount > 0);
  const lateFeeDataValid =
    !lateFeeEnabled ||
    (parseStrictNumber(lateFeeValue) !== null &&
      parseNumber(lateFeeValue) >= 0 &&
      Number.isInteger(Number(lateFeeGraceDays)) &&
      Number(lateFeeGraceDays) >= 0);
  const calculationReady =
    canCalculateLoan({
      amount,
      interestRate: customInterestRate,
      term,
      termUnit,
      amortizationType,
      paymentFrequency,
      firstPaymentDate,
      customPayment,
    }) &&
    (operationType !== 'REENGAGEMENT' || parseNumber(amount) > settlementTotal) &&
    historicalDataValid &&
    lateFeeDataValid;

  return (
    <div className="mt-8 space-y-5">
      <ClientSearchCard selectedClient={selectedClient} onSelectClient={onSelectClient} />
      <ReplacementOptions
        onApply={onApplyReplacement}
        selectedClient={selectedClient}
        selectedCount={sourceLoanIds.length}
        selectedType={operationType}
      />
      {operationType && (
        <div className="grid grid-cols-1 gap-3 rounded-control-comfortable border border-primary-border bg-card p-4 text-sm md:grid-cols-3">
          <p>
            <span className="block text-xs font-bold uppercase text-text-secondary">Operación</span>
            <strong>{operationType === 'REENGAGEMENT' ? 'Reenganche' : 'Refinanciamiento'}</strong>
          </p>
          <p>
            <span className="block text-xs font-bold uppercase text-text-secondary">
              Deudas a saldar
            </span>
            <strong>{formatCurrency(settlementTotal)}</strong>
          </p>
          <p>
            <span className="block text-xs font-bold uppercase text-text-secondary">
              Efectivo a entregar
            </span>
            <strong className="text-primary-accent">
              {formatCurrency(Math.max(0, parseNumber(amount) - settlementTotal))}
            </strong>
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <MainInfoCard
          amount={amount}
          amountReadOnly={operationType === 'REFINANCE'}
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

      <div className="space-y-3">
        <section className={`overflow-hidden rounded-control-comfortable bg-card ${LOAN_CARD_SHADOW}`}>
          <label className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary-accent">
              <PlayCircle className="h-4.5 w-4.5" />
            </span>
            <span className="flex-1">
              <strong className="block text-sm font-bold text-text-primary">Fecha de entrega</strong>
              <small className="mt-0.5 block text-xs font-medium text-text-secondary">
                Activa esta opción si el préstamo fue entregado anteriormente
              </small>
            </span>
            <input
              checked={historicalLoan}
              className="h-5 w-5 accent-primary-accent"
              onChange={(event) => onHistoricalLoanChange(event.target.checked)}
              type="checkbox"
            />
          </label>
          {historicalLoan && (
            <div className="grid gap-3 border-t border-primary-border bg-surface-subtle p-4 md:grid-cols-5">
              <label>
                <span className="mb-1.5 block text-xs font-bold text-text-secondary">
                  Fecha de entrega
                </span>
                <DatePickerInput
                  value={loanStartDate}
                  onChange={onLoanStartDateChange}
                  invalid={!!errors.loanStartDate}
                  className="h-[42px] w-full rounded-control-compact border border-primary-border bg-card px-3 text-sm font-medium text-text-primary shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />
                {errors.loanStartDate && (
                  <span className="mt-1 block text-xs font-medium text-state-danger">
                    {errors.loanStartDate}
                  </span>
                )}
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-text-secondary">
                  Cuotas cobradas
                </span>
                <input
                  className="h-[42px] w-full rounded-control-compact border border-primary-border bg-card px-3 text-sm font-medium text-text-primary shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                  min="0"
                  max={summary.months}
                  step="1"
                  type="number"
                  value={paidInstallments}
                  onChange={(event) => onPaidInstallmentsChange(event.target.value)}
                />
                {errors.paidInstallments && (
                  <span className="mt-1 block text-xs font-medium text-state-danger">
                    {errors.paidInstallments}
                  </span>
                )}
              </label>
              <TextInput
                label="Capital pagado"
                prefix="RD$"
                readOnly
                value={formatNumberInput(String(Math.round(paidPrincipal)))}
              />
              <TextInput
                label="Interés pagado"
                prefix="RD$"
                readOnly
                value={formatNumberInput(String(Math.round(paidInterest)))}
              />
              <TextInput
                label="Mora pagada"
                prefix="RD$"
                value={formatNumberInput(paidLateFee)}
                onChange={(value) => onPaidLateFeeChange(value.replace(/,/g, ''))}
              />
            </div>
          )}
        </section>

        <section className={`overflow-hidden rounded-control-comfortable bg-card ${LOAN_CARD_SHADOW}`}>
          <button
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-subtle"
            onClick={() => setOpenLateFee((open) => !open)}
            type="button"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-state-danger-bg text-state-danger">
              <AlertCircle className="h-4.5 w-4.5" />
            </span>
            <span className="flex-1">
              <strong className="block text-sm font-bold text-text-primary">Mora</strong>
              <small className="mt-0.5 block text-xs font-medium text-text-secondary">
                Configuración de la mora del préstamo
              </small>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-text-secondary transition ${openLateFee ? 'rotate-180' : ''}`}
            />
          </button>
          {openLateFee && (
            <div className="space-y-4 border-t border-primary-border bg-surface-subtle p-4">
              <label className="flex items-center justify-between gap-4 rounded-control-comfortable bg-card px-4 py-3 shadow-soft">
                <span>
                  <strong className="block text-sm text-text-primary">Aplicar mora</strong>
                  <small className="text-xs font-medium text-text-secondary">
                    Puedes cambiar esta configuración luego
                  </small>
                </span>
                <input
                  checked={lateFeeEnabled}
                  className="h-5 w-5 accent-primary-accent"
                  onChange={(event) => onLateFeeEnabledChange(event.target.checked)}
                  type="checkbox"
                />
              </label>
              {lateFeeEnabled && (
                <div className="grid gap-3 md:grid-cols-4">
                  <SelectInput
                    label="Modalidad"
                    options={['Por cuota', 'Diaria']}
                    value={lateFeeMode === 'PER_INSTALLMENT' ? 'Por cuota' : 'Diaria'}
                    onChange={(value) =>
                      onLateFeeModeChange(value === 'Diaria' ? 'DAILY' : 'PER_INSTALLMENT')
                    }
                  />
                  <SelectInput
                    label="Tipo de cálculo"
                    options={['Porcentaje', 'Monto fijo']}
                    value={lateFeeCalculation === 'PERCENTAGE' ? 'Porcentaje' : 'Monto fijo'}
                    onChange={(value) =>
                      onLateFeeCalculationChange(value === 'Monto fijo' ? 'AMOUNT' : 'PERCENTAGE')
                    }
                  />
                  <TextInput
                    label={
                      lateFeeCalculation === 'PERCENTAGE' ? 'Porcentaje de mora' : 'Monto de mora'
                    }
                    onChange={onLateFeeValueChange}
                    suffix={lateFeeCalculation === 'PERCENTAGE' ? '%' : undefined}
                    prefix={lateFeeCalculation === 'AMOUNT' ? 'RD$' : undefined}
                    value={lateFeeValue}
                  />
                  <TextInput
                    label="Aplicar luego de"
                    onChange={(value) => onLateFeeGraceDaysChange(value.replace(/\D/g, ''))}
                    suffix="días"
                    value={lateFeeGraceDays}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <button
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-control-comfortable bg-primary-accent text-sm font-bold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-primary"
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
          paidInstallments={paidCount}
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
        <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-control-comfortable border border-primary-border bg-primary-soft px-4 py-3">
          <input
            checked={generateReceipt}
            className="h-5 w-5 accent-primary"
            onChange={(event) => onGenerateReceiptChange(event.target.checked)}
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-bold text-text-primary">Generar recibo</span>
            <span className="block text-xs font-medium text-text-secondary">
              Abre el recibo autocopiante al guardar el préstamo.
            </span>
          </span>
        </label>
      )}

      {shouldShowCalculatedLoanActions(showSchedule) && (
        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-control-comfortable bg-primary-accent text-sm font-bold text-white shadow-action transition hover:-translate-y-0.5 hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
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
  paid = false,
  totalInstallments,
}: {
  row: {
    number: number | string;
    date?: string;
    payment: number | string;
    principal: number | string;
    interest: number | string;
    balance: number | string;
  };
  total?: boolean;
  paid?: boolean;
  totalInstallments: number;
}) {
  const fmt = (v: number | string) => (typeof v === 'number' ? formatCurrency(v) : v);
  const installmentLabel =
    typeof row.number === 'number' ? `${row.number}/${totalInstallments}` : row.number;

  return (
    <div
      className={`grid min-w-[980px] grid-cols-[90px_1.1fr_1.2fr_1.2fr_1.2fr_1.3fr] items-center border-t px-5 py-2.5 text-sm ${
        total ? 'bg-surface-subtle font-bold' : paid ? 'bg-primary-soft' : 'bg-card'
      } ${total ? 'border-primary-border' : 'border-primary-border'}`}
    >
      <span
        className={
          total
            ? 'text-text-primary'
            : paid
              ? 'font-bold text-primary-accent'
              : 'font-medium text-text-primary'
        }
      >
        {installmentLabel}
      </span>
      <span className={total ? 'font-medium text-text-muted' : 'font-medium text-text-primary'}>
        {row.date ?? '—'}
      </span>
      <span className="text-right font-medium text-state-danger">{fmt(row.interest)}</span>
      <span className="text-right font-medium text-primary-accent">{fmt(row.principal)}</span>
      <span className="text-right font-bold text-text-primary">{fmt(row.payment)}</span>
      <span className={`text-right font-medium ${total ? 'text-text-muted' : 'text-text-primary'}`}>
        {fmt(row.balance)}
      </span>
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
  paidInstallments,
}: {
  schedule: {
    number: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }[];
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  term: number;
  firstPaymentDate: string;
  paymentFrequency: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY';
  paidInstallments: number;
}) {
  return (
    <div className="relative">
      <span className="absolute -top-3 left-5 z-10 inline-flex items-center gap-1.5 rounded-control-compact bg-primary-soft px-3 py-1 text-xs font-bold text-primary-accent shadow-card">
        <ReceiptText className="h-3 w-3" />
        Tabla de amortización
      </span>
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className={`overflow-hidden rounded-control-comfortable bg-card ${LOAN_CARD_SHADOW}`}
        initial={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      >
        <div className="flex items-center justify-end gap-4 px-5 py-4">
          <p className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary-accent">
            {term} {term === 1 ? 'cuota' : 'cuotas'}
          </p>
        </div>

        <div className="max-h-[360px] overflow-y-auto border-t border-primary-border">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[90px_1.1fr_1.2fr_1.2fr_1.2fr_1.3fr] bg-surface-muted-ui px-5 py-3 text-xs font-bold uppercase tracking-[0.11em] text-primary-accent">
                <span>CUOTA</span>
                <span>FECHA</span>
                <span className="text-right">INTERÉS</span>
                <span className="text-right">CAPITAL</span>
                <span className="text-right">A PAGAR</span>
                <span className="text-right">CAPITAL RESTANTE</span>
              </div>

              <motion.div layout>
                {schedule.map((row, index) => (
                  <AmortizationRow
                    key={row.number}
                    row={{
                      ...row,
                      date: getInstallmentIsoDate(firstPaymentDate, row.number, paymentFrequency),
                    }}
                    paid={index < paidInstallments}
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
    </div>
  );
}

function Header({ clientId }: { clientId: number | null }) {
  const backHref = clientId ? `/clientes/${clientId}` : '/inicio';
  return (
    <>
      <Link
        className="inline-flex items-center gap-3 text-sm font-bold text-text-secondary transition hover:text-text-primary"
        href={backHref}
      >
        <ArrowLeft className="h-5 w-5" />
        Volver
      </Link>

      <div className="mt-8">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-text-primary">Crear préstamo</h1>
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
  const [paymentFrequency, setPaymentFrequency] = useState<'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY'>(
    'MONTHLY',
  );
  const [purpose, setPurpose] = useState('');
  const [customInterestRate, setCustomInterestRate] = useState('');
  const [customPayment, setCustomPayment] = useState('');
  const [amortizationType, setAmortizationType] = useState<AmortizationType>('SIMPLE');
  const [firstPaymentDate, setFirstPaymentDate] = useState(getDefaultFirstPaymentDate);
  const [historicalLoan, setHistoricalLoan] = useState(false);
  const [loanStartDate, setLoanStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [generateReceipt, setGenerateReceipt] = useState(true);
  const [createdReceipt, setCreatedReceipt] = useState<LoanReceipt | null>(null);
  const [receiptClientId, setReceiptClientId] = useState<number | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [operationType, setOperationType] = useState<ReplacementType | null>(null);
  const [sourceLoanIds, setSourceLoanIds] = useState<string[]>([]);
  const [settlementTotal, setSettlementTotal] = useState(0);
  const [paidInstallments, setPaidInstallments] = useState('0');
  const [paidLateFee, setPaidLateFee] = useState('0');
  const [lateFeeEnabled, setLateFeeEnabled] = useState(true);
  const [lateFeeMode, setLateFeeMode] = useState<'PER_INSTALLMENT' | 'DAILY'>('PER_INSTALLMENT');
  const [lateFeeCalculation, setLateFeeCalculation] = useState<'PERCENTAGE' | 'AMOUNT'>(
    'PERCENTAGE',
  );
  const [lateFeeValue, setLateFeeValue] = useState('5');
  const [lateFeeGraceDays, setLateFeeGraceDays] = useState('5');

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

  function handleHistoricalLoanChange(value: boolean) {
    setHistoricalLoan(value);
    if (!value) {
      setPaidInstallments('0');
      setPaidLateFee('0');
      setLoanStartDate(new Date().toISOString().slice(0, 10));
    }
  }

  function handleSelectClient(client: Client) {
    setSelectedClient(client);
    if (operationType) setAmount('');
    setOperationType(null);
    setSourceLoanIds([]);
    setSettlementTotal(0);
  }

  function handleApplyReplacement(type: ReplacementType, loanIds: string[], total: number) {
    setOperationType(type);
    setSourceLoanIds(loanIds);
    setSettlementTotal(total);
    if (type === 'REFINANCE') setAmount(String(total));
    else if (parseNumber(amount) <= total) setAmount('');
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
    const interestRate = parseStrictNumber(customInterestRate);
    const payment = parseStrictNumber(customPayment);
    setSaving(true);
    setSaveError('');
    try {
      const totalTerm = amortizationType === 'INDEFINITE' ? 1 : normalizeLoanTerm(term, termUnit);
      const created = await createLoan({
        clientId: selectedClient.id,
        productId: selectedProduct.id,
        principal,
        interestRate: amortizationType === 'NO_INTEREST' ? 0 : (interestRate ?? undefined),
        term: totalTerm,
        startDate: historicalLoan ? loanStartDate : new Date().toISOString().slice(0, 10),
        firstPaymentDate,
        portfolioId: selectedPortfolioId ?? undefined,
        amortizationType:
          amortizationType === 'SIMPLE'
            ? 'FIXED'
            : amortizationType === 'INDEFINITE'
              ? 'INDEFINITE'
              : 'REDUCING',
        paymentFrequency: toApiPaymentFrequency(paymentFrequency),
        customPayment: payment && payment > 0 ? payment : undefined,
        notes: purpose || undefined,
        operationType: operationType ?? undefined,
        sourceLoanIds: sourceLoanIds.length ? sourceLoanIds : undefined,
        paidInstallments: historicalLoan ? Number(paidInstallments || 0) : 0,
        paidLateFee: historicalLoan ? parseNumber(paidLateFee) : 0,
        lateFeeEnabled,
        lateFeeMode,
        lateFeeCalculation,
        lateFeeValue: parseNumber(lateFeeValue),
        lateFeeGraceDays: Number(lateFeeGraceDays),
        generateReceipt,
      });
      invalidateCachePrefix('loans:');
      invalidateCachePrefix('clients:');
      invalidateCache('dashboard');
      invalidateCache('portfolio');
      invalidateCache('monthlyCollections');
      invalidateCache('weeklyMovement');
      invalidateCache('upcomingPayments');
      if (created.receipt) {
        setReceiptClientId(selectedClient.id);
        setCreatedReceipt(created.receipt);
      } else {
        router.push(`/clientes/${selectedClient.id}?_=${Date.now()}`);
      }
    } catch {
      setSaveError('No se pudo guardar la operación. Actualiza los saldos e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-page px-5 py-7 font-sans text-text-primary lg:px-9 lg:py-8">
      <div className="mx-auto max-w-[1720px]">
        <Header clientId={selectedClient?.id ?? null} />

        {loadingProducts && (
          <div className="mt-8 space-y-5">
            <div
              className={`h-[72px] animate-pulse rounded-[14px] bg-card/70 ${LOAN_CARD_SHADOW}`}
            />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
              <div
                className={`h-[380px] animate-pulse rounded-control-comfortable bg-card/70 ${LOAN_CARD_SHADOW}`}
              />
              <div
                className={`h-[200px] animate-pulse rounded-control-comfortable bg-card/70 ${LOAN_CARD_SHADOW}`}
              />
            </div>
          </div>
        )}

        {productsError && (
          <p className="mt-6 rounded-control-comfortable border border-state-danger-bg bg-state-danger-bg px-4 py-3 text-sm font-medium text-state-danger">
            {productsError}
          </p>
        )}

        {saveError && (
          <p className="mt-6 rounded-control-comfortable border border-state-danger-bg bg-state-danger-bg px-4 py-3 text-sm font-medium text-state-danger">
            {saveError}
          </p>
        )}

        {!loadingProducts && (
          <NewLoanStepTwo
            historicalLoan={historicalLoan}
            onHistoricalLoanChange={handleHistoricalLoanChange}
            loanStartDate={loanStartDate}
            onLoanStartDateChange={setLoanStartDate}
            amount={amount}
            onAmountChange={setAmount}
            onSelectClient={handleSelectClient}
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
            operationType={operationType}
            sourceLoanIds={sourceLoanIds}
            settlementTotal={settlementTotal}
            onApplyReplacement={handleApplyReplacement}
            paidInstallments={paidInstallments}
            onPaidInstallmentsChange={setPaidInstallments}
            paidLateFee={paidLateFee}
            onPaidLateFeeChange={setPaidLateFee}
            lateFeeEnabled={lateFeeEnabled}
            onLateFeeEnabledChange={setLateFeeEnabled}
            lateFeeMode={lateFeeMode}
            onLateFeeModeChange={setLateFeeMode}
            lateFeeCalculation={lateFeeCalculation}
            onLateFeeCalculationChange={setLateFeeCalculation}
            lateFeeValue={lateFeeValue}
            onLateFeeValueChange={setLateFeeValue}
            lateFeeGraceDays={lateFeeGraceDays}
            onLateFeeGraceDaysChange={setLateFeeGraceDays}
            generateReceipt={generateReceipt}
            onGenerateReceiptChange={setGenerateReceipt}
          />
        )}
        {createdReceipt && (
          <LoanDisbursementReceiptModal
            onClose={() => {
              setCreatedReceipt(null);
              if (receiptClientId) router.push(`/clientes/${receiptClientId}?_=${Date.now()}`);
            }}
            receipt={createdReceipt}
          />
        )}
      </div>
    </main>
  );
}
