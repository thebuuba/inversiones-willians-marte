'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Info,
  Plus,
  WalletCards,
} from 'lucide-react';
import { addLoanCapital, getLoan, getPayoffQuote, type LoanDetail } from '@/lib/api/loans';
import { invalidateCachePrefix } from '@/lib/use-client-cache';
import { formatDop } from '@/lib/currency';
import {
  getLoanDetailTotals,
  getLoanOperationalSummary,
  getScheduleDisplayStatus,
  getScheduleRemaining,
} from './loan-detail.helpers';
import { getLoanTitle } from './loan-title';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import type { LoanPayoffQuote } from '@inversiones/shared';
import { CollectionManagementPanel } from './collection-management-panel';

const fmt = (value: number | string) => formatDop(value, { decimals: 2, space: true });
const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
const empty = '—';
const today = () => new Date().toISOString().slice(0, 10);

function getStatusLabel(status: string) {
  if (status === 'ACTIVE') return 'Activo';
  if (status === 'PAID') return 'Pagado';
  if (status === 'OVERDUE') return 'Vencido';
  if (status === 'PARTIAL') return 'Parcial';
  if (status === 'PENDING') return 'Pendiente';
  return status;
}

function StatusBadge({ status, dueDate }: { status: string; dueDate?: string }) {
  const label = dueDate ? getScheduleDisplayStatus(status, dueDate) : getStatusLabel(status);
  const tone =
    label === 'Pagado' || label === 'Cancelado'
      ? 'bg-state-neutral-bg text-state-neutral'
      : label === 'Vencido' || label === 'Atrasado'
        ? 'bg-state-danger-bg text-state-danger'
        : label === 'Pendiente' || label === 'Parcial'
          ? 'bg-state-warning-bg text-state-warning'
          : 'bg-state-success-bg text-state-success';

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{label}</span>
  );
}

const summaryTones = {
  warning: {
    icon: 'bg-[#FCE6E4] text-[#B8322D]',
    value: 'text-[#B63B0B]',
  },
  paid: {
    icon: 'bg-[#dbeafe] text-state-info',
    value: 'text-[#1E4E9A]',
  },
  quota: {
    icon: 'bg-[#FFF2CC] text-state-warning',
    value: 'text-[#6F5310]',
  },
} as const;

type SummaryTone = keyof typeof summaryTones;

