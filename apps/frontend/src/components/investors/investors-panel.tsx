'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  HandCoins,
  Percent,
  PiggyBank,
  Plus,
  Search,
} from 'lucide-react';
import { getInvestors } from '@/lib/api/investors';
import { useClientCache } from '@/lib/use-client-cache';
import { Card } from '@/components/ui/card';
import {
  pageEntryHeaderClassName,
  pageEntryStatCardClassName,
  pageEntryTableClassName,
} from '@/lib/page-entry-animation';
import { formatInvestorCurrency, getInvestorOverview } from './investors-panel.helpers';

const filters = ['Todos', 'Activos', 'Pausados', 'Retirados'];
const pageSize = 6;
const columns = 'grid-cols-[minmax(250px,2fr)_110px_minmax(150px,1fr)_140px_minmax(160px,1fr)]';

export function InvestorsPanel() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [page, setPage] = useState(0);
  const { data, loading, error } = useClientCache('investors', getInvestors);
  const investors = useMemo(() => data ?? [], [data]);
  const overview = getInvestorOverview(investors);
  const initialLoading = loading && !data;
  const year = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    timeZone: 'America/Santo_Domingo',
  }).format(new Date());
  const stats = [
    {
      label: 'Capital total',
      value: formatInvestorCurrency(overview.capital),
      detail: `${investors.length} inversionistas`,
      icon: Coins,
      tone: 'bg-white text-brand-sky',
      blue: true,
    },
    {
      label: 'Capital colocado',
      value: '—',
      detail: 'Sin registrar',
      icon: HandCoins,
      tone: 'bg-state-warning-bg text-state-warning',
      blue: false,
    },
    {
      label: 'Rendimiento promedio',
      value: `${overview.rate.toLocaleString('es-DO', { maximumFractionDigits: 2 })}%`,
      detail: 'interés mensual simple',
      icon: Percent,
      tone: 'bg-primary-soft text-primary',
      blue: false,
    },
    {
      label: 'Ganancias pagadas',
      value: overview.yearGains === null ? '—' : formatInvestorCurrency(overview.yearGains),
      detail: `acumulado ${year}`,
      icon: PiggyBank,
      tone: 'bg-state-success-bg text-state-success',
      blue: false,
    },
  ];
  const visible = investors.filter((investor) => {
    const status = { Activos: 'ACTIVE', Pausados: 'PAUSED', Retirados: 'WITHDRAWN' }[filter];
    if (status && investor.status !== status) return false;
    const query = search.trim().toLocaleLowerCase();
    return (
      !query ||
      [investor.name, investor.code, investor.cedula ?? '', investor.phone ?? ''].some((value) =>
        value.toLocaleLowerCase().includes(query),
      )
    );
  });
  const totalPages = Math.ceil(visible.length / pageSize);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const rows = visible.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="min-h-screen bg-page p-4 font-sans text-text-primary md:p-5">
      <div className="flex w-full flex-col gap-7">
        <header
          className={`${pageEntryHeaderClassName} flex flex-col justify-between gap-4 xl:flex-row xl:items-center`}
        >
          <div>
            <h1 className="text-[29px] font-bold leading-tight">Inversionistas</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Administra el capital y los rendimientos de tus inversionistas
            </p>
          </div>
          <Link
            href="/inversionistas/nuevo"
            className="flex h-11 w-fit items-center gap-2 rounded-xl bg-brand-sky px-5 text-sm font-bold text-white shadow-action transition hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo inversionista
          </Link>
        </header>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <Card
              key={stat.label}
              className={`${pageEntryStatCardClassName(index)} relative flex min-h-[128px] flex-col justify-between gap-2 overflow-hidden rounded-2xl p-4 shadow-card ${stat.blue ? 'bg-highlight text-text-primary' : 'bg-card'}`}
            >
              {stat.blue && (
                <span className="pointer-events-none absolute -right-4 -top-10 h-24 w-24 rounded-full bg-white/10" />
              )}
              <span
                className={`relative flex h-8 w-8 items-center justify-center rounded-lg ${stat.tone}`}
              >
                <stat.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="relative min-w-0">
                <p className="text-[13px] font-semibold">{stat.label}</p>
                <p className="mt-0.5 break-words text-lg font-bold tabular-nums">
                  {initialLoading ? '…' : stat.value}
                </p>
                <p className={`mt-0.5 text-[11px] leading-4 text-text-secondary`}>{stat.detail}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-[32px] border border-border-soft bg-card p-3 shadow-card md:flex-row md:items-center">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-surface-muted-ui px-4 focus-within:ring-2 focus-within:ring-primary-border">
            <Search className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
            <span className="sr-only">Buscar inversionistas</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Buscar por nombre, código, cédula o teléfono..."
            />
          </label>
          <div
            role="group"
            aria-label="Filtrar inversionistas"
            className="flex shrink-0 items-center gap-1 self-end rounded-full bg-surface-muted-ui p-1"
          >
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => {
                  setFilter(item);
                  setPage(0);
                }}
                className={`flex h-8 items-center justify-center rounded-full px-4 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-primary ${filter === item ? 'bg-highlight text-text-primary shadow-card' : 'text-text-secondary hover:bg-card'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p role="alert" className="rounded-2xl bg-state-danger-bg p-4 text-sm text-state-danger">
            {error}
          </p>
        )}
        <Card
          className={`${pageEntryTableClassName} overflow-hidden rounded-2xl bg-card shadow-card`}
        >
          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              <div
                className={`grid ${columns} items-center gap-4 border-b border-border-soft bg-surface-subtle px-5 py-3 text-xs font-semibold text-text-secondary`}
              >
                <span>Inversionista</span>
                <span>Estado</span>
                <span>Capital</span>
                <span>Rendimiento</span>
                <span>Ganancias pagadas</span>
              </div>
              {initialLoading ? (
                <p role="status" className="py-16 text-center text-sm text-text-secondary">
                  Cargando inversionistas...
                </p>
              ) : rows.length === 0 ? (
                <p className="py-16 text-center text-sm text-text-secondary">
                  No se encontraron inversionistas.
                </p>
              ) : (
                rows.map((investor, index) => (
                  <Link
                    key={investor.id}
                    href={`/inversionistas/${investor.id}`}
                    aria-label={`Ver estado de cuenta de ${investor.name}`}
                    className={`group grid min-h-16 ${columns} items-center gap-4 border-b border-border-soft px-5 py-2 text-sm transition last:border-b-0 hover:bg-primary-soft focus-visible:bg-primary-soft focus-visible:outline-primary`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {investor.photo ? (
                        <span
                          role="img"
                          aria-label={investor.name}
                          className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${investor.photo})` }}
                        />
                      ) : (
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index % 2 === 0 ? 'bg-primary-soft text-primary' : 'bg-state-warning-bg text-state-warning'}`}
                        >
                          {investor.name
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((name) => name[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-bold">{investor.name}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{investor.code}</p>
                      </div>
                    </div>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${investor.status === 'ACTIVE' ? 'bg-primary-soft text-primary' : investor.status === 'PAUSED' ? 'bg-state-warning-bg text-state-warning' : 'bg-surface-muted-ui text-text-secondary'}`}
                    >
                      {investor.status === 'ACTIVE'
                        ? 'Activo'
                        : investor.status === 'PAUSED'
                          ? 'Pausado'
                          : 'Retirado'}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatInvestorCurrency(investor.totalCapital ?? investor.capital)}
                    </span>
                    <span className="font-semibold tabular-nums text-primary">
                      {getInvestorOverview([investor]).rate.toLocaleString('es-DO', {
                        maximumFractionDigits: 2,
                      })}
                      %
                      <span className="mt-0.5 block text-xs font-normal text-text-secondary">
                        mensual
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {investor.totalGainsPaid === undefined
                        ? '—'
                        : formatInvestorCurrency(investor.totalGainsPaid)}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
          <footer className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-t border-border-soft px-5 py-3 text-sm text-text-secondary">
            <span>
              Mostrando <strong className="text-text-primary">{rows.length}</strong> de{' '}
              <strong className="text-text-primary">{visible.length}</strong> inversionistas
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted-ui disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, Math.max(totalPages, 1)) }, (_, index) => {
                const number = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + index;
                return (
                  <button
                    key={number}
                    type="button"
                    aria-label={`Página ${number + 1}`}
                    aria-current={currentPage === number ? 'page' : undefined}
                    onClick={() => setPage(number)}
                    className={`h-9 w-9 rounded-full text-sm font-bold ${currentPage === number ? 'bg-brand-sky text-white shadow-action' : 'text-text-secondary hover:bg-surface-muted-ui'}`}
                  >
                    {number + 1}
                  </button>
                );
              })}
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={currentPage + 1 >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted-ui disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </Card>
      </div>
    </div>
  );
}
