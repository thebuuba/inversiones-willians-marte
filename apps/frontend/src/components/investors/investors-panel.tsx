'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Coins, HandCoins, Percent, PiggyBank, Plus, Search } from 'lucide-react';
import { getInvestors } from '@/lib/api/investors';
import { useClientCache } from '@/lib/use-client-cache';
import { formatInvestorCurrency, getInvestorOverview } from './investors-panel.helpers';

const entrance = 'animate-[fade-in-up_0.45s_ease-out_both] motion-reduce:animate-none';
const filters = ['Todos', 'Activos', 'Pausados', 'Retirados'];

export function InvestorsPanel() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const { data, loading, error } = useClientCache('investors', getInvestors);
  const investors = useMemo(() => data ?? [], [data]);
  const overview = getInvestorOverview(investors);
  const initialLoading = loading && !data;
  const year = Number(
    new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'America/Santo_Domingo' }).format(
      new Date(),
    ),
  );
  const stats = [
    {
      label: 'Capital total',
      value: formatInvestorCurrency(overview.capital),
      detail: `${investors.length} inversionistas`,
      icon: Coins,
      tone: 'bg-primary-soft text-primary',
      color: '#139666',
    },
    {
      label: 'Capital colocado',
      value: '—',
      detail: 'Sin registrar',
      icon: HandCoins,
      tone: 'bg-amber-100 text-amber-700',
      color: '#ffd83d',
    },
    {
      label: 'Rendimiento promedio',
      value: `${overview.rate.toLocaleString('es-DO', { maximumFractionDigits: 1 })}% mensual`,
      detail: 'tasa pactada',
      icon: Percent,
      tone: 'bg-pink-100 text-pink-700',
      color: '#ed91b0',
    },
    {
      label: 'Ganancias pagadas',
      value: overview.yearGains === null ? '—' : formatInvestorCurrency(overview.yearGains),
      detail: `acumulado ${year}`,
      icon: PiggyBank,
      tone: 'bg-red-50 text-red-500',
      color: '#e53835',
    },
  ];
  const visible = investors.filter((investor) => {
    const status = { Activos: 'ACTIVE', Pausados: 'PAUSED', Retirados: 'WITHDRAWN' }[filter];
    if (status && investor.status !== status) return false;
    const query = search.trim().toLocaleLowerCase();
    return (
      !query ||
      [investor.name, investor.code, investor.cedula ?? ''].some((value) =>
        value.toLocaleLowerCase().includes(query),
      )
    );
  });

  return (
    <div className="min-h-screen bg-page p-4 text-text-primary sm:p-6">
      <header className={`${entrance} mb-6 flex flex-wrap items-end justify-between gap-4`}>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-sky">
            Finanzas
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Inversionistas</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Capital aportado, colocación y rendimientos.
          </p>
        </div>
        <Link
          href="/inversionistas/nuevo"
          className="flex h-11 items-center gap-2 rounded-full bg-brand-sky px-5 text-sm font-semibold text-white transition hover:bg-primary focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo inversionista
        </Link>
      </header>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <section
            key={stat.label}
            className={`${entrance} relative overflow-hidden rounded-[28px] bg-card p-5 shadow-card`}
            style={{ animationDelay: `${index * 70}ms` }}
            aria-label={stat.label}
          >
            <span
              className="absolute left-0 top-5 h-10 w-1.5 rounded-r-full"
              style={{ backgroundColor: stat.color }}
              aria-hidden="true"
            />
            <div className="flex items-center gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${stat.tone}`}
              >
                <stat.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-text-secondary">{stat.label}</p>
                <p className="mt-1 text-xl font-bold">{initialLoading ? '...' : stat.value}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-text-secondary">{stat.detail}</p>
          </section>
        ))}
      </div>
      <div
        className={`${entrance} mb-5 flex flex-wrap items-center justify-between gap-3 [animation-delay:240ms]`}
      >
        <label className="flex h-10 w-full items-center gap-2 rounded-full bg-card px-4 shadow-sm focus-within:ring-2 focus-within:ring-primary sm:w-80">
          <Search className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          <span className="sr-only">Buscar inversionistas</span>
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, código o cédula..."
          />
        </label>
        <div
          role="group"
          aria-label="Filtrar inversionistas"
          className="flex flex-wrap gap-1 rounded-full bg-surface-muted-ui p-1"
        >
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
              className={`h-9 rounded-full px-4 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-primary ${filter === item ? 'bg-[#ffd83d] text-[#25251e] shadow-sm' : 'text-text-secondary hover:bg-card'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-2xl bg-state-danger-bg p-4 text-sm text-state-danger"
        >
          {error}
        </p>
      )}
      {initialLoading ? (
        <p role="status" className="py-12 text-center text-sm text-text-secondary">
          Cargando inversionistas...
        </p>
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((investor, index) => (
            <article
              key={investor.id}
              className={`${entrance} rounded-[32px] bg-card p-6 shadow-card`}
              style={{ animationDelay: `${280 + Math.min(index, 7) * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                {investor.photo ? (
                  <span
                    role="img"
                    aria-label={investor.name}
                    className="h-14 w-14 shrink-0 rounded-full border-4 border-amber-100 bg-cover bg-center"
                    style={{ backgroundImage: `url(${investor.photo})` }}
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-amber-100 bg-primary-soft text-lg font-bold text-primary">
                    {investor.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((name) => name[0])
                      .join('')}
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-bold">{investor.name}</h2>
                  <p className="mt-1 text-xs text-text-secondary">
                    Inversionista desde{' '}
                    {investor.createdAt ? new Date(investor.createdAt).getFullYear() : '—'}
                  </p>
                </div>
              </div>
              <div className="my-5 flex items-center gap-4">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[8px] border-surface-muted-ui text-sm font-bold"
                  aria-label="Porcentaje de capital colocado sin registrar"
                >
                  —
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-secondary">Capital</p>
                  <p className="mt-1 text-sm font-bold">
                    {formatInvestorCurrency(investor.totalCapital ?? investor.capital)}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">Colocado —</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[22px] bg-surface-subtle p-3">
                  <p className="text-xs text-text-secondary">Rendimiento</p>
                  <p className="mt-1 font-bold text-primary">
                    {getInvestorOverview([investor]).rate.toLocaleString('es-DO', {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </p>
                </div>
                <div className="rounded-[22px] bg-surface-subtle p-3">
                  <p className="text-xs text-text-secondary">Ganancias</p>
                  <p className="mt-1 break-words font-bold">
                    {investor.totalGainsPaid === undefined
                      ? '—'
                      : formatInvestorCurrency(investor.totalGainsPaid)}
                  </p>
                </div>
              </div>
              <Link
                href={`/inversionistas/${investor.id}`}
                className="mt-5 inline-flex min-h-8 items-center gap-1 text-xs font-bold text-red-500 hover:underline focus-visible:ring-2 focus-visible:ring-primary"
              >
                Ver estado de cuenta <ArrowRight className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only"> de {investor.name}</span>
              </Link>
            </article>
          ))}
        </div>
      )}
      {!initialLoading && visible.length === 0 && (
        <p className="py-12 text-center text-sm text-text-secondary">
          No se encontraron inversionistas.
        </p>
      )}
    </div>
  );
}
