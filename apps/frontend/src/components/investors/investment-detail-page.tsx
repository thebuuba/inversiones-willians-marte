'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Banknote, ChevronDown, Plus, Printer, X } from 'lucide-react';
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

const TABS = ['Historial de pagos', 'Movimientos de capital'];

export function InvestmentDetailPage({ investmentId }: { investmentId: string }) {
  const [tab, setTab] = useState(0);
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
  const statusVisual =
    investmentPaymentStatusVisuals[investment.paymentStatus ?? 'SCHEDULED'];

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
      <div className="min-h-screen bg-page p-5 font-sans text-text-primary">
        <div className="w-full">
          <Link
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-accent"
            href={investorHref}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al inversionista
          </Link>

          <div className="mb-6 rounded-panel border border-border-soft bg-card p-6 shadow-card">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary-accent">
                  {investment.investor?.name}
                </p>
                <h1 className="mt-1 text-3xl font-bold">{investment.code}</h1>
                <p className="mt-2 text-sm text-text-muted">
                  Inicio {investment.startDate ? fmtDate(investment.startDate) : '—'} · Plazo{' '}
                  {investment.term ?? 'Indefinido'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-2 text-sm font-bold ${statusVisual.className}`}
                >
                  {statusVisual.label}
                </span>
                <details className="relative">
                  <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-white">
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

            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Summary label="Capital" value={fmt(investment.capital)} />
              <Summary label="Tasa" value={`${investment.rate}% mensual`} />
              <Summary label="Retorno mensual" value={fmt(investment.monthlyPayment)} />
              <Summary
                label="Proximo vencimiento"
                value={investment.nextDueDate ? fmtDate(investment.nextDueDate) : '—'}
              />
            </div>
          </div>

          <div>
            <div className="scrollbar-none mb-5 flex w-full gap-1 overflow-x-auto rounded-panel border border-border-soft bg-card p-1.5 shadow-card sm:w-fit">
              {TABS.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setTab(i)}
                  className={`min-h-11 shrink-0 rounded-control-comfortable px-5 py-2 text-sm font-semibold transition ${
                    tab === i
                      ? 'bg-primary-accent text-white shadow-card'
                      : 'text-text-muted hover:bg-primary-soft hover:text-primary-accent'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === 0 && (
              <section className="rounded-panel border border-border-soft bg-card p-6 shadow-card">
                <h2 className="mb-4 text-lg font-bold">Historial de pagos</h2>
                {(investment.payments ?? []).length === 0 ? (
                  <p className="text-sm text-text-subtle">No hay pagos registrados.</p>
                ) : (
                  <div className="space-y-3">
                    {(investment.payments ?? []).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-3 border-b border-border-soft pb-3 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-bold">
                            Periodo {payment.periodMonth}/{payment.periodYear}
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
              </section>
            )}

            {tab === 1 && (
              <section className="rounded-panel border border-border-soft bg-card p-6 shadow-card">
                <h2 className="mb-4 text-lg font-bold">Movimientos de capital</h2>
                {(investment.movements ?? []).length === 0 ? (
                  <p className="text-sm text-text-subtle">No hay movimientos registrados.</p>
                ) : (
                  <div className="space-y-3">
                    {(investment.movements ?? []).map((movement) => (
                      <div
                        key={movement.id}
                        className="flex items-center justify-between border-b border-border-soft pb-3 last:border-0"
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
              </section>
            )}
          </div>
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
    <div className="rounded-control-comfortable bg-surface-subtle p-4">
      <p className="text-xs text-text-subtle">{label}</p>
      <p className="mt-1 text-base font-bold text-text-primary">{value}</p>
    </div>
  );
}
