'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, CircleDollarSign, ClipboardList, Info, Plus, WalletCards } from 'lucide-react';
import { getLoan, type LoanDetail } from '@/lib/api/loans';
import { createPayment } from '@/lib/api/payments';
import { invalidateCache, invalidateCachePrefix } from '@/lib/use-client-cache';
import { formatDop } from '@/lib/currency';
import { getLoanDetailTotals, getLoanOperationalSummary, getScheduleRemaining } from './loan-detail.helpers';
import { getLoanTitle } from './loan-title';
import { RegisterPaymentModal, type RegisterPaymentValues } from './register-payment-modal';

const fmt = (value: number | string) => formatDop(value, { decimals: 2, space: true });
const fmtDate = (value: string) => new Date(value).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
const empty = '—';

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

const summaryTones = {
  warning: {
    icon: 'bg-[#FCE6E4] text-[#B8322D]',
    value: 'text-[#B63B0B]',
  },
  paid: {
    icon: 'bg-[#dbeafe] text-[#2563eb]',
    value: 'text-[#1E4E9A]',
  },
  quota: {
    icon: 'bg-[#FFF2CC] text-[#A67812]',
    value: 'text-[#6F5310]',
  },
} as const;

type SummaryTone = keyof typeof summaryTones;

function SummaryCard({ icon, label, tone, value }: { icon: React.ReactNode; label: string; tone: SummaryTone; value: string }) {
  const classes = summaryTones[tone];

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${classes.icon}`}>{icon}</div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.08em] text-[#9B9F9D]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${classes.value}`}>{value}</p>
    </div>
  );
}

function DataRow({ label, tone = 'text-text-primary', value }: { label: string; tone?: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EDF2EF] py-2.5 last:border-b-0">
      <span className="text-sm font-semibold text-[#7A8A80]">{label}</span>
      <span className={`text-right text-sm font-bold ${tone}`}>{value}</span>
    </div>
  );
}

