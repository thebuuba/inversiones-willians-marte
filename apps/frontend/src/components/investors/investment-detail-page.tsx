'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Banknote, Plus } from 'lucide-react';
import { addInvestmentCapital, getInvestment } from '@/lib/api/investments';
import { formatDop } from '@/lib/currency';
import type { InvestorInvestmentDetail, InvestorInvestmentMovementItem } from '@inversiones/shared';
import { CapitalAdditionReceiptModal } from './capital-addition-receipt-modal';

const fmt = (n: number | string) => formatDop(n, { space: true });
const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

const statusLabels = {
  PAID: 'Al dia',
  PENDING: 'Pendiente',
  OVERDUE: 'Atrasada',
} as const;

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
  const [createdMovement, setCreatedMovement] = useState<InvestorInvestmentMovementItem | null>(null);
  const [previousCapital, setPreviousCapital] = useState(0);
  const [previousMonthlyPayment, setPreviousMonthlyPayment] = useState(0);

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
  const status = investment.paymentStatus ? statusLabels[investment.paymentStatus] : 'Pendiente';

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
    } catch {
      setError('No se pudo sumar el capital.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <div className="min-h-screen bg-page p-5 font-sans text-text-primary">
      <div className="mx-auto max-w-7xl">
        <Link className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-accent" href={investorHref}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al inversionista
        </Link>

        <div className="mb-6 rounded-panel border border-border-soft bg-card p-6 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary-accent">{investment.investor?.name}</p>
              <h1 className="mt-1 text-3xl font-bold">{investment.code}</h1>
              <p className="mt-2 text-sm text-text-muted">
                Inicio {investment.startDate ? fmtDate(investment.startDate) : '—'} · Plazo {investment.term ?? 'Indefinido'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-2 text-sm font-bold ${investment.paymentStatus === 'OVERDUE' ? 'bg-state-danger-bg text-state-danger' : investment.paymentStatus === 'PAID' ? 'bg-primary-soft text-primary-accent' : 'bg-state-warning-bg text-state-warning'}`}>
                {status}
              </span>
              <Link className="rounded-full bg-primary-accent px-5 py-2 text-sm font-bold text-white" href={`/inversionistas/pago?investmentId=${investment.id}`}>
                Registrar pago
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Summary label="Capital" value={fmt(investment.capital)} />
            <Summary label="Tasa" value={`${investment.rate}% mensual`} />
            <Summary label="Retorno mensual" value={fmt(investment.monthlyPayment)} />
            <Summary label="Proximo vencimiento" value={investment.nextDueDate ? fmtDate(investment.nextDueDate) : '—'} />
          </div>
        </div>

        <section className="mb-6 rounded-panel border border-border-soft bg-card p-6 shadow-card">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-control-comfortable bg-primary-soft">
              <Banknote className="h-5 w-5 text-primary-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sumar capital</h2>
              <p className="text-sm text-text-subtle">Aumenta esta inversion.</p>
            </div>
          </div>
          <form onSubmit={handleAddCapital} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-text-secondary">Monto</span>
              <input className="h-11 w-full rounded-control-comfortable border border-primary-border px-4 text-sm outline-none focus:border-primary-accent" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="100,000" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-text-secondary">Fecha</span>
              <input className="h-11 w-full rounded-control-comfortable border border-primary-border px-4 text-sm outline-none focus:border-primary-accent" type="date" value={movementDate} onChange={(event) => setMovementDate(event.target.value)} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-text-secondary">Nota</span>
              <textarea className="h-24 w-full resize-none rounded-control-comfortable border border-primary-border px-4 py-3 text-sm outline-none focus:border-primary-accent" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" />
            </label>
            {error && <p className="text-sm font-semibold text-state-danger">{error}</p>}
            <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-white disabled:opacity-60" disabled={saving} type="submit">
              <Plus className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Sumar capital'}
            </button>
          </form>
        </section>

        <div>
          <div className="mb-5 flex w-fit gap-1 rounded-panel bg-card p-1.5 shadow-card border border-border-soft">
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`rounded-control-comfortable px-5 py-2 text-sm font-semibold transition ${
                  tab === i ? 'bg-primary-accent text-white shadow-card' : 'text-text-muted hover:bg-primary-soft hover:text-primary-accent'
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
                    <div key={payment.id} className="flex items-center justify-between border-b border-border-soft pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-bold">Periodo {payment.periodMonth}/{payment.periodYear}</p>
                        <p className="text-xs text-text-subtle">{fmtDate(payment.paymentDate)}</p>
                      </div>
                      <span className="text-sm font-bold text-primary-accent">{fmt(payment.amount)}</span>
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
                    <div key={movement.id} className="flex items-center justify-between border-b border-border-soft pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-bold">Aporte de capital</p>
                        <p className="text-xs text-text-subtle">{fmtDate(movement.movementDate)}</p>
                        {movement.notes && <p className="mt-1 text-xs text-text-muted">{movement.notes}</p>}
                      </div>
                      <span className="text-sm font-bold text-primary-accent">{fmt(movement.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>

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
