'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Banknote, Plus } from 'lucide-react';
import { addInvestmentCapital, getInvestment } from '@/lib/api/investments';
import { formatDop } from '@/lib/currency';
import type { InvestorInvestmentDetail } from '@inversiones/shared';

const fmt = (n: number | string) => formatDop(n, { space: true });
const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

const statusLabels = {
  PAID: 'Al dia',
  PENDING: 'Pendiente',
  OVERDUE: 'Atrasada',
} as const;

export function InvestmentDetailPage({ investmentId }: { investmentId: string }) {
  const [investment, setInvestment] = useState<InvestorInvestmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [movementDate, setMovementDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInvestment(investmentId)
      .then(setInvestment)
      .catch(() => setInvestment(null))
      .finally(() => setLoading(false));
  }, [investmentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] font-sans">
        <p className="text-sm text-neutral-400">Cargando inversion...</p>
      </div>
    );
  }

  if (!investment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] font-sans">
        <p className="text-sm text-neutral-400">Inversion no encontrada.</p>
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
      const updated = await addInvestmentCapital(investmentId, {
        amount: amountNumber,
        movementDate,
        notes: notes.trim() || undefined,
      });
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
    <div className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <Link className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2f7654]" href={investorHref}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al inversionista
        </Link>

        <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#2f7654]">{investment.investor?.name}</p>
              <h1 className="mt-1 text-3xl font-bold">{investment.code}</h1>
              <p className="mt-2 text-sm text-neutral-500">
                Inicio {investment.startDate ? fmtDate(investment.startDate) : '—'} · Plazo {investment.term ?? 'Indefinido'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-2 text-sm font-bold ${investment.paymentStatus === 'OVERDUE' ? 'bg-[#fff1e8] text-[#9f3f25]' : investment.paymentStatus === 'PAID' ? 'bg-[#eaf5ed] text-[#2f7654]' : 'bg-[#fef3c7] text-[#7a5a0a]'}`}>
                {status}
              </span>
              <Link className="rounded-full bg-[#2f7654] px-5 py-2 text-sm font-bold text-white" href={`/inversionistas/pago?investmentId=${investment.id}`}>
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

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">Historial de pagos</h2>
              {(investment.payments ?? []).length === 0 ? (
                <p className="text-sm text-neutral-400">No hay pagos registrados.</p>
              ) : (
                <div className="space-y-3">
                  {(investment.payments ?? []).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-bold">Periodo {payment.periodMonth}/{payment.periodYear}</p>
                        <p className="text-xs text-neutral-400">{fmtDate(payment.paymentDate)}</p>
                      </div>
                      <span className="text-sm font-bold text-[#2f7654]">{fmt(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">Movimientos de capital</h2>
              {(investment.movements ?? []).length === 0 ? (
                <p className="text-sm text-neutral-400">No hay movimientos registrados.</p>
              ) : (
                <div className="space-y-3">
                  {(investment.movements ?? []).map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-bold">Aporte de capital</p>
                        <p className="text-xs text-neutral-400">{fmtDate(movement.movementDate)}</p>
                        {movement.notes && <p className="mt-1 text-xs text-neutral-500">{movement.notes}</p>}
                      </div>
                      <span className="text-sm font-bold text-[#2f7654]">{fmt(movement.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf5ed]">
                <Banknote className="h-5 w-5 text-[#2f7654]" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Sumar capital</h2>
                <p className="text-sm text-neutral-400">Aumenta esta inversion.</p>
              </div>
            </div>
            <form onSubmit={handleAddCapital} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-neutral-600">Monto</span>
                <input className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-[#2f7654]" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="100,000" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-neutral-600">Fecha</span>
                <input className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-[#2f7654]" type="date" value={movementDate} onChange={(event) => setMovementDate(event.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-neutral-600">Nota</span>
                <textarea className="h-24 w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#2f7654]" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" />
              </label>
              {error && <p className="text-sm font-semibold text-[#9f3f25]">{error}</p>}
              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2f7654] px-5 text-sm font-bold text-white disabled:opacity-60" disabled={saving} type="submit">
                <Plus className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Sumar capital'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#fafafa] p-4">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-1 text-base font-bold text-neutral-900">{value}</p>
    </div>
  );
}
