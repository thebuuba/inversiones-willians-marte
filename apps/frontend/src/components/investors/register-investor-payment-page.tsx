'use client';

import { useEffect, useRef, useState, type FormEvent, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Eye, ReceiptText } from 'lucide-react';
import { getInvestor } from '@/lib/api/investors';
import { getInvestment } from '@/lib/api/investments';
import { createInvestorPayment, getInvestmentPayments } from '@/lib/api/investor-payments';
import { formatDop, formatCurrencyInput, parseCurrencyInput } from '@/lib/currency';
import { invalidateCache } from '@/lib/use-client-cache';
import { formatBusinessDateInput } from '@/lib/date-format';
import type {
  InvestorInvestmentDetail,
  InvestorItem,
  InvestorPaymentItem,
} from '@inversiones/shared';
import { PaymentReceiptModal } from './payment-receipt-modal';
import { formatPaymentPeriods } from './payment-period-label';

const fmt = (n: number | string) => formatDop(n, { decimals: 2 });
const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const METHODS = ['Efectivo', 'Transferencia', 'Tarjeta'];

const inputClass =
  'h-11 w-full rounded-control-comfortable border border-primary-border bg-card px-4 text-sm font-medium text-text-primary outline-none transition focus:border-primary-accent';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export function RegisterInvestorPaymentPage() {
  const searchParams = useSearchParams();
  return (
    <InvestorPaymentForm
      investorId={searchParams.get('investorId')}
      investmentId={searchParams.get('investmentId')}
    />
  );
}

interface InvestorPaymentFormProps {
  investorId?: string | null;
  investmentId?: string | null;
  embedded?: boolean;
  onClose?: () => void;
  onBusyChange?: (busy: boolean) => void;
  onUncertainChange?: (uncertain: boolean) => void;
  onPaid?: (payment: InvestorPaymentItem, investment: InvestorInvestmentDetail) => void;
}

