'use client';

import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { getDashboardOverview } from '@/lib/api/dashboard';
import { useClientCache } from '@/lib/use-client-cache';
import { formatDop } from '@/lib/currency';

export default function ReportesPage() {
  const { data: overview, loading } = useClientCache(
    'dashboard-overview',
    getDashboardOverview,
    60_000,
  );
  const aging = overview?.overdueAging ?? [];
  const overdue = aging.reduce((sum, bucket) => sum + bucket.amount, 0);
  const income = overview?.dailyIncome ?? [];
  const collected = income.reduce((sum, day) => sum + day.capital + day.interest + day.lateFee, 0);
  const money = (value: number) => formatDop(value, { decimals: 2 });

  return (
    <main className="min-h-screen bg-page px-5 py-8 text-text-primary lg:px-8">
      <div className="print:hidden">
        <Link
          href="/inicio"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Inicio
        </Link>
      </div>
      <header className="my-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes de cartera</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Resumen actual y movimientos de los últimos 30 días.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white print:hidden"
        >
          <Printer className="h-4 w-4" />
          Imprimir reporte
        </button>
      </header>
      {loading && !overview ? (
        <p className="text-text-secondary">Cargando reporte...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Saldo cartera', overview?.dashboard.portfolioBalance ?? 0],
              ['Cobrado hoy', overview?.dashboard.collectionsToday ?? 0],
              ['Total vencido', overdue],
              ['Ingresos últimos 30 días', collected],
            ].map(([label, value]) => (
              <section
                key={label as string}
                className="rounded-[22px] border border-border-soft bg-card p-5 shadow-card"
              >
                <p className="text-sm text-text-secondary">{label}</p>
                <strong className="mt-2 block text-xl">{money(Number(value))}</strong>
              </section>
            ))}
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="rounded-[22px] border border-border-soft bg-card p-6 shadow-card">
              <h2 className="mb-4 font-bold">Estado de cartera</h2>
              <div className="divide-y divide-border-soft">
                {overview?.portfolio.map((group) => (
                  <div key={group.status} className="flex justify-between py-2 text-sm">
                    <span>
                      {(
                        {
                          CURRENT: 'A tiempo',
                          PENDING: 'Pendientes',
                          LATE: 'Atrasados',
                          EXPIRED: 'Vencidos',
                          PAID: 'Pagados',
                          WRITTEN_OFF: 'Castigados',
                        } as Record<string, string>
                      )[group.status] ?? group.status}
                    </span>
                    <strong>
                      {group.count} · {money(group.balance)}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-[22px] border border-border-soft bg-card p-6 shadow-card">
              <h2 className="mb-4 font-bold">Mora por antigüedad</h2>
              <div className="divide-y divide-border-soft">
                {aging.map((bucket) => (
                  <div key={bucket.label} className="flex justify-between py-2 text-sm">
                    <span>
                      {bucket.label} · {bucket.count}{' '}
                      {bucket.count === 1 ? 'préstamo' : 'préstamos'}
                    </span>
                    <strong>{money(bucket.amount)}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <section className="mt-5 rounded-[22px] border border-border-soft bg-card p-6 shadow-card">
            <h2 className="mb-4 font-bold">Ingresos diarios</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="text-text-secondary">
                    <th className="py-2">Fecha</th>
                    <th>Capital</th>
                    <th>Interés</th>
                    <th>Mora</th>
                  </tr>
                </thead>
                <tbody>
                  {income.map((day) => (
                    <tr key={day.date} className="border-t border-border-soft">
                      <td className="py-2">{day.label}</td>
                      <td>{money(day.capital)}</td>
                      <td>{money(day.interest)}</td>
                      <td>{money(day.lateFee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
