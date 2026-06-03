'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Banknote, CalendarDays, CircleDollarSign, Plus, TrendingUp, WalletCards } from 'lucide-react';
import { getLoan, type LoanDetail } from '@/lib/api/loans';
import { createPayment } from '@/lib/api/payments';
import { invalidateCache, invalidateCachePrefix } from '@/lib/use-client-cache';
import { formatDop } from '@/lib/currency';
import { getLoanDetailTotals, getScheduleRemaining } from './loan-detail.helpers';
import { RegisterPaymentModal, type RegisterPaymentValues } from './register-payment-modal';

const fmt = (value: number | string) => formatDop(value, { decimals: 2, space: true });
const fmtDate = (value: string) => new Date(value).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

function getStatusLabel(status: string) {
  if (status === 'ACTIVE') return 'Activo';
  if (status === 'PAID') return 'Pagado';
  if (status === 'OVERDUE') return 'Vencido';
  if (status === 'PARTIAL') return 'Parcial';
  if (status === 'PENDING') return 'Pendiente';
  return status;
}

function StatusBadge({ status }: { status: string }) {
  const label = getStatusLabel(status);
  const tone = label === 'Pagado'
    ? 'bg-state-neutral-bg text-state-neutral'
    : label === 'Vencido'
      ? 'bg-state-danger-bg text-state-danger'
      : label === 'Pendiente' || label === 'Parcial'
        ? 'bg-state-warning-bg text-state-warning'
        : 'bg-state-success-bg text-state-success';

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{label}</span>;
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-5 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-accent">{icon}</div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.08em] text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-text-primary">{value}</p>
    </div>
  );
}

export function LoanDetailPage({ loanId }: { loanId: string }) {
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const loadLoan = useCallback(async () => {
    try {
      const nextLoan = await getLoan(loanId);
      setLoan(nextLoan);
      setLoadError(null);
    } catch {
      setLoadError('No se pudo cargar el detalle del préstamo.');
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    let active = true;

    getLoan(loanId)
      .then((nextLoan) => {
        if (!active) return;
        setLoan(nextLoan);
        setLoadError(null);
      })
      .catch(() => {
        if (active) setLoadError('No se pudo cargar el detalle del préstamo.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loanId]);

  const totals = useMemo(() => loan ? getLoanDetailTotals({
    principal: Number(loan.principal),
    balance: Number(loan.balance),
    totalAmount: Number(loan.totalAmount),
    term: loan.term,
    payments: loan.payments.map((payment) => ({ amount: Number(payment.amount) })),
    schedule: loan.schedule,
  }) : null, [loan]);

  async function handlePayment(values: RegisterPaymentValues) {
    if (!loan) return;
    setSaving(true);
    setPaymentError(null);
    try {
      await createPayment({ loanId: loan.id, clientId: loan.clientId, ...values });
      invalidateCachePrefix('loans:');
      invalidateCachePrefix('clients:');
      invalidateCache('dashboard');
      invalidateCache('portfolio');
      invalidateCache('monthlyCollections');
      invalidateCache('upcomingPayments');
      setModalOpen(false);
      await loadLoan();
    } catch {
      setPaymentError('No se pudo registrar el cobro. Verifica los datos e inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-page text-sm font-medium text-text-muted">Cargando préstamo...</main>;
  }

  if (!loan || !totals) {
    return (
      <main className="min-h-screen bg-page p-5">
        <div className="mx-auto max-w-[1480px] rounded-2xl border border-border-soft bg-white p-6 shadow-card">
          <p className="text-sm font-medium text-state-danger">{loadError ?? 'Préstamo no encontrado.'}</p>
          <Link className="mt-4 inline-flex text-sm font-bold text-primary-accent" href="/prestamos">Volver a préstamos</Link>
        </div>
      </main>
    );
  }

  const frequency = loan.paymentFreq === 'MONTHLY' ? 'Mensual' : loan.paymentFreq === 'DAILY' ? 'Diario' : loan.paymentFreq;

  return (
    <main className="min-h-screen bg-page p-5">
      <div className="mx-auto max-w-[1480px]">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-text-muted transition hover:text-primary-accent" href={`/clientes/${loan.clientId}`}>
          <ArrowLeft className="h-4 w-4" />
          Volver al cliente
        </Link>

        <header className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{loan.product?.name ?? 'Préstamo'}</h1>
              <StatusBadge status={loan.status} />
            </div>
            <p className="mt-2 text-sm font-medium text-text-muted">{loan.client.firstName} {loan.client.lastName} · {loan.term} cuotas · {frequency}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-text-subtle"><CalendarDays className="h-4 w-4" /> Inicio: {fmtDate(loan.startDate)}</p>
          </div>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white shadow-action transition hover:bg-primary-hover" onClick={() => { setPaymentError(null); setModalOpen(true); }} type="button">
            <Plus className="h-4 w-4" />
            Registrar cobro
          </button>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={<Banknote className="h-5 w-5" />} label="Capital" value={fmt(totals.principal)} />
          <SummaryCard icon={<WalletCards className="h-5 w-5" />} label="Saldo pendiente" value={fmt(totals.balance)} />
          <SummaryCard icon={<CircleDollarSign className="h-5 w-5" />} label="Total pagado" value={fmt(totals.totalPaid)} />
          <SummaryCard icon={<TrendingUp className="h-5 w-5" />} label="Cuota regular" value={fmt(totals.installment)} />
        </section>

        <section className="mt-5 rounded-2xl border border-border-soft bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-text-primary">Progreso de pago</h2>
              <p className="mt-1 text-sm font-medium text-text-muted">{totals.paidInstallments} de {totals.totalInstallments} cuotas pagadas</p>
            </div>
            <span className="text-xl font-bold text-primary-accent">{totals.progress}%</span>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-primary-accent" style={{ width: `${totals.progress}%` }} />
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-border-soft bg-white shadow-card">
          <div className="px-5 py-4">
            <h2 className="text-base font-bold text-text-primary">Calendario de cuotas</h2>
            <p className="mt-1 text-sm font-medium text-text-muted">Detalle de vencimientos y pagos aplicados.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left">
              <thead className="bg-surface-subtle text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
                <tr>
                  <th className="px-5 py-3">Cuota</th>
                  <th className="px-5 py-3">Vencimiento</th>
                  <th className="px-5 py-3">Monto</th>
                  <th className="px-5 py-3">Pagado</th>
                  <th className="px-5 py-3">Pendiente</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {loan.schedule.map((row, index) => {
                  const amount = Number(row.amount);
                  const paidAmount = Number(row.paidAmount ?? 0);
                  return (
                    <tr className="border-t border-border-soft text-sm font-medium text-text-secondary" key={row.id}>
                      <td className="px-5 py-4 font-bold text-text-primary">#{index + 1}</td>
                      <td className="px-5 py-4">{fmtDate(row.dueDate)}</td>
                      <td className="px-5 py-4">{fmt(amount)}</td>
                      <td className="px-5 py-4">{fmt(paidAmount)}</td>
                      <td className="px-5 py-4">{fmt(getScheduleRemaining(amount, paidAmount))}</td>
                      <td className="px-5 py-4"><StatusBadge status={row.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modalOpen ? <RegisterPaymentModal error={paymentError} isOpen onClose={() => setModalOpen(false)} onSubmit={handlePayment} saving={saving} /> : null}
    </main>
  );
}