export function InvestorPaymentForm({
  investorId,
  investmentId,
  embedded = false,
  onClose,
  onBusyChange,
  onUncertainChange,
  onPaid,
}: InvestorPaymentFormProps) {
  const router = useRouter();
  const [investor, setInvestor] = useState<InvestorItem | null>(null);
  const [investment, setInvestment] = useState<InvestorInvestmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<InvestorPaymentItem[]>([]);

  const requestId = useRef<string | null>(null);

  const [periodMonth, setPeriodMonth] = useState(currentMonth);
  const [periodYear, setPeriodYear] = useState(currentYear);
  const [amount, setAmount] = useState('');
  const [paymentDate] = useState(() => formatBusinessDateInput());
  const [paymentMethod, setPaymentMethod] = useState(METHODS[0]);

  const [saving, setSaving] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [createdPayment, setCreatedPayment] = useState<InvestorPaymentItem | null>(null);
  const [receiptToView, setReceiptToView] = useState<InvestorPaymentItem | null>(null);
  const [receiptsOpen, setReceiptsOpen] = useState(false);

  function applyInvestmentPeriod(invst: InvestorInvestmentDetail) {
    if (!invst.currentPeriodMonth || !invst.currentPeriodYear) return;
    setPeriodMonth(invst.currentPeriodMonth);
    setPeriodYear(invst.currentPeriodYear);
  }

  useEffect(() => {
    if (!investorId && !investmentId) {
      router.replace('/inversionistas');
      return;
    }
    const load = async () => {
      if (investmentId) {
        const invst = await getInvestment(investmentId);
        setInvestment(invst);
        setAmount(String(invst.pendingAmount ?? 0));
        setInvestor(invst.investor ?? null);
        applyInvestmentPeriod(invst);
        setPayments(
          embedded
            ? []
            : await getInvestmentPayments(investmentId).catch(() => [] as InvestorPaymentItem[]),
        );
        return;
      }

      const inv = await getInvestor(investorId!);
      const active = inv.investments?.filter((item) => item.status === 'ACTIVE') ?? [];
      if (active.length !== 1)
        throw new Error('Selecciona una inversión desde el estado de cuenta');
      const selectedInvestment = active[0];
      if (!selectedInvestment) throw new Error('missing investment');
      const invst = await getInvestment(selectedInvestment.id);
      setInvestor(inv);
      setInvestment(invst);
      setAmount(String(invst.pendingAmount ?? 0));
      applyInvestmentPeriod(invst);
      setPayments(
        embedded
          ? []
          : await getInvestmentPayments(selectedInvestment.id).catch(
              () => [] as InvestorPaymentItem[],
            ),
      );
    };

    load()
      .catch(() => {
        setInvestor(null);
        setInvestment(null);
      })
      .finally(() => setLoading(false));
  }, [investmentId, investorId, router, embedded]);

  const cuota = investment ? Number(investment.monthlyPayment) : 0;
  const pendingAmount = investment?.pendingAmount ?? 0;

  if (!investorId && !investmentId) return null;

  if (loading) {
    return (
      <div
        className={`flex ${embedded ? 'min-h-40' : 'min-h-screen'} items-center justify-center bg-page font-sans`}
      >
        <p className="text-sm font-medium text-text-subtle">Cargando...</p>
      </div>
    );
  }

  if (!investor || !investment) {
    return (
      <div
        className={`flex ${embedded ? 'min-h-40' : 'min-h-screen'} flex-col items-center justify-center bg-page font-sans`}
      >
        <p className="text-sm font-medium text-text-subtle">Inversionista no encontrado.</p>
        <Link
          className="mt-4 text-sm font-bold text-primary-accent underline"
          href="/inversionistas"
        >
          Volver a inversionistas
        </Link>
      </div>
    );
  }

  const amountNumber = parseCurrencyInput(amount);
  const invalidAmount =
    submitted &&
    (!Number.isFinite(amountNumber) || amountNumber <= 0 || amountNumber > pendingAmount);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError(null);
    if (!investor || !investment) return;
    if (
      !Number.isFinite(amountNumber) ||
      amountNumber <= 0 ||
      amountNumber > pendingAmount ||
      !paymentDate
    ) {
      setError('Ingresa un monto mayor que cero y que no supere el interés pendiente.');
      return;
    }
    if (saving || createdPayment) return;
    requestId.current ??= crypto.randomUUID();

    setSaving(true);
    onBusyChange?.(true);
    try {
      const payment = await createInvestorPayment({
        requestId: requestId.current,
        investorId: investor.id,
        investmentId: investment.id,
        amount: amountNumber,
        periodMonth,
        periodYear,
        paymentDate,
        paymentMethod,
      });
      setUncertain(false);
      onUncertainChange?.(false);
      setCreatedPayment(payment);
      invalidateCache('investors');
      onPaid?.(payment, investment);
    } catch (err: unknown) {
      const status =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      const resultUncertain = status === undefined || status >= 500;
      setUncertain(resultUncertain);
      onUncertainChange?.(resultUncertain);
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? String(
              (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
                'Error al registrar el pago',
            )
          : 'Error al registrar el pago';
      setError(
        resultUncertain
          ? 'No se pudo confirmar la respuesta del servidor. Reintenta este mismo pago; el sistema evita duplicarlo.'
          : msg,
      );
    } finally {
      setSaving(false);
      onBusyChange?.(false);
    }
  }

  if (embedded) {
    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-panel bg-surface-subtle p-4">
          <p className="text-sm font-bold text-text-primary">
            {investor.name} <span className="font-medium text-text-muted">· {investment.code}</span>
          </p>
          <p className="mt-3 text-xs font-bold text-text-secondary">Interés pendiente acumulado</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{fmt(pendingAmount)}</p>
          <ul className="mt-3 max-h-40 divide-y divide-border-soft overflow-y-auto">
            {(investment.pendingPeriods ?? []).map((period) => (
              <li
                key={`${period.periodYear}-${period.periodMonth}`}
                className="flex justify-between gap-3 py-2 text-sm"
              >
                <span>
                  {MONTHS[period.periodMonth - 1]} {period.periodYear}
                </span>
                <strong className="tabular-nums">{fmt(period.balance)}</strong>
              </li>
            ))}
          </ul>
          {pendingAmount <= 0 && (
            <p role="status" className="mt-3 text-sm text-primary">
              Esta inversión está al día.
            </p>
          )}
        </div>
        <p className="text-sm text-text-secondary">
          Puedes pagar todo o abonar una parte. Se aplica primero a los meses más antiguos.
        </p>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-text-secondary">
            Monto a pagar (RD$)
          </span>
          <input
            autoFocus
            className={`${inputClass} ${invalidAmount ? 'border-state-danger-dot' : ''}`}
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(formatCurrencyInput(event.target.value))}
            disabled={saving || uncertain}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-text-secondary">Método de pago</span>
          <select
            className={inputClass}
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            disabled={saving || uncertain}
          >
            {METHODS.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </label>
        {error && (
          <p role="alert" className="text-sm font-semibold text-state-danger">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 border-t border-border-soft pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uncertain}
            className="min-h-11 rounded-full bg-surface-subtle px-5 text-sm font-bold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              saving || !!createdPayment || pendingAmount <= 0 || investment.status !== 'ACTIVE'
            }
            className="min-h-11 rounded-full bg-brand-sky px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? 'Registrando...' : 'Registrar pago y ver recibo'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-page p-5 font-sans">
        <div className="w-full">
          <Link
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary-accent hover:text-primary-accent"
            href={`/inversionistas/${investor.id}`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a inversionista
          </Link>

          <div className="mb-6 flex w-full items-center gap-3 rounded-panel border border-border-soft bg-card px-4 py-3 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control-comfortable bg-primary-soft">
              <TrendingUp className="h-5 w-5 text-primary-accent" />
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
              <h2 className="text-base font-bold text-text-primary">{investor.name}</h2>
              <p className="text-sm text-text-muted">{investment.code}</p>
              <span className="rounded-full bg-primary-soft px-3 py-0.5 text-xs font-semibold text-primary-accent">
                {investor.status === 'ACTIVE'
                  ? 'Activo'
                  : investor.status === 'PAUSED'
                    ? 'Pausado'
                    : 'Retirado'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
            {/* Left column: Financial information */}
            <div>
              <div className="rounded-panel bg-card p-6 shadow-card border border-border-soft">
                <h3 className="mb-4 text-sm font-semibold text-text-primary">
                  Información financiera
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border-soft pb-2">
                    <span className="text-xs text-text-muted">Capital invertido</span>
                    <span className="text-sm font-bold text-text-primary">
                      {fmt(Number(investment.capital))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border-soft pb-2">
                    <span className="text-xs text-text-muted">Tasa mensual</span>
                    <span className="text-sm font-bold text-text-primary">
                      {Number(investment.rate)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border-soft pb-2">
                    <span className="text-xs text-text-muted">Retorno mensual (cuota)</span>
                    <span className="text-sm font-bold text-primary-accent">{fmt(cuota)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border-soft pb-2">
                    <span className="text-xs text-text-muted">Período</span>
                    <span className="text-sm font-bold text-text-primary">
                      {MONTHS[periodMonth - 1]} {periodYear}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Saldo del mes más antiguo</span>
                    <span className="text-sm font-bold text-state-warning">
                      {fmt(investment.currentPeriodBalance ?? cuota)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-panel border border-border-soft bg-card p-5 shadow-card">
                <p className="text-sm font-bold text-text-primary">Interés pendiente acumulado</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-brand-sky">
                  {fmt(pendingAmount)}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {investment.pendingMonths ?? 0} meses pendientes · Sin capitalización de intereses
                </p>
                {pendingAmount === 0 ? (
                  <p role="status" className="mt-4 text-sm text-primary">
                    Al día. Próximo vencimiento:{' '}
                    {investment.nextDueDate ? fmtDate(investment.nextDueDate) : 'sin fecha'}
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-border-soft">
                    {(investment.pendingPeriods ?? []).map((period) => (
                      <li
                        key={`${period.periodYear}-${period.periodMonth}`}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <span>
                          {MONTHS[period.periodMonth - 1]} {period.periodYear}
                        </span>
                        <span className="font-bold tabular-nums">{fmt(period.balance)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right column: Payment form */}
            <div className="rounded-panel border border-border-soft bg-card p-6 shadow-card">
              <h2 className="mb-1 text-xl font-bold text-text-primary">
                Registrar pago de interés
              </h2>
              <p className="mb-6 text-sm text-text-muted">
                El pago se aplica primero a los meses más antiguos. Puedes pagar todo el acumulado o
                abonar una parte.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-text-secondary">Monto</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-text-secondary">
                        RD$
                      </span>
                      <input
                        className={`${inputClass} pl-14 ${invalidAmount ? 'border-state-danger-dot' : ''}`}
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-text-secondary">
                      Método de pago
                    </span>
                    <select
                      className={inputClass}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      {METHODS.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </label>

                  {error && (
                    <p className="text-sm font-medium text-state-danger sm:col-span-2">{error}</p>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-border-soft pt-4">
                  <Link
                    className="inline-flex h-11 items-center rounded-full border border-primary-border bg-card px-6 text-sm font-bold text-text-primary"
                    href={`/inversionistas/${investor.id}`}
                  >
                    Cancelar
                  </Link>
                  <button
                    className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-white disabled:opacity-60"
                    disabled={
                      saving ||
                      !!createdPayment ||
                      pendingAmount <= 0 ||
                      investment.status !== 'ACTIVE'
                    }
                    type="submit"
                  >
                    {saving ? 'Registrando...' : 'Registrar pago'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-panel border border-border-soft bg-card shadow-card">
            <div className="flex px-4 sm:px-6" role="tablist" aria-label="Recibos de la inversión">
              <button
                aria-selected={receiptsOpen}
                className={`min-h-14 border-b-2 px-4 text-sm font-bold transition ${
                  receiptsOpen
                    ? 'border-primary-accent text-primary-accent'
                    : 'border-transparent text-text-secondary hover:text-primary-accent'
                }`}
                onClick={() => setReceiptsOpen(true)}
                role="tab"
                type="button"
              >
                Recibos
              </button>
            </div>

            {receiptsOpen && (
              <div className="min-h-[420px]" role="tabpanel">
                <div className="flex flex-col gap-3 border-b border-border-soft px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">Recibos de pagos</h2>
                    <p className="mt-1 text-sm text-text-muted">
                      Todos los comprobantes registrados para esta inversión.
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-accent">
                    {payments.length} {payments.length === 1 ? 'recibo' : 'recibos'}
                  </span>
                </div>

                {payments.length === 0 ? (
                  <div className="flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-accent">
                      <ReceiptText className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 text-base font-bold text-text-primary">
                      No hay recibos todavía
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Los recibos aparecerán aquí cuando se registre el primer pago.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-soft">
                    {payments.map((payment) => (
                      <div
                        className="grid gap-4 px-6 py-4 sm:grid-cols-[1.2fr_1fr_auto_auto] sm:items-center"
                        key={payment.id}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control-comfortable bg-primary-soft text-primary-accent">
                            <ReceiptText className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-sm font-bold text-text-primary">
                              Recibo #{String(payment.receiptNumber).padStart(5, '0')}
                            </p>
                            <p className="mt-0.5 text-xs text-text-secondary">
                              {formatPaymentPeriods(payment)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {fmtDate(payment.paymentDate)}
                          </p>
                          <p className="mt-0.5 text-xs text-text-secondary">
                            {payment.paymentMethod ?? 'Método no indicado'}
                          </p>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-text-primary">
                          {fmt(Number(payment.amount))}
                        </span>
                        <button
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary-border px-4 text-sm font-bold text-primary-accent transition hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
                          onClick={() => setReceiptToView(payment)}
                          type="button"
                        >
                          <Eye className="h-4 w-4" />
                          Ver recibo
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {createdPayment && investor && (
        <PaymentReceiptModal
          newlyCreated
          payment={createdPayment}
          investor={investor}
          investment={investment}
          onClose={() => router.push(`/inversionistas/${investor.id}`)}
        />
      )}

      {receiptToView && investor && (
        <PaymentReceiptModal
          payment={receiptToView}
          investor={investor}
          investment={investment}
          onClose={() => setReceiptToView(null)}
        />
      )}
    </>
  );
}