function InfoPanel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#EDF2EF] bg-[#FBFCFB] px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf5ed] text-[#5a9a7a]">{icon}</div>
        <h2 className="text-base font-bold text-[#173D2C]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
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

  const operational = useMemo(() => loan ? getLoanOperationalSummary({
    schedule: loan.schedule,
    payments: loan.payments,
    lateFees: loan.lateFees ?? [],
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

  if (!loan || !totals || !operational) {
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
  const interestType = loan.interestType === 'INDEFINITE' ? 'Indefinido' : loan.interestType === 'REDUCING' ? 'Reducing' : loan.interestType === 'FLAT' ? 'Simple' : loan.interestType;
  const nextSchedule = operational.nextSchedule;
  const lastPayment = operational.lastPayment;

  return (
    <main className="min-h-screen bg-page p-5">
      <div className="mx-auto max-w-[1480px]">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#7A8A80] transition hover:text-[#5a9a7a]" href={`/clientes/${loan.clientId}`}>
          <ArrowLeft className="h-4 w-4" />
          Volver al cliente
        </Link>

        <header className="mt-5 overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 px-8 py-6 md:flex-row md:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-neutral-900">{getLoanTitle(loan)}</h1>
                <StatusBadge status={loan.status} />
                <span className="inline-flex rounded-full bg-[#eaf5ed] px-3 py-1 text-xs font-bold text-[#5a9a7a]">{totals.paidInstallments}/{totals.totalInstallments} cuotas pagadas</span>
                <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">#{loan.loanNumber}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#7A8A80]">{loan.client.firstName} {loan.client.lastName} · {frequency}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#eaf5ed] px-3 py-1 text-sm font-bold text-[#5a9a7a]"><CalendarDays className="h-4 w-4" /> Inicio: {fmtDate(loan.startDate)}</p>
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#5a9a7a] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.22)] transition hover:-translate-y-0.5 hover:bg-[#4a866a]" onClick={() => { setPaymentError(null); setModalOpen(true); }} type="button">
              <Plus className="h-4 w-4" />
              Registrar cobro
            </button>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard icon={<WalletCards className="h-5 w-5" />} label="Saldo pendiente" tone="warning" value={fmt(totals.balance)} />
          <SummaryCard icon={<CalendarDays className="h-5 w-5" />} label="Próxima cuota" tone="quota" value={fmt(operational.nextSchedulePending)} />
          <SummaryCard icon={<CircleDollarSign className="h-5 w-5" />} label="Total pagado" tone="paid" value={fmt(totals.totalPaid)} />
        </section>

        <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[#173D2C]">Progreso de pago</h2>
                  <p className="mt-1 text-sm font-medium text-[#7A8A80]">{totals.paidInstallments} de {totals.totalInstallments} cuotas pagadas</p>
                </div>
                <span className="text-xl font-bold text-[#5a9a7a]">{totals.progress}%</span>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#EDF2EF]">
                <div className="h-full rounded-full bg-[#5a9a7a]" style={{ width: `${totals.progress}%` }} />
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
              <div className="border-b border-[#EDF2EF] px-5 py-4">
                <h2 className="text-base font-bold text-[#173D2C]">Calendario de cuotas</h2>
                <p className="mt-1 text-sm font-medium text-[#7A8A80]">Detalle de vencimientos y pagos aplicados.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-left">
                  <thead className="bg-[#FBFCFB] text-xs font-bold uppercase tracking-[0.08em] text-[#7A8A80]">
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
                        <tr className="border-t border-[#EDF2EF] text-sm font-medium text-[#3F4542]" key={row.id}>
                          <td className="px-5 py-4 font-bold text-[#173D2C]">#{index + 1}</td>
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

          <aside className="space-y-4">
            <InfoPanel icon={<ClipboardList className="h-5 w-5" />} title="Próxima cuota">
              <DataRow label="Vencimiento" value={nextSchedule ? fmtDate(nextSchedule.dueDate) : empty} />
              <DataRow label="Monto" value={nextSchedule ? fmt(nextSchedule.amount) : empty} />
              <DataRow label="Pagado" value={nextSchedule ? fmt(nextSchedule.paidAmount ?? 0) : empty} />
              <DataRow label="Pendiente" tone="text-[#B63B0B]" value={fmt(operational.nextSchedulePending)} />
              <DataRow label="Estado" value={nextSchedule ? <StatusBadge status={nextSchedule.status} /> : empty} />
            </InfoPanel>

            <InfoPanel icon={<AlertCircle className="h-5 w-5" />} title="Pendiente">
              <DataRow label="Saldo total" tone="text-[#B63B0B]" value={fmt(totals.balance)} />
              <DataRow label="Cuotas vencidas" value={operational.overdueInstallments} />
              <DataRow label="Cuotas pendientes" value={operational.pendingInstallments} />
              <DataRow label="Mora existente" tone="text-state-danger" value={fmt(operational.unpaidLateFees)} />
            </InfoPanel>

            <InfoPanel icon={<CheckCircle2 className="h-5 w-5" />} title="Último pago">
              <DataRow label="Total pagado" tone="text-[#1E4E9A]" value={fmt(totals.totalPaid)} />
              <DataRow label="Último pago" value={lastPayment ? fmt(lastPayment.amount) : empty} />
              <DataRow label="Fecha" value={lastPayment ? fmtDate(lastPayment.paymentDate) : empty} />
              <DataRow label="Recibido por" value={lastPayment?.receivedBy?.name ?? empty} />
            </InfoPanel>

            <InfoPanel icon={<Info className="h-5 w-5" />} title="Detalles">
              <DataRow label="Capital" value={fmt(totals.principal)} />
              <DataRow label="Cuota regular" value={fmt(totals.installment)} />
              <DataRow label="Producto" value={loan.product?.name ?? empty} />
              <DataRow label="Tipo" value={interestType} />
              <DataRow label="Tasa" value={`${Number(loan.interestRate)}%`} />
              <DataRow label="Fecha final" value={loan.endDate ? fmtDate(loan.endDate) : empty} />
              <DataRow label="Creado por" value={loan.createdBy?.name ?? empty} />
              <DataRow label="Cartera" value={loan.portfolio?.name ?? empty} />
            </InfoPanel>
          </aside>
        </section>
      </div>

      {modalOpen ? <RegisterPaymentModal error={paymentError} isOpen onClose={() => setModalOpen(false)} onSubmit={handlePayment} saving={saving} /> : null}
    </main>
  );
}
