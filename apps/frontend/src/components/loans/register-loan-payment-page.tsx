'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  HandCoins,
  Handshake,
  Landmark,
  ListChecks,
  ReceiptText,
  Search,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { createPayment, type Payment } from '@/lib/api/payments';
import {
  getLoan,
  getLoans,
  getPayoffQuote,
  type LoanDetail,
  type LoanListItem,
} from '@/lib/api/loans';
import { formatDop, parseCurrencyInput } from '@/lib/currency';
import { getLoanTypeLabel } from '@/lib/loan-type';
import { invalidateCache, invalidateCachePrefix } from '@/lib/use-client-cache';
import {
  buildPaymentAllocationPreview,
  getAmountToBringCurrent,
  getLoanPaymentSummary,
  getNextScheduledAmount,
  getOutstandingScheduledAmount,
} from './loan-payment.helpers';

const paymentMethods = [
  { label: 'Efectivo', icon: Banknote },
  { label: 'Transferencia', icon: Landmark },
  { label: 'Tarjeta', icon: CreditCard },
] as const;

const today = () => new Date().toISOString().slice(0, 10);
const frequencyLabels: Record<string, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
};
const fmt = (value: number | string) => formatDop(value, { decimals: 2, space: true });
const fmtDate = (value: string | Date) =>
  (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? new Date(
        Number(value.slice(0, 4)),
        Number(value.slice(5, 7)) - 1,
        Number(value.slice(8, 10)),
        12,
      )
    : new Date(value)
  ).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

function getApiErrorMessage(error: unknown): string {
  const data = (error as { response?: { data?: { message?: unknown; error?: unknown } } }).response
    ?.data;
  const message = data?.message ?? data?.error;
  if (Array.isArray(message)) return message.map(String).join(', ');
  return typeof message === 'string'
    ? message
    : 'No se pudo registrar el cobro. Revisa los datos e inténtalo nuevamente.';
}

function getLoanStatusLabel(status: string) {
  if (status === 'ACTIVE') return 'Activo';
  if (status === 'OVERDUE') return 'Atrasado';
  if (status === 'PAID') return 'Pagado';
  return 'Pendiente';
}

function LoanSearchResult({ loan, onSelect }: { loan: LoanListItem; onSelect: () => void }) {
  return (
    <button
      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-border-soft px-4 py-3.5 text-left transition first:border-t-0 hover:bg-[#F6FAF7]"
      onClick={onSelect}
      type="button"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-accent">
          <UserRound className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text-primary">
            {loan.client.firstName} {loan.client.lastName}
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-[#7A7F7D]">
            Préstamo #{loan.loanNumber} · {loan.client.identification ?? 'Sin identificación'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold tabular-nums text-text-primary">{fmt(loan.balance)}</p>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-text-secondary">
            {getLoanStatusLabel(loan.status)}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-[#9AA69F]" />
      </div>
    </button>
  );
}

function Metric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  const valueTone =
    tone === 'green'
      ? 'text-primary-accent'
      : tone === 'orange'
        ? 'text-[#B64A24]'
        : 'text-text-primary';
  return (
    <div className="border-l border-[#E4ECE7] px-4 first:border-l-0 first:pl-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7A7F7D]">{label}</p>
      <p className={`mt-1.5 text-base font-bold tabular-nums ${valueTone}`}>{value}</p>
    </div>
  );
}

function FinancialDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-soft py-2.5 last:border-b-0">
      <dt className="text-xs font-medium text-[#7A7F7D]">{label}</dt>
      <dd className="text-right text-xs font-bold tabular-nums text-[#1F2A24]">{value}</dd>
    </div>
  );
}

