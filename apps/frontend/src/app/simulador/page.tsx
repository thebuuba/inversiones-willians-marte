'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Calculator } from 'lucide-react';
import { computeSchedule } from '@/components/loans/new-loan-form.helpers';
import { formatDop } from '@/lib/currency';

export default function SimuladorPage() {
  const [principal, setPrincipal] = useState('25000');
  const [rate, setRate] = useState('2.5');
  const [installments, setInstallments] = useState('12');
  const amount = Number(principal);
  const periodicRate = Number(rate);
  const term = Number(installments);
  const valid =
    Number.isFinite(amount) &&
    amount > 0 &&
    Number.isFinite(periodicRate) &&
    periodicRate >= 0 &&
    Number.isInteger(term) &&
    term > 0 &&
    term <= 360;
  const result = useMemo(
    () =>
      valid
        ? computeSchedule(amount, periodicRate, term, periodicRate === 0 ? 'NO_INTEREST' : 'SIMPLE')
        : null,
    [amount, periodicRate, term, valid],
  );

  return (
    <main className="min-h-screen bg-page px-5 py-8 text-text-primary lg:px-8">
      <Link
        href="/inicio"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Inicio
      </Link>
      <header className="my-6">
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Simulador de préstamo</h1>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Calcula una estimación con la misma fórmula del formulario de préstamo.
        </p>
      </header>
      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="h-fit rounded-[22px] border border-border-soft bg-card p-6 shadow-card">
          <h2 className="mb-5 font-bold">Datos del préstamo</h2>
          <div className="space-y-4">
            {[
              {
                label: 'Monto (RD$)',
                value: principal,
                set: setPrincipal,
                min: '0.01',
                step: '0.01',
              },
              { label: 'Interés por cuota (%)', value: rate, set: setRate, min: '0', step: '0.01' },
              {
                label: 'Número de cuotas',
                value: installments,
                set: setInstallments,
                min: '1',
                step: '1',
              },
            ].map((field) => (
              <label key={field.label} className="block text-sm font-semibold">
                {field.label}
                <input
                  type="number"
                  min={field.min}
                  step={field.step}
                  value={field.value}
                  onChange={(event) => field.set(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-border-soft bg-card px-3 outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>
          {!valid && (
            <p className="mt-4 text-sm text-state-danger">
              Ingresa un monto, tasa y número de cuotas válidos (máximo 360).
            </p>
          )}
          <p className="mt-5 text-xs text-text-secondary">
            La simulación no crea un préstamo ni modifica datos.
          </p>
        </section>
        <section className="min-w-0 rounded-[22px] border border-border-soft bg-card p-6 shadow-card">
          <h2 className="font-bold">Resultado estimado</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ['Cuota estimada', result?.payment],
              ['Interés total', result?.totalInterest],
              ['Total a pagar', result?.totalPayment],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl bg-page p-4">
                <p className="text-xs text-text-secondary">{label}</p>
                <strong className="mt-1 block text-lg">
                  {formatDop(Number(value ?? 0), { decimals: 2 })}
                </strong>
              </div>
            ))}
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[450px] text-left text-sm">
              <thead>
                <tr className="text-text-secondary">
                  <th className="py-2">Cuota</th>
                  <th>Pago</th>
                  <th>Capital</th>
                  <th>Interés</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {result?.schedule.map((row) => (
                  <tr key={row.number} className="border-t border-border-soft">
                    <td className="py-2">{row.number}</td>
                    <td>{formatDop(row.payment, { decimals: 2 })}</td>
                    <td>{formatDop(row.principal, { decimals: 2 })}</td>
                    <td>{formatDop(row.interest, { decimals: 2 })}</td>
                    <td>{formatDop(row.balance, { decimals: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