function SummaryCard({
  icon,
  label,
  tone,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  tone: SummaryTone;
  value: string;
}) {
  const classes = summaryTones[tone];

  return (
    <div className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${classes.icon}`}>
        {icon}
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">{label}</p>
      <p className={`mt-1 text-xl font-bold ${classes.value}`}>{value}</p>
    </div>
  );
}

function DataRow({
  label,
  tone = 'text-text-primary',
  value,
}: {
  label: string;
  tone?: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-soft py-2.5 last:border-b-0">
      <span className="text-sm font-semibold text-text-secondary">{label}</span>
      <span className={`text-right text-sm font-bold ${tone}`}>{value}</span>
    </div>
  );
}

function InfoPanel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-border-soft bg-[#FBFCFB] px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary-accent">
          {icon}
        </div>
        <h2 className="text-base font-bold text-text-primary">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function LoanDetailPage({ loanId }: { loanId: string }) {
  const searchParams = useSearchParams();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [payoffDate, setPayoffDate] = useState(today);
  const [payoffQuote, setPayoffQuote] = useState<LoanPayoffQuote | null>(null);
  const [capitalAmount, setCapitalAmount] = useState('');
  const [capitalDate, setCapitalDate] = useState(today);
  const [capitalNotes, setCapitalNotes] = useState('');
  const [capitalError, setCapitalError] = useState<string | null>(null);
  const [capitalSaving, setCapitalSaving] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(searchParams.get('agreement') === '1');

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

  useEffect(() => {
    if (!loan || loan.status !== 'ACTIVE') return;
    let active = true;
    getPayoffQuote(loan.id, payoffDate)
      .then((quote) => {
        if (active) setPayoffQuote(quote);
      })
      .catch(() => {
        if (active) setPayoffQuote(null);
      });
    return () => {
      active = false;
    };
  }, [loan, payoffDate]);

  const totals = useMemo(
    () =>
      loan
        ? getLoanDetailTotals({
            principal: Number(loan.principal),
            balance: Number(loan.balance),
            totalAmount: Number(loan.totalAmount),
            term: loan.term,
            payments: loan.payments.map((payment) => ({ amount: Number(payment.amount) })),
            schedule: loan.schedule,
          })
        : null,
    [loan],
  );

  const operational = useMemo(
    () =>
      loan
        ? getLoanOperationalSummary({
            schedule: loan.schedule,
            payments: loan.payments,
            lateFees: loan.lateFees ?? [],
          })
        : null,
    [loan],
  );

  async function handleAddCapital() {
    if (!loan) return;
    const amount = Number(capitalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setCapitalError('Ingresa un monto válido.');
      return;
    }
    setCapitalSaving(true);
    setCapitalError(null);
    try {
      await addLoanCapital(loan.id, {
        amount,
        effectiveDate: capitalDate,
        notes: capitalNotes.trim() || undefined,
      });
      invalidateCachePrefix('loans:');
      invalidateCachePrefix('clients:');
      setCapitalAmount('');
      setCapitalNotes('');
      await loadLoan();
    } catch {
      setCapitalError('No se pudo agregar capital a este préstamo.');
    } finally {
      setCapitalSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page text-sm font-medium text-text-muted">
        Cargando préstamo...
      </main>
    );
  }

  if (!loan || !totals || !operational) {
    return (
      <main className="min-h-screen bg-page p-5">
        <div className="mx-auto max-w-[1480px] rounded-2xl border border-border-soft bg-white p-6 shadow-card">
          <p className="text-sm font-medium text-state-danger">
            {loadError ?? 'Préstamo no encontrado.'}
          </p>
          <Link
            className="mt-4 inline-flex text-sm font-bold text-primary-accent"
            href="/prestamos"
          >
            Volver a préstamos
          </Link>
        </div>
      </main>
    );
  }

  const frequency =
    loan.paymentFreq === 'MONTHLY'
      ? 'Mensual'
      : loan.paymentFreq === 'DAILY'
        ? 'Diario'
        : loan.paymentFreq;
  const interestType =
    loan.interestType === 'INDEFINITE'
      ? 'Indefinido'
      : loan.interestType === 'REDUCING'
        ? 'Reducing'
        : loan.interestType === 'FLAT'
          ? 'Simple'
          : loan.interestType;
  const nextSchedule = operational.nextSchedule;
  const lastPayment = operational.lastPayment;

  return (
    <main className="min-h-screen bg-page p-5">
      <div className="mx-auto max-w-[1480px]">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-text-secondary transition hover:text-primary-accent"
          href={`/clientes/${loan.clientId}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al cliente
        </Link>

        <header className="mt-5 overflow-hidden rounded-3xl border border-border-soft bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 px-8 py-6 md:flex-row md:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">{getLoanTitle(loan)}</h1>
                <StatusBadge status={loan.status} />
                <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-accent">
                  {totals.paidInstallments}/{totals.totalInstallments} cuotas pagadas
                </span>
                <span className="inline-flex rounded-full bg-state-neutral-bg px-3 py-1 text-xs font-bold text-text-secondary">
                  #{loan.loanNumber}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-text-secondary">
                {loan.client.firstName} {loan.client.lastName} · {frequency}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary-accent">
                <CalendarDays className="h-4 w-4" /> Inicio: {fmtDate(loan.startDate)}
              </p>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.22)] transition hover:-translate-y-0.5 hover:bg-primary"
              href={`/prestamos/cobrar?loanId=${loan.id}`}
            >
              <Plus className="h-4 w-4" />
              Registrar cobro
            </Link>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<WalletCards className="h-5 w-5" />}
            label="Saldo pendiente"
            tone="warning"
            value={fmt(totals.balance)}
          />
          <SummaryCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Próxima cuota"
            tone="quota"
            value={fmt(operational.nextSchedulePending)}
          />
          <SummaryCard
            icon={<CircleDollarSign className="h-5 w-5" />}
            label="Total pagado"
            tone="paid"
            value={fmt(totals.totalPaid)}
          />
        </section>

        <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <CollectionManagementPanel
              agreementOpen={agreementOpen}
              altPhone={loan.client.altPhone}
              loanId={loan.id}
              onAgreementClose={() => setAgreementOpen(false)}
              phone={loan.client.phone}
            />

            <section className="rounded-2xl border border-border-soft bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary">
                    {loan.interestType === 'INDEFINITE' ? 'Cobros de interés' : 'Progreso de pago'}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-text-secondary">
                    {loan.interestType === 'INDEFINITE'
                      ? `${totals.paidInstallments} cobros registrados · capital activo`
                      : `${totals.paidInstallments} de ${totals.totalInstallments} cuotas pagadas`}
                  </p>
                </div>
                <span className="text-xl font-bold text-primary-accent">
                  {loan.interestType === 'INDEFINITE' ? 'Indefinido' : `${totals.progress}%`}
                </span>
              </div>
              {loan.interestType !== 'INDEFINITE' ? (
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-border-soft">
                  <div
                    className="h-full rounded-full bg-primary-accent"
                    style={{ width: `${totals.progress}%` }}
                  />
                </div>
              ) : null}
            </section>

            <section
              className="scroll-mt-5 overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm"
              id="calendario-cuotas"
            >
              <div className="border-b border-border-soft px-5 py-4">
                <h2 className="text-base font-bold text-text-primary">Calendario de cuotas</h2>
                <p className="mt-1 text-sm font-medium text-text-secondary">
                  Detalle de vencimientos y pagos aplicados.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-left">
                  <thead className="bg-[#FBFCFB] text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">
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
                        <tr
                          className="border-t border-border-soft text-sm font-medium text-[#3F4542]"
                          key={row.id}
                        >
                          <td className="px-5 py-4 font-bold text-text-primary">#{index + 1}</td>
                          <td className="px-5 py-4">{fmtDate(row.dueDate)}</td>
                          <td className="px-5 py-4">{fmt(amount)}</td>
                          <td className="px-5 py-4">{fmt(paidAmount)}</td>
                          <td className="px-5 py-4">
                            {fmt(getScheduleRemaining(amount, paidAmount))}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge dueDate={row.dueDate} status={row.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              className="scroll-mt-5 overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm"
              id="recibos-pagos"
            >
              <div className="border-b border-border-soft px-5 py-4">
                <h2 className="text-base font-bold text-text-primary">Recibos y pagos</h2>
                <p className="mt-1 text-sm font-medium text-text-secondary">
                  Historial de cobros registrados en este préstamo.
                </p>
              </div>
              {loan.payments.length ? (
                <div className="divide-y divide-border-soft">
                  {loan.payments.map((payment) => (
                    <article
                      className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center"
                      key={payment.id}
                    >
                      <div>
                        <p className="text-sm font-bold text-text-primary">
                          Recibo {payment.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-[#7A7F7D]">
                          {fmtDate(payment.paymentDate)} · {payment.paymentMethod ?? 'Sin método'}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-text-secondary">
                        Recibido por {payment.receivedBy?.name ?? '—'}
                      </p>
                      <p className="text-base font-bold tabular-nums text-primary-accent">
                        {fmt(payment.amount)}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-8 text-center text-sm font-medium text-[#7A7F7D]">
                  Todavía no hay pagos registrados.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <div className="scroll-mt-5" id="saldo-anticipado">
              <InfoPanel icon={<CircleDollarSign className="h-5 w-5" />} title="Saldo anticipado">
                <label className="mb-3 block">
                  <span className="mb-2 block text-sm font-semibold text-text-secondary">
                    Fecha de saldo
                  </span>
                  <DatePickerInput
                    className="h-10 w-full rounded-xl border border-primary-border bg-white px-3 text-sm font-bold text-text-primary outline-none"
                    onChange={setPayoffDate}
                    value={payoffDate}
                  />
                </label>
                <DataRow
                  label="Capital pendiente"
                  tone="text-text-primary"
                  value={payoffQuote ? fmt(payoffQuote.capitalOutstanding) : empty}
                />
                <DataRow
                  label="Interés generado"
                  tone="text-[#B63B0B]"
                  value={payoffQuote ? fmt(payoffQuote.earnedInterest) : empty}
                />
                <DataRow
                  label="Interés futuro descontado"
                  tone="text-primary-accent"
                  value={payoffQuote ? fmt(payoffQuote.unearnedInterestDiscount) : empty}
                />
                <DataRow label="Días generados" value={payoffQuote?.daysGenerated ?? empty} />
                <DataRow
                  label="Interés diario"
                  value={payoffQuote ? fmt(payoffQuote.dailyInterest) : empty}
                />
                <DataRow label="Mora/cargos" value={payoffQuote ? fmt(payoffQuote.fees) : empty} />
                <DataRow
                  label="Total para saldar"
                  tone="text-[#111827]"
                  value={payoffQuote ? fmt(payoffQuote.totalToPay) : empty}
                />
              </InfoPanel>
            </div>

            {loan.interestType === 'INDEFINITE' && loan.status === 'ACTIVE' ? (
              <InfoPanel icon={<Plus className="h-5 w-5" />} title="Agregar capital">
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-text-secondary">Monto</span>
                    <input
                      className="h-10 w-full rounded-xl border border-primary-border bg-white px-3 text-sm font-bold text-text-primary outline-none"
                      inputMode="decimal"
                      onChange={(event) => setCapitalAmount(event.target.value)}
                      placeholder="0.00"
                      value={capitalAmount}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-text-secondary">
                      Fecha efectiva
                    </span>
                    <DatePickerInput
                      className="h-10 w-full rounded-xl border border-primary-border bg-white px-3 text-sm font-bold text-text-primary outline-none"
                      onChange={setCapitalDate}
                      value={capitalDate}
                    />
                  </label>
                  <textarea
                    className="h-20 w-full resize-none rounded-xl border border-primary-border bg-white px-3 py-2 text-sm font-medium text-text-primary outline-none"
                    onChange={(event) => setCapitalNotes(event.target.value)}
                    placeholder="Notas"
                    value={capitalNotes}
                  />
                  {capitalError ? (
                    <p className="text-sm font-semibold text-state-danger">{capitalError}</p>
                  ) : null}
                  <button
                    className="h-10 w-full rounded-full bg-primary-accent text-sm font-bold text-white disabled:opacity-60"
                    disabled={capitalSaving}
                    onClick={handleAddCapital}
                    type="button"
                  >
                    {capitalSaving ? 'Guardando...' : 'Agregar capital'}
                  </button>
                </div>
              </InfoPanel>
            ) : null}

            <InfoPanel icon={<ClipboardList className="h-5 w-5" />} title="Próxima cuota">
              <DataRow
                label="Vencimiento"
                value={nextSchedule ? fmtDate(nextSchedule.dueDate) : empty}
              />
              <DataRow label="Monto" value={nextSchedule ? fmt(nextSchedule.amount) : empty} />
              <DataRow
                label="Pagado"
                value={nextSchedule ? fmt(nextSchedule.paidAmount ?? 0) : empty}
              />
              <DataRow
                label="Pendiente"
                tone="text-[#B63B0B]"
                value={fmt(operational.nextSchedulePending)}
              />
              <DataRow
                label="Estado"
                value={
                  nextSchedule ? (
                    <StatusBadge dueDate={nextSchedule.dueDate} status={nextSchedule.status} />
                  ) : (
                    empty
                  )
                }
              />
            </InfoPanel>

            <InfoPanel icon={<AlertCircle className="h-5 w-5" />} title="Pendiente">
              <DataRow label="Saldo total" tone="text-[#B63B0B]" value={fmt(totals.balance)} />
              <DataRow label="Cuotas vencidas" value={operational.overdueInstallments} />
              <DataRow label="Cuotas pendientes" value={operational.pendingInstallments} />
              <DataRow
                label="Mora existente"
                tone="text-state-danger"
                value={fmt(operational.unpaidLateFees)}
              />
            </InfoPanel>

            <InfoPanel icon={<CheckCircle2 className="h-5 w-5" />} title="Último pago">
              <DataRow label="Total pagado" tone="text-[#1E4E9A]" value={fmt(totals.totalPaid)} />
              <DataRow label="Último pago" value={lastPayment ? fmt(lastPayment.amount) : empty} />
              <DataRow
                label="Fecha"
                value={lastPayment ? fmtDate(lastPayment.paymentDate) : empty}
              />
              <DataRow label="Recibido por" value={lastPayment?.receivedBy?.name ?? empty} />
            </InfoPanel>

            <InfoPanel icon={<Info className="h-5 w-5" />} title="Detalles">
              <DataRow label="Capital" value={fmt(totals.principal)} />
              <DataRow label="Cuota regular" value={fmt(totals.installment)} />
              <DataRow label="Producto" value={loan.product?.name ?? empty} />
              <DataRow label="Tipo" value={interestType} />
              <DataRow label="Tasa" value={`${Number(loan.interestRate)}%`} />
              <DataRow
                label="Fecha final"
                value={
                  loan.interestType === 'INDEFINITE'
                    ? 'Indefinido'
                    : loan.endDate
                      ? fmtDate(loan.endDate)
                      : empty
                }
              />
              <DataRow label="Creado por" value={loan.createdBy?.name ?? empty} />
              <DataRow label="Cartera" value={loan.portfolio?.name ?? empty} />
            </InfoPanel>
          </aside>
        </section>
      </div>
    </main>
  );
}