export function RegisterLoanPaymentPage() {
  const searchParams = useSearchParams();
  const initialLoanId = searchParams.get('loanId');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LoanListItem[]>([]);
  const [searching, setSearching] = useState(true);
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loadingLoan, setLoadingLoan] = useState(Boolean(initialLoanId));
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPayment, setCreatedPayment] = useState<Payment | null>(null);
  const [payoffQuote, setPayoffQuote] = useState<Awaited<ReturnType<typeof getPayoffQuote>> | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    const timer = setTimeout(
      () => {
        setSearching(true);
        getLoans(undefined, query.trim() || undefined, 12, 0, 'recent')
          .then((response) => {
            if (active) setResults(response.data.filter((item) => item.status !== 'PAID'));
          })
          .catch(() => {
            if (active) setResults([]);
          })
          .finally(() => {
            if (active) setSearching(false);
          });
      },
      query ? 250 : 0,
    );

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!initialLoanId) return;
    let active = true;
    getLoan(initialLoanId)
      .then((selected) => {
        if (!active) return;
        setLoan(selected);
        setAmount(
          String(getAmountToBringCurrent(selected.schedule, today(), selected.lateFees ?? [])),
        );
      })
      .catch(() => {
        if (active) setError('No se pudo cargar el préstamo seleccionado.');
      })
      .finally(() => {
        if (active) setLoadingLoan(false);
      });
    return () => {
      active = false;
    };
  }, [initialLoanId]);

  useEffect(() => {
    if (!loan || !paymentDate) return;
    let active = true;
    getPayoffQuote(loan.id, paymentDate)
      .then((quote) => {
        if (active) setPayoffQuote(quote);
      })
      .catch(() => {
        if (active) setPayoffQuote(null);
      });
    return () => {
      active = false;
    };
  }, [loan, paymentDate]);

  async function selectLoan(id: string) {
    setLoadingLoan(true);
    setError(null);
    setCreatedPayment(null);
    try {
      const selected = await getLoan(id);
      setLoan(selected);
      setAmount(
        String(getAmountToBringCurrent(selected.schedule, today(), selected.lateFees ?? [])),
      );
      setSubmitted(false);
    } catch {
      setError('No se pudo cargar el préstamo seleccionado.');
    } finally {
      setLoadingLoan(false);
    }
  }

  const amountNumber = parseCurrencyInput(amount);
  const nextScheduled = loan ? getNextScheduledAmount(loan.schedule) : 0;
  const amountToBringCurrent = loan
    ? getAmountToBringCurrent(loan.schedule, paymentDate || today(), loan.lateFees ?? [])
    : 0;
  const totalOutstanding = loan
    ? getOutstandingScheduledAmount(loan.schedule, loan.lateFees ?? [])
    : 0;
  const allocationPreview = useMemo(
    () => (loan ? buildPaymentAllocationPreview(loan.schedule, loan.payments, amountNumber) : []),
    [amountNumber, loan],
  );
  const previewInterest = allocationPreview.reduce((sum, row) => sum + row.interest, 0);
  const previewPrincipal = allocationPreview.reduce((sum, row) => sum + row.principal, 0);
  const invalidAmount = submitted && amountNumber <= 0;
  const exceedsOutstanding = amountNumber > totalOutstanding && totalOutstanding > 0;
  const hasNoOutstanding = totalOutstanding <= 0;
  const loanSummary = useMemo(
    () =>
      loan
        ? getLoanPaymentSummary(
            loan.schedule,
            loan.payments,
            loan.lateFees ?? [],
            loan.principal,
            loan.balance,
            paymentDate || today(),
          )
        : null,
    [loan, paymentDate],
  );
  const nextSchedule = loan?.schedule.find((row) => row.status !== 'PAID');
  const lastPayment = loan?.payments[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError(null);
    if (!loan || amountNumber <= 0 || !paymentDate || exceedsOutstanding || hasNoOutstanding)
      return;

    setSaving(true);
    try {
      const payment = await createPayment({
        loanId: loan.id,
        clientId: loan.clientId,
        amount: amountNumber,
        paymentDate,
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      invalidateCachePrefix('loans:');
      invalidateCachePrefix('clients:');
      invalidateCache('dashboard');
      invalidateCache('portfolio');
      invalidateCache('monthlyCollections');
      invalidateCache('upcomingPayments');
      const refreshed = await getLoan(loan.id);
      setLoan(refreshed);
      setAmount(
        String(getAmountToBringCurrent(refreshed.schedule, today(), refreshed.lateFees ?? [])),
      );
      setReference('');
      setNotes('');
      setSubmitted(false);
      setCreatedPayment(payment);
    } catch (paymentError) {
      setError(getApiErrorMessage(paymentError));
    } finally {
      setSaving(false);
    }
  }

  const latestPayments = loan?.payments.slice(0, 5) ?? [];
  const inputClass =
    'h-11 w-full rounded-xl border border-primary-border bg-white px-3.5 text-sm font-semibold text-text-primary outline-none transition focus:border-primary-accent focus:ring-2 focus:ring-primary-soft';

  return (
    <main className="min-h-screen bg-page p-4 font-sans text-text-primary sm:p-5">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <Link
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-primary-accent"
              href={loan ? `/prestamos/${loan.id}` : '/prestamos'}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a préstamos
            </Link>
            <h1 className="text-2xl font-bold text-text-primary">Cobrar préstamo</h1>
            <p className="mt-1 text-sm font-medium text-[#7A7F7D]">
              Selecciona una deuda, confirma la aplicación y registra el pago.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary-border bg-white px-3 py-2 text-xs font-bold text-text-secondary shadow-sm sm:self-auto">
            <Clock3 className="h-3.5 w-3.5 text-primary-accent" />
            {fmtDate(new Date())}
          </div>
        </header>

        <div className={`grid gap-4 ${initialLoanId ? '' : 'xl:grid-cols-[370px_minmax(0,1fr)]'}`}>
          {!initialLoanId ? (
            <aside className="overflow-hidden rounded-2xl border border-[#E2E9E5] bg-white shadow-sm">
              <div className="border-b border-border-soft p-4">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8C81]" />
                  <input
                    className="h-11 w-full rounded-xl border border-primary-border bg-[#FBFCFB] pl-10 pr-10 text-sm font-semibold text-text-primary outline-none transition placeholder:text-[#9AA69F] focus:border-primary-accent focus:bg-white"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cliente, cédula o # de préstamo"
                    value={query}
                  />
                  {query ? (
                    <button
                      aria-label="Limpiar búsqueda"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#7A8C81] hover:bg-[#EDF4F0]"
                      onClick={() => setQuery('')}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </label>
              </div>
              <div className="flex items-center justify-between bg-[#F8FAF9] px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B786F]">
                  Préstamos disponibles
                </p>
                <span className="text-xs font-bold tabular-nums text-primary-accent">
                  {results.length}
                </span>
              </div>
              <div className="max-h-[calc(100vh-250px)] min-h-[280px] overflow-y-auto">
                {searching ? (
                  <p className="px-4 py-8 text-center text-sm font-medium text-[#8B9690]">
                    Buscando préstamos...
                  </p>
                ) : results.length ? (
                  results.map((item) => (
                    <LoanSearchResult
                      key={item.id}
                      loan={item}
                      onSelect={() => selectLoan(item.id)}
                    />
                  ))
                ) : (
                  <p className="px-5 py-10 text-center text-sm font-medium text-[#8B9690]">
                    No encontramos préstamos pendientes con esa búsqueda.
                  </p>
                )}
              </div>
            </aside>
          ) : null}

          <section className="min-w-0">
            {loadingLoan ? (
              <div className="flex min-h-[560px] items-center justify-center rounded-2xl border border-[#E2E9E5] bg-white text-sm font-semibold text-[#7A8C81] shadow-sm">
                Cargando información del préstamo...
              </div>
            ) : !loan ? (
              <div className="flex min-h-[560px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#CFE0D6] bg-white px-6 text-center shadow-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-accent">
                  <WalletCards className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-lg font-bold text-text-primary">Selecciona un préstamo</h2>
                <p className="mt-1 max-w-sm text-sm font-medium text-[#7A8C81]">
                  Verás aquí la cuota pendiente, el desglose del pago y el historial reciente.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <section className="overflow-hidden rounded-[22px] border border-[#DCE7E0] bg-white shadow-[0_14px_34px_rgba(36,75,56,0.08)]">
                  <div className="flex flex-col justify-between gap-4 bg-[#F7FAF8] px-6 py-5 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E1F1E7] text-primary-accent">
                        <UserRound className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold tracking-[-0.02em] text-text-primary">
                          {loan.client.firstName} {loan.client.lastName}
                        </h2>
                        <p className="mt-0.5 text-xs font-semibold text-[#7A7F7D]">
                          Préstamo #{loan.loanNumber} · {loan.product.name} ·{' '}
                          {frequencyLabels[loan.paymentFreq] ?? loan.paymentFreq}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-accent">
                        {loan.interestType === 'INDEFINITE' ? 'Indefinido' : `${loan.term} cuotas`}
                      </span>
                      <Link
                        className="text-xs font-bold text-primary-accent underline-offset-4 hover:underline"
                        href={`/prestamos/${loan.id}`}
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                  <div className="grid gap-5 border-t border-[#E5ECE8] px-6 py-5 sm:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr_1fr]">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A7F7D]">
                        A saldar hoy
                      </p>
                      <p className="mt-1.5 text-2xl font-bold tracking-[-0.03em] tabular-nums text-text-primary">
                        {fmt(payoffQuote?.totalToPay ?? totalOutstanding)}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-[#7A8C81]">
                        Capital, interés generado y mora
                      </p>
                    </div>
                    <Metric
                      label="Capital pendiente"
                      value={fmt(loanSummary?.capitalOutstanding ?? loan.balance)}
                    />
                    <Metric
                      label="Interés pendiente"
                      tone="orange"
                      value={fmt(
                        payoffQuote?.earnedInterest ?? loanSummary?.interestOutstanding ?? 0,
                      )}
                    />
                    <Metric label="Cuota actual" tone="green" value={fmt(nextScheduled)} />
                  </div>
                </section>

                <nav
                  aria-label="Acciones del préstamo"
                  className="grid gap-3 rounded-2xl border border-[#E2E9E5] bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-5"
                >
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-accent px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={saving || amountNumber <= 0 || exceedsOutstanding || hasNoOutstanding}
                    form="loan-payment-form"
                    type="submit"
                  >
                    <HandCoins className="h-4 w-4" /> Procesar pago
                  </button>
                  <Link
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-text-primary px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#102D20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
                    href={`/prestamos/${loan.id}?agreement=1`}
                  >
                    <Handshake className="h-4 w-4" /> Acuerdo de pago
                  </Link>
                  <Link
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F3F6F4] px-4 text-sm font-bold text-text-primary transition hover:bg-[#E7EFEA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
                    href={`/prestamos/${loan.id}#saldo-anticipado`}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Saldar
                  </Link>
                  <Link
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F3F6F4] px-4 text-sm font-bold text-text-primary transition hover:bg-[#E7EFEA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
                    href={`/prestamos/${loan.id}#calendario-cuotas`}
                  >
                    <ListChecks className="h-4 w-4" /> Ver cuotas
                  </Link>
                  <a
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-primary-border bg-white px-4 text-sm font-bold text-text-primary transition hover:bg-[#F3F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent sm:col-span-2 xl:col-span-1"
                    href="#recibos-pagos-cobro"
                  >
                    <ReceiptText className="h-4 w-4" /> Ver recibos
                  </a>
                </nav>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
                  <form
                    className="overflow-hidden rounded-2xl border border-[#E2E9E5] bg-white shadow-sm"
                    id="loan-payment-form"
                    onSubmit={handleSubmit}
                  >
                    <div className="border-b border-border-soft px-5 py-4">
                      <div className="flex items-center gap-2">
                        <CircleDollarSign className="h-5 w-5 text-primary-accent" />
                        <h2 className="text-base font-bold text-text-primary">Datos del cobro</h2>
                      </div>
                    </div>
                    <div className="space-y-5 p-5">
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label
                            className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary"
                            htmlFor="loan-payment-amount"
                          >
                            Monto recibido
                          </label>
                          <button
                            className="text-xs font-bold text-primary-accent hover:underline"
                            onClick={() => setAmount(String(amountToBringCurrent))}
                            type="button"
                          >
                            Usar monto para ponerse al día
                          </button>
                        </div>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-text-secondary">
                            RD$
                          </span>
                          <input
                            autoFocus
                            className={`h-14 w-full rounded-xl border bg-white pl-16 pr-4 text-2xl font-bold tabular-nums text-text-primary outline-none transition focus:ring-2 focus:ring-primary-soft ${
                              invalidAmount || exceedsOutstanding
                                ? 'border-[#D99073] focus:border-[#D99073]'
                                : 'border-[#CFE0D6] focus:border-primary-accent'
                            }`}
                            id="loan-payment-amount"
                            inputMode="decimal"
                            onChange={(event) => setAmount(event.target.value)}
                            placeholder="0.00"
                            value={amount}
                          />
                        </div>
                        {exceedsOutstanding ? (
                          <p className="mt-2 text-xs font-semibold text-[#A54827]">
                            El monto supera la deuda programada de {fmt(totalOutstanding)}.
                          </p>
                        ) : null}
                        {hasNoOutstanding ? (
                          <p className="mt-2 text-xs font-semibold text-[#A54827]">
                            Este préstamo no tiene cuotas pendientes para cobrar.
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label>
                          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">
                            Fecha del pago
                          </span>
                          <DatePickerInput
                            className={inputClass}
                            invalid={submitted && !paymentDate}
                            onChange={setPaymentDate}
                            value={paymentDate}
                          />
                        </label>
                        <label>
                          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">
                            Referencia
                          </span>
                          <input
                            className={inputClass}
                            onChange={(event) => setReference(event.target.value)}
                            placeholder="Opcional"
                            value={reference}
                          />
                        </label>
                      </div>

                      <fieldset>
                        <legend className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">
                          Método de pago
                        </legend>
                        <div className="grid grid-cols-3 gap-2">
                          {paymentMethods.map(({ label, icon: Icon }) => (
                            <button
                              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 text-xs font-bold transition ${
                                paymentMethod === label
                                  ? 'border-[#5FA37D] bg-primary-soft text-primary-accent'
                                  : 'border-primary-border bg-white text-text-secondary hover:bg-[#F8FAF9]'
                              }`}
                              key={label}
                              onClick={() => setPaymentMethod(label)}
                              type="button"
                            >
                              <Icon className="h-4 w-4" />
                              <span className="hidden sm:inline">{label}</span>
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <label>
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">
                          Notas
                        </span>
                        <textarea
                          className="h-20 w-full resize-none rounded-xl border border-primary-border bg-white px-3.5 py-3 text-sm font-medium text-text-primary outline-none transition focus:border-primary-accent focus:ring-2 focus:ring-primary-soft"
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder="Observaciones opcionales del cobro"
                          value={notes}
                        />
                      </label>

                      {error ? (
                        <div className="rounded-xl border border-[#F0CCBE] bg-[#FFF7F3] px-4 py-3 text-sm font-semibold text-state-danger">
                          {error}
                        </div>
                      ) : null}

                      <button
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(40,92,67,0.2)] transition hover:bg-[#234F3A] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={
                          saving || amountNumber <= 0 || exceedsOutstanding || hasNoOutstanding
                        }
                        type="submit"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {saving ? 'Registrando cobro...' : `Registrar ${fmt(amountNumber)}`}
                      </button>
                    </div>
                  </form>

                  <aside className="space-y-4">
                    <section className="overflow-hidden rounded-2xl border border-[#E2E9E5] bg-white shadow-sm">
                      <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <WalletCards className="h-4 w-4 text-primary-accent" />
                          <h2 className="text-sm font-bold text-text-primary">
                            Estado del préstamo
                          </h2>
                        </div>
                        <span className="text-[11px] font-bold text-primary-accent">
                          {loanSummary?.paidInstallments ?? 0}/{loan.term} cuotas pagadas
                        </span>
                      </div>
                      <dl className="grid px-4 sm:grid-cols-2 sm:gap-x-5 lg:grid-cols-1 lg:gap-x-0 xl:grid-cols-2 xl:gap-x-5">
                        <FinancialDetail label="Capital original" value={fmt(loan.principal)} />
                        <FinancialDetail
                          label="Capital pagado"
                          value={fmt(loanSummary?.capitalPaid ?? 0)}
                        />
                        <FinancialDetail
                          label="Interés pagado"
                          value={fmt(loanSummary?.interestPaid ?? 0)}
                        />
                        <FinancialDetail
                          label="Mora pendiente"
                          value={fmt(loanSummary?.feesOutstanding ?? 0)}
                        />
                        <FinancialDetail
                          label="Pagos vencidos"
                          value={`${fmt(loanSummary?.overdueAmount ?? 0)} · ${loanSummary?.overdueInstallments ?? 0} cuotas`}
                        />
                        <FinancialDetail
                          label="Total pagado"
                          value={fmt(loanSummary?.totalPaid ?? 0)}
                        />
                        <FinancialDetail label="Fecha de inicio" value={fmtDate(loan.startDate)} />
                        <FinancialDetail
                          label="Próximo vencimiento"
                          value={nextSchedule ? fmtDate(nextSchedule.dueDate) : 'Sin pendiente'}
                        />
                        <FinancialDetail
                          label="Último pago"
                          value={lastPayment ? fmt(lastPayment.amount) : 'Sin pagos'}
                        />
                        <FinancialDetail
                          label="Fecha último pago"
                          value={lastPayment ? fmtDate(lastPayment.paymentDate) : '—'}
                        />
                        <FinancialDetail
                          label="Tipo de préstamo"
                          value={getLoanTypeLabel(loan.interestType, loan.interestRate)}
                        />
                        <FinancialDetail
                          label="Tasa"
                          value={`${loan.interestRate}% · ${frequencyLabels[loan.paymentFreq] ?? loan.paymentFreq}`}
                        />
                      </dl>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-[#E2E9E5] bg-white shadow-sm">
                      <div className="flex items-center gap-2 border-b border-border-soft px-4 py-3.5">
                        <FileText className="h-4 w-4 text-primary-accent" />
                        <h2 className="text-sm font-bold text-text-primary">Aplicación del pago</h2>
                      </div>
                      {allocationPreview.length ? (
                        <div>
                          {allocationPreview.map((row) => (
                            <div
                              className="border-b border-border-soft p-4 last:border-b-0"
                              key={row.scheduleId}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-bold text-text-secondary">
                                  Cuota #
                                  {loan.schedule.findIndex((item) => item.id === row.scheduleId) +
                                    1}
                                </p>
                                <p className="text-xs font-semibold text-[#7A7F7D]">
                                  {fmtDate(row.dueDate)}
                                </p>
                              </div>
                              <div className="mt-2 grid grid-cols-3 gap-2 text-right tabular-nums">
                                <div className="text-left">
                                  <p className="text-[10px] font-bold uppercase text-[#8B9690]">
                                    Aplicado
                                  </p>
                                  <p className="mt-1 text-xs font-bold text-text-primary">
                                    {fmt(row.applied)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase text-[#8B9690]">
                                    Interés
                                  </p>
                                  <p className="mt-1 text-xs font-bold text-[#B64A24]">
                                    {fmt(row.interest)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase text-[#8B9690]">
                                    Capital
                                  </p>
                                  <p className="mt-1 text-xs font-bold text-primary-accent">
                                    {fmt(row.principal)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="grid grid-cols-2 gap-3 bg-[#F8FAF9] px-4 py-3 text-xs font-bold tabular-nums">
                            <span className="text-[#B64A24]">Interés: {fmt(previewInterest)}</span>
                            <span className="text-right text-primary-accent">
                              Capital: {fmt(previewPrincipal)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="px-4 py-8 text-center text-sm font-medium text-[#8B9690]">
                          Ingresa un monto para ver cómo se aplicará.
                        </p>
                      )}
                    </section>

                    {createdPayment ? (
                      <section className="rounded-2xl border border-[#BFDCC9] bg-[#F1F8F4] p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-accent text-white">
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-bold text-[#21563D]">Cobro registrado</p>
                            <p className="mt-1 text-xl font-bold tabular-nums text-text-primary">
                              {fmt(createdPayment.amount)}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-text-secondary">
                              Operación {createdPayment.id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </section>
                    ) : null}

                    <section
                      className="scroll-mt-5 overflow-hidden rounded-2xl border border-[#E2E9E5] bg-white shadow-sm"
                      id="recibos-pagos-cobro"
                    >
                      <div className="flex items-center gap-2 border-b border-border-soft px-4 py-3.5">
                        <ReceiptText className="h-4 w-4 text-primary-accent" />
                        <h2 className="text-sm font-bold text-text-primary">Pagos recientes</h2>
                      </div>
                      {latestPayments.length ? (
                        latestPayments.map((payment) => (
                          <div
                            className="flex items-center justify-between gap-3 border-t border-border-soft px-4 py-3 first:border-t-0"
                            key={payment.id}
                          >
                            <div>
                              <p className="text-xs font-bold text-text-primary">
                                {fmtDate(payment.paymentDate)}
                              </p>
                              <p className="mt-0.5 text-[11px] font-medium text-[#8B9690]">
                                {payment.paymentMethod ?? 'Sin método'}
                              </p>
                            </div>
                            <p className="text-sm font-bold tabular-nums text-primary-accent">
                              {fmt(payment.amount)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="px-4 py-7 text-center text-sm font-medium text-[#8B9690]">
                          Todavía no hay pagos registrados.
                        </p>
                      )}
                    </section>
                  </aside>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
