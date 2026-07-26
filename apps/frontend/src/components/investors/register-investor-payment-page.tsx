'use client';

import { useEffect, useState, type FormEvent, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { getInvestor } from '@/lib/api/investors';
import { getInvestment } from '@/lib/api/investments';
import { createInvestorPayment, checkInvestorPaymentPeriod, getInvestmentPayments } from '@/lib/api/investor-payments';
import { formatDop } from '@/lib/currency';
import type { InvestorInvestmentDetail, InvestorItem, InvestorPaymentItem } from '@inversiones/shared';
import { PaymentReceiptModal } from './payment-receipt-modal';

const fmt = (n: number | string) => formatDop(n);
const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const METHODS = ['Efectivo', 'Transferencia', 'Tarjeta'];

const inputClass =
  'h-11 w-full rounded-control-comfortable border border-primary-border bg-card px-4 text-sm font-medium text-text-primary outline-none transition focus:border-primary-accent';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export function RegisterInvestorPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const investorId = searchParams.get('investorId');
  const investmentId = searchParams.get('investmentId');

  const [investor, setInvestor] = useState<InvestorItem | null>(null);
  const [investment, setInvestment] = useState<InvestorInvestmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<InvestorPaymentItem[]>([]);
  const [periodPaid, setPeriodPaid] = useState<InvestorPaymentItem | null>(null);
  const [checkingPeriod, setCheckingPeriod] = useState(false);

  const [periodMonth, setPeriodMonth] = useState(currentMonth);
  const [periodYear, setPeriodYear] = useState(currentYear);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState(METHODS[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [createdPayment, setCreatedPayment] = useState<InvestorPaymentItem | null>(null);
  const [generateReceipt, setGenerateReceipt] = useState(true);

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
        setInvestor(invst.investor ?? null);
        applyInvestmentPeriod(invst);
        setPayments(await getInvestmentPayments(investmentId).catch(() => [] as InvestorPaymentItem[]));
        return;
      }

      const inv = await getInvestor(investorId!);
      const selectedInvestment = inv.investments?.find((item) => item.status === 'ACTIVE') ?? inv.investments?.[0];
      if (!selectedInvestment) throw new Error('missing investment');
      const invst = await getInvestment(selectedInvestment.id);
      setInvestor(inv);
      setInvestment(invst);
      applyInvestmentPeriod(invst);
      setPayments(await getInvestmentPayments(selectedInvestment.id).catch(() => [] as InvestorPaymentItem[]));
    };

    load()
      .catch(() => {
        setInvestor(null);
        setInvestment(null);
      })
      .finally(() => setLoading(false));
  }, [investmentId, investorId, router]);

  const targetInvestmentId = investment?.id;
  const cuota = investment ? Math.round(Number(investment.monthlyPayment)) : 0;

  useEffect(() => {
    if (!targetInvestmentId || !investment) return;
    queueMicrotask(() => setCheckingPeriod(true));
    checkInvestorPaymentPeriod(targetInvestmentId, periodMonth, periodYear, 'investment')
      .then((p) => {
        setPeriodPaid(p);
        if (!p) setAmount(String(cuota));
      })
      .catch(() => setPeriodPaid(null))
      .finally(() => setCheckingPeriod(false));
  }, [targetInvestmentId, periodMonth, periodYear, investment, cuota]);

  if (!investorId && !investmentId) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page font-sans">
        <p className="text-sm font-medium text-text-subtle">Cargando...</p>
      </div>
    );
  }

  if (!investor || !investment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-page font-sans">
        <p className="text-sm font-medium text-text-subtle">Inversionista no encontrado.</p>
        <Link className="mt-4 text-sm font-bold text-primary-accent underline" href="/inversionistas">
          Volver a inversionistas
        </Link>
      </div>
    );
  }

  const amountNumber = Number(amount.replace(/[,.]/g, ''));
  const invalidAmount = submitted && (!Number.isFinite(amountNumber) || amountNumber <= 0);
  const invalidDate = submitted && !paymentDate;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setError(null);
    if (!investor || !investment) return;
    if (!Number.isFinite(amountNumber) || amountNumber <= 0 || !paymentDate) return;

    setSaving(true);
    try {
      const payment = await createInvestorPayment({
        investorId: investor.id,
        investmentId: investment.id,
        amount: amountNumber,
        periodMonth,
        periodYear,
        paymentDate,
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (generateReceipt) setCreatedPayment(payment);
      else router.push(`/inversionistas/${investor.id}`);
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? String((err as { response: { data: { message?: string } } }).response.data.message ?? 'Error al registrar el pago')
          : 'Error al registrar el pago';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <div className="min-h-screen bg-page p-5 font-sans">
      <div className="mx-auto max-w-7xl">
        <Link
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary-accent hover:text-primary-accent"
          href={`/inversionistas/${investor.id}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a inversionista
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
          {/* Left column: Investor info */}
          <div className="space-y-5">
            <div className="rounded-panel bg-card p-6 shadow-card border border-border-soft">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-panel bg-primary-soft">
                  <TrendingUp className="h-7 w-7 text-primary-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">{investor.name}</h2>
                  <p className="text-sm text-text-muted">{investment.code}</p>
                  <span className="mt-1 inline-block rounded-full bg-primary-soft px-3 py-0.5 text-xs font-semibold text-primary-accent">
                    {investor.status === 'ACTIVE' ? 'Activo' : investor.status === 'PAUSED' ? 'Pausado' : 'Retirado'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-panel bg-card p-6 shadow-card border border-border-soft">
              <h3 className="mb-4 text-sm font-semibold text-text-primary">Información financiera</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border-soft pb-2">
                  <span className="text-xs text-text-muted">Capital invertido</span>
                  <span className="text-sm font-bold text-text-primary">{fmt(Number(investment.capital))}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-soft pb-2">
                  <span className="text-xs text-text-muted">Tasa mensual</span>
                  <span className="text-sm font-bold text-text-primary">{Number(investment.rate)}%</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-soft pb-2">
                  <span className="text-xs text-text-muted">Retorno mensual (cuota)</span>
                  <span className="text-sm font-bold text-primary-accent">{fmt(cuota)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-soft pb-2">
                  <span className="text-xs text-text-muted">Período</span>
                  <span className="text-sm font-bold text-text-primary">{MONTHS[periodMonth - 1]} {periodYear}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Estado del período</span>
                  {checkingPeriod ? (
                    <span className="text-sm font-medium text-text-subtle">Verificando...</span>
                  ) : periodPaid ? (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-accent">
                      <CheckCircle2 className="h-4 w-4" /> Pagado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-state-warning">
                      <Clock className="h-4 w-4" /> Pendiente
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-panel bg-card p-6 shadow-card border border-border-soft">
              <h3 className="mb-4 text-sm font-semibold text-text-primary">Últimos pagos</h3>
              {payments.length === 0 ? (
                <p className="text-sm text-text-subtle">No hay pagos registrados aún.</p>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-border-soft pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {MONTHS[p.periodMonth - 1]} {p.periodYear}
                        </p>
                        <p className="text-xs text-text-subtle">{fmtDate(p.paymentDate)}</p>
                      </div>
                      <span className="text-sm font-bold text-primary-accent">{fmt(Number(p.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Payment form */}
          <div className="rounded-panel bg-card p-6 shadow-card border border-border-soft">
            <h2 className="mb-1 text-xl font-bold text-text-primary">Registrar pago de interés</h2>
            <p className="mb-6 text-sm text-text-muted">
              Registra el pago mensual correspondiente al período seleccionado.
            </p>

            {periodPaid && (
              <div className="rounded-control-comfortable bg-primary-soft p-5 border border-border-soft">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-accent" />
                  <p className="font-semibold text-primary-accent">Este período ya tiene pagos</p>
                </div>
                <p className="mt-2 text-sm text-text-secondary">
                  Ya existe un pago de <strong>{fmt(Number(periodPaid.amount))}</strong> para{' '}
                  {MONTHS[periodMonth - 1]} {periodYear}, registrado el {fmtDate(periodPaid.paymentDate)}.
                  Puedes registrar otro pago o complemento para este mismo período.
                </p>
                {periodPaid.paymentMethod && (
                  <p className="mt-1 text-sm text-text-muted">Método: {periodPaid.paymentMethod}</p>
                )}
              </div>
            )}

            <form className={periodPaid ? 'mt-5' : undefined} onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-text-secondary">Período</span>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className={inputClass}
                        value={periodMonth}
                        onChange={(e) => setPeriodMonth(Number(e.target.value))}
                      >
                        {MONTHS.map((m, i) => (
                          <option key={i + 1} value={i + 1}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select
                        className={inputClass}
                        value={periodYear}
                        onChange={(e) => setPeriodYear(Number(e.target.value))}
                      >
                        {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>

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
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-text-secondary">Fecha del pago</span>
                    <input
                      className={`${inputClass} ${invalidDate ? 'border-state-danger-dot' : ''}`}
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-text-secondary">Método de pago</span>
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

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-text-secondary">Referencia</span>
                    <input
                      className={inputClass}
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Opcional"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-bold text-text-secondary">Notas</span>
                    <textarea
                      className="h-24 w-full resize-none rounded-control-comfortable border border-primary-border bg-card px-4 py-3 text-sm font-medium text-text-primary outline-none transition focus:border-primary-accent"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Opcional"
                    />
                  </label>

                  {error && <p className="text-sm font-medium text-state-danger sm:col-span-2">{error}</p>}

                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control-comfortable border border-border-soft bg-surface-subtle px-4 py-3 sm:col-span-2">
                    <input
                      checked={generateReceipt}
                      className="h-5 w-5 accent-primary"
                      onChange={(event) => setGenerateReceipt(event.target.checked)}
                      type="checkbox"
                    />
                    <span>
                      <span className="block text-sm font-bold text-text-primary">Generar recibo</span>
                      <span className="block text-xs text-text-muted">Abrirlo para imprimir al registrar el pago.</span>
                    </span>
                  </label>
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
                    disabled={saving}
                    type="submit"
                  >
                    {saving ? 'Registrando...' : 'Registrar pago'}
                  </button>
                </div>
            </form>
          </div>
        </div>
      </div>
    </div>

      {createdPayment && investor && (
        <PaymentReceiptModal
          payment={createdPayment}
          investor={investor}
          investment={investment}
          onClose={() => router.push(`/inversionistas/${investor.id}`)}
        />
      )}
    </>
  );
}
