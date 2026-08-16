'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Banknote,
  ChevronDown,
  History,
  Landmark,
  Plus,
  Printer,
  ReceiptText,
  X,
} from 'lucide-react';
import { addInvestmentCapital, getInvestment } from '@/lib/api/investments';
import { formatDop } from '@/lib/currency';
import { investmentPaymentStatusVisuals } from '@/lib/investment-payment-status';
import type {
  InvestorInvestmentDetail,
  InvestorInvestmentMovementItem,
  InvestorPaymentItem,
} from '@inversiones/shared';
import { CapitalAdditionReceiptModal } from './capital-addition-receipt-modal';
import { PaymentReceiptModal } from './payment-receipt-modal';
import { InvestmentReceiptModal } from './investment-receipt-modal';

const fmt = (n: number | string) => formatDop(n, { space: true });
const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

const TABS = ['Historial de pagos', 'Movimientos de capital', 'Historial', 'Recibos'];

type InvestmentHistoryEvent = {
  id: string;
  type: 'Inversión' | 'Capital' | 'Pago';
  title: string;
  detail?: string;
  amount: number;
  author: string;
  createdAt: string;
};

export function InvestmentDetailPage({ investmentId }: { investmentId: string }) {
  const [tab, setTab] = useState<number | null>(null);
  const [investment, setInvestment] = useState<InvestorInvestmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [movementDate, setMovementDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMovement, setCreatedMovement] = useState<InvestorInvestmentMovementItem | null>(
    null,
  );
  const [previousCapital, setPreviousCapital] = useState(0);
  const [previousMonthlyPayment, setPreviousMonthlyPayment] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<InvestorPaymentItem | null>(null);
  const [showInvestmentReceipt, setShowInvestmentReceipt] = useState(false);
  const [showAddCapital, setShowAddCapital] = useState(false);

  useEffect(() => {
    getInvestment(investmentId)
      .then(setInvestment)
      .catch(() => setInvestment(null))
      .finally(() => setLoading(false));
  }, [investmentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page font-sans">
        <p className="text-sm text-text-subtle">Cargando inversion...</p>
      </div>
    );
  }

  if (!investment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page font-sans">
        <p className="text-sm text-text-subtle">Inversion no encontrada.</p>
      </div>
    );
  }

  const investorHref = `/inversionistas/${investment.investorId}`;
  const statusVisual = investmentPaymentStatusVisuals[investment.paymentStatus ?? 'SCHEDULED'];
  const initialCapital =
    Number(investment.capital) -
    (investment.movements ?? []).reduce((sum, movement) => sum + Number(movement.amount), 0);
  const historyEvents: InvestmentHistoryEvent[] = [
    {
      id: `investment-${investment.id}`,
      type: 'Inversión' as const,
      title: 'Inversión creada',
      detail: investment.code,
      amount: initialCapital,
      author: 'Sistema',
      createdAt: investment.createdAt,
    },
    ...(investment.movements ?? []).map((movement) => ({
      id: `movement-${movement.id}`,
      type: 'Capital' as const,
      title: 'Aporte de capital registrado',
      detail: movement.notes,
      amount: Number(movement.amount),
      author: movement.createdBy?.name ?? 'Sistema',
      createdAt: movement.movementDate,
    })),
    ...(investment.payments ?? []).map((payment) => ({
      id: `payment-${payment.id}`,
      type: 'Pago' as const,
      title: `Pago del período ${payment.periodMonth}/${payment.periodYear}`,
      detail: `Recibo #${String(payment.receiptNumber).padStart(5, '0')}`,
      amount: Number(payment.amount),
      author: payment.receivedBy?.name ?? 'Sistema',
      createdAt: payment.paymentDate,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  async function handleAddCapital(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountNumber = Number(amount.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setError('Ingresa un monto valido.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setPreviousCapital(Number(investment!.capital));
      setPreviousMonthlyPayment(Number(investment!.monthlyPayment));
      const updated = await addInvestmentCapital(investmentId, {
        amount: amountNumber,
        movementDate,
        notes: notes.trim() || undefined,
      });
      const newMovement = updated.movements?.[0];
      if (newMovement) setCreatedMovement(newMovement);
      setInvestment(updated);
      setAmount('');
      setNotes('');
      setShowAddCapital(false);
    } catch {
      setError('No se pudo sumar el capital.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-page px-4 py-5 font-sans text-text-primary sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1480px]">
          <Link
            className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-xs font-bold uppercase tracking-wider text-primary-accent transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
            href={investorHref}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inversionista
          </Link>

          <header className="overflow-hidden rounded-panel border border-border-soft bg-card shadow-card">
            <div className="flex flex-col gap-5 p-5 sm:p-7 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                  {investment.investor?.name}
                </h1>
                <p className="mt-1 text-base font-semibold tracking-wide text-primary-accent">
                  {investment.code}
                </p>
                <p className="mt-2 text-sm text-text-muted">
                  Inicio {investment.startDate ? fmtDate(investment.startDate) : '—'} · Plazo{' '}
                  {investment.term ?? 'Indefinido'}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span
                  className={`inline-flex min-h-10 items-center rounded-full px-4 py-2 text-sm font-bold ${statusVisual.className}`}
                >
                  {statusVisual.label}
                </span>
                <details className="relative">
                  <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-white transition hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2">
                    Acciones
                    <ChevronDown className="h-4 w-4" />
                  </summary>
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-control-comfortable border border-border-soft bg-card p-2 shadow-modal">
                    <button
                      className="flex min-h-11 w-full items-center gap-2 rounded-control-comfortable px-3 text-left text-sm font-semibold hover:bg-primary-soft"
                      onClick={() => setShowAddCapital(true)}
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                      Sumar capital
                    </button>
                    <Link
                      className="flex min-h-11 items-center gap-2 rounded-control-comfortable px-3 text-sm font-semibold hover:bg-primary-soft"
                      href={`/inversionistas/pago?investmentId=${investment.id}`}
                    >
                      <Banknote className="h-4 w-4" />
                      Registrar pago
                    </Link>
                    <button
                      className="flex min-h-11 w-full items-center gap-2 rounded-control-comfortable px-3 text-left text-sm font-semibold hover:bg-primary-soft"
                      onClick={() => setShowInvestmentReceipt(true)}
                      type="button"
                    >
                      <Printer className="h-4 w-4" />
                      Recibo de inversión
                    </button>
                  </div>
                </details>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-border-soft bg-page p-4 sm:grid-cols-2 lg:grid-cols-4">
              <Summary label="Capital" value={fmt(investment.capital)} />
              <Summary label="Tasa" value={`${investment.rate}% mensual`} />
              <Summary label="Retorno mensual" value={fmt(investment.monthlyPayment)} />
              <Summary
                label="Próximo vencimiento"
                value={investment.nextDueDate ? fmtDate(investment.nextDueDate) : '—'}
              />
            </div>
          </header>

          <section className="mt-6 overflow-hidden rounded-panel border border-border-soft bg-card shadow-card">
            <nav
              aria-label="Secciones de la inversión"
              className="scrollbar-none flex w-full gap-1 overflow-x-auto border-b border-border-soft px-4 pt-2 sm:px-6"
              role="tablist"
            >
              {TABS.map((label, index) => (
                <button
                  aria-selected={tab === index}
                  className={`relative min-h-12 shrink-0 px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent sm:px-5 ${
                    tab === index
                      ? 'text-primary-accent after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary-accent'
                      : 'text-text-muted hover:text-primary-accent'
                  }`}
                  key={label}
                  onClick={() => setTab(index)}
                  role="tab"
                  type="button"
                >
                  {label}
                </button>
              ))}
            </nav>

            {tab === 0 && (
              <div className="min-h-[300px] p-5 sm:p-7" role="tabpanel">
                {(investment.payments ?? []).length === 0 ? (
                  <div className="mt-6 flex min-h-56 flex-col items-center justify-center rounded-control-comfortable border border-dashed border-primary-border bg-surface-subtle px-5 py-8 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-accent">
                      <ReceiptText className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 text-base font-bold text-text-primary">Aún no hay pagos</h3>
                    <p className="mt-1 max-w-md text-sm leading-6 text-text-secondary">
                      Los pagos registrados aparecerán aquí con su fecha, monto y recibo.
                    </p>
                    <Link
                      className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-white transition hover:bg-primary"
                      href={`/inversionistas/pago?investmentId=${investment.id}`}
                    >
                      <Banknote className="h-4 w-4" />
                      Registrar primer pago
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(investment.payments ?? []).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-col gap-4 rounded-control-comfortable border border-border-soft bg-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-bold">
                            Período {payment.periodMonth}/{payment.periodYear}
                          </p>
                          <p className="text-xs text-text-subtle">{fmtDate(payment.paymentDate)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-primary-accent">
                            {fmt(payment.amount)}
                          </span>
                          <button
                            aria-label={`Ver recibo ${payment.receiptNumber}`}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary-border px-4 text-sm font-bold hover:bg-primary-soft"
                            onClick={() => setSelectedPayment(payment)}
                            type="button"
                          >
                            <Printer className="h-4 w-4" />
                            Recibo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 1 && (
              <div className="min-h-[300px] p-5 sm:p-7" role="tabpanel">
                {(investment.movements ?? []).length === 0 ? (
                  <div className="mt-6 flex min-h-56 flex-col items-center justify-center rounded-control-comfortable border border-dashed border-primary-border bg-surface-subtle px-5 py-8 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-accent">
                      <Landmark className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 text-base font-bold text-text-primary">
                      Sin movimientos de capital
                    </h3>
                    <p className="mt-1 max-w-md text-sm leading-6 text-text-secondary">
                      Los aportes adicionales quedarán organizados aquí con su fecha y nota.
                    </p>
                    <button
                      className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-white transition hover:bg-primary"
                      onClick={() => setShowAddCapital(true)}
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                      Sumar capital
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(investment.movements ?? []).map((movement) => (
                      <div
                        key={movement.id}
                        className="flex items-center justify-between gap-4 rounded-control-comfortable border border-border-soft bg-surface-subtle p-4"
                      >
                        <div>
                          <p className="text-sm font-bold">Aporte de capital</p>
                          <p className="text-xs text-text-subtle">
                            {fmtDate(movement.movementDate)}
                          </p>
                          {movement.notes && (
                            <p className="mt-1 text-xs text-text-muted">{movement.notes}</p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-primary-accent">
                          {fmt(movement.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 2 && <InvestmentHistoryTab events={historyEvents} />}

            {tab === 3 && (
              <InvestmentReceiptsTab
                onOpenReceipt={setSelectedPayment}
                payments={investment.payments ?? []}
              />
            )}
          </section>
        </div>
      </div>

      {showAddCapital && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-[2px]"
          onClick={() => setShowAddCapital(false)}
        >
          <section
            className="w-full max-w-lg rounded-panel border border-border-soft bg-card p-6 shadow-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-control-comfortable bg-primary-soft">
                  <Banknote className="h-5 w-5 text-primary-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Sumar capital</h2>
                  <p className="text-sm text-text-subtle">Aumenta esta inversión.</p>
                </div>
              </div>
              <button
                aria-label="Cerrar"
                className="rounded-full p-2 hover:bg-surface-subtle"
                onClick={() => setShowAddCapital(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddCapital} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-text-secondary">Monto</span>
                <input
                  className="h-11 w-full rounded-control-comfortable border border-primary-border px-4 text-sm outline-none focus:border-primary-accent"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="100,000"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-text-secondary">Fecha</span>
                <input
                  className="h-11 w-full rounded-control-comfortable border border-primary-border px-4 text-sm outline-none focus:border-primary-accent"
                  type="date"
                  value={movementDate}
                  onChange={(event) => setMovementDate(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-text-secondary">Nota</span>
                <textarea
                  className="h-24 w-full resize-none rounded-control-comfortable border border-primary-border px-4 py-3 text-sm outline-none focus:border-primary-accent"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Opcional"
                />
              </label>
              {error && <p className="text-sm font-semibold text-state-danger">{error}</p>}
              <button
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-white disabled:opacity-60"
                disabled={saving}
                type="submit"
              >
                <Plus className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Sumar capital'}
              </button>
            </form>
          </section>
        </div>
      )}

      {createdMovement && investment.investor && (
        <CapitalAdditionReceiptModal
          movement={createdMovement}
          investor={investment.investor}
          investment={investment}
          previousCapital={previousCapital}
          previousMonthlyPayment={previousMonthlyPayment}
          onClose={() => setCreatedMovement(null)}
        />
      )}
      {selectedPayment && investment.investor && (
        <PaymentReceiptModal
          investment={investment}
          investor={investment.investor}
          onClose={() => setSelectedPayment(null)}
          payment={selectedPayment}
        />
      )}
      {showInvestmentReceipt && investment.investor && (
        <InvestmentReceiptModal
          investment={investment}
          investor={investment.investor}
          onClose={() => setShowInvestmentReceipt(false)}
        />
      )}
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control-comfortable border border-border-soft bg-card p-5 shadow-soft">
      <p className="text-xs font-medium text-text-subtle">{label}</p>
      <p className="mt-1.5 text-lg font-bold tabular-nums text-text-primary">{value}</p>
    </div>
  );
}

function InvestmentHistoryTab({ events }: { events: InvestmentHistoryEvent[] }) {
  const visuals = {
    Inversión: { icon: History, className: 'bg-state-info-bg text-state-info' },
    Capital: { icon: Landmark, className: 'bg-state-success-bg text-state-success' },
    Pago: { icon: Banknote, className: 'bg-primary-soft text-primary-accent' },
  } as const;

  return (
    <div className="min-h-[300px] p-5 sm:p-7" role="tabpanel">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Historial de la inversión</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Creación, aportes y pagos organizados por fecha.
          </p>
        </div>
        <span className="w-fit rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-accent">
          {events.length} {events.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>

      <div className="relative">
        <div className="absolute bottom-0 left-[14px] top-0 w-px bg-border-soft" />
        <div className="space-y-4">
          {events.map((event) => {
            const visual = visuals[event.type];
            const Icon = visual.icon;
            return (
              <div className="relative grid grid-cols-[30px_1fr] gap-4" key={event.id}>
                <span
                  className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full ${visual.className}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <article className="rounded-control-comfortable border border-border-soft bg-surface-subtle px-4 py-3.5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${visual.className}`}
                        >
                          {event.type}
                        </span>
                        <span className="text-sm font-bold text-primary-accent">
                          {fmt(event.amount)}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-text-primary">
                        {event.title}
                      </h3>
                      {event.detail && (
                        <p className="mt-1 text-xs text-text-secondary">{event.detail}</p>
                      )}
                      <p className="mt-1 text-xs text-text-muted">Registrado por {event.author}</p>
                    </div>
                    <time className="shrink-0 text-xs text-text-subtle">
                      {fmtDate(event.createdAt)}
                    </time>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InvestmentReceiptsTab({
  onOpenReceipt,
  payments,
}: {
  onOpenReceipt: (payment: InvestorPaymentItem) => void;
  payments: InvestorPaymentItem[];
}) {
  const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <div className="min-h-[300px]" role="tabpanel">
      <div className="flex flex-col gap-4 border-b border-border-soft px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Recibos de pagos</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Todos los comprobantes emitidos para esta inversión.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-accent">
            {payments.length} {payments.length === 1 ? 'recibo' : 'recibos'}
          </span>
          <span className="rounded-full bg-state-success-bg px-3 py-1 text-xs font-bold text-state-success">
            {fmt(total)}
          </span>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-accent">
            <ReceiptText className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-base font-bold text-text-primary">No hay recibos todavía</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Los recibos aparecerán aquí cuando se registre el primer pago.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border-soft">
          {payments.map((payment) => (
            <div
              className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center sm:px-7"
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
                    Período {payment.periodMonth}/{payment.periodYear}
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
                {fmt(payment.amount)}
              </span>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary-border px-4 text-sm font-bold text-primary-accent transition hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
                onClick={() => onOpenReceipt(payment)}
                type="button"
              >
                <Printer className="h-4 w-4" />
                Ver recibo
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
