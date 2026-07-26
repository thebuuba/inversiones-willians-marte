'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Plus,
  Search,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { getInvestors } from '@/lib/api/investors';
import {
  pageEntryHeaderClassName,
  pageEntryStatCardClassName,
  pageEntryTableClassName,
} from '@/lib/page-entry-animation';
import { useClientCache } from '@/lib/use-client-cache';
import { formatInvestorCurrency } from './investors-panel.helpers';
import type { InvestorItem } from '@inversiones/shared';
import { Card as PanelCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 8;

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  WITHDRAWN: 'Retirado',
};

const filters = ['Todos', 'Activos', 'Pausados', 'Retirados'];

export function InvestorsPanel() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [page, setPage] = useState(0);
  const { data, loading, error } = useClientCache<InvestorItem[]>('investors', getInvestors);
  const investors = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const total = investors.length;
    const activos = investors.filter((i) => i.status === 'ACTIVE').length;
    const capitalTotal = investors.reduce((s, i) => s + Number(i.capital), 0);
    const tasaPromedio = total > 0 ? (investors.reduce((s, i) => s + i.rate, 0) / total).toFixed(1) : '0';
    return [
      { label: 'Total inversionistas', value: String(total), icon: UsersRound, bg: 'bg-primary-soft', color: 'text-primary-accent' },
      { label: 'Activos', value: String(activos), icon: UsersRound, bg: 'bg-primary-soft', color: 'text-primary-accent' },
      { label: 'Capital total', value: formatInvestorCurrency(capitalTotal), icon: TrendingUp, bg: 'bg-state-warning-bg', color: 'text-state-warning' },
      { label: 'Tasa promedio', value: `${tasaPromedio}%`, icon: TrendingUp, bg: 'bg-state-info-bg', color: 'text-state-info' },
    ];
  }, [investors]);

  const filteredInvestors = useMemo(() => {
    const lower = search.toLowerCase();
    return investors.filter((i) => {
      if (filter === 'Activos' && i.status !== 'ACTIVE') return false;
      if (filter === 'Pausados' && i.status !== 'PAUSED') return false;
      if (filter === 'Retirados' && i.status !== 'WITHDRAWN') return false;
      if (!search) return true;
      return i.name.toLowerCase().includes(lower) || i.code.toLowerCase().includes(lower) || (i.cedula ?? '').toLowerCase().includes(lower);
    });
  }, [investors, filter, search]);

  const totalPages = Math.ceil(filteredInvestors.length / PAGE_SIZE);
  const displayInvestors = filteredInvestors.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const initialLoading = loading && !data;

  return (
    <div className="flex h-[calc(100dvh-4rem-env(safe-area-inset-top))] min-h-0 flex-col overflow-hidden bg-page p-5 font-sans text-text-primary">
      <div className="flex w-full flex-1 flex-col gap-5">
        <header
          className={`${pageEntryHeaderClassName} flex flex-col justify-between gap-4 xl:flex-row xl:items-end`}
        >
          <div>
            <h1 className="text-3xl font-bold leading-tight text-text-primary">Inversionistas</h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              Administra tu cartera de capital — {investors.length} inversionistas registrados.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-11 items-center gap-2 rounded-full border border-primary-border bg-card px-5 text-sm font-bold text-text-secondary transition-colors duration-150 hover:bg-surface-subtle hover:text-text-primary">
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <Link
              className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white transition-colors duration-150 hover:bg-primary-hover"
              href="/inversionistas/nuevo"
            >
              <Plus className="h-4 w-4" />
              Agregar inversionista
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <PanelCard
                key={stat.label}
                className={`${pageEntryStatCardClassName(index)} flex items-center gap-4 p-5`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold leading-none text-text-primary">
                    {initialLoading ? '...' : stat.value}
                  </p>
                </div>
              </PanelCard>
            );
          })}
        </div>

        {error && (
          <div className="rounded-panel border border-state-danger-dot bg-state-danger-bg px-5 py-3 text-sm font-medium text-state-danger">
            {error}
          </div>
        )}

        <PanelCard
          className={`${pageEntryTableClassName} flex min-h-0 flex-1 flex-col overflow-x-auto bg-card`}
        >
          {/* search + filters */}
          <div className="min-w-[760px] border-b border-border-soft bg-card p-4">
            <div className="flex h-11 items-center gap-3 rounded-control-comfortable border border-primary-border bg-surface-subtle px-4 transition-colors duration-150 focus-within:border-primary-border focus-within:bg-card focus-within:ring-2 focus-within:ring-primary-soft">
              <Search className="h-4 w-4 shrink-0 text-text-secondary" />
              <input
                className="flex-1 bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-secondary/60"
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Buscar por nombre, código o cédula..."
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <Filter className="h-4 w-4 text-text-secondary" />
              <span className="text-xs font-bold text-text-secondary">Estado:</span>
              {filters.map((f) => (
                <button
                  key={f}
                  className={`h-8 rounded-full px-3.5 text-xs font-bold transition-colors duration-150 ${
                    filter === f
                      ? 'bg-primary-accent text-text-inverse'
                      : 'border border-primary-border bg-card text-primary-accent hover:bg-surface-subtle'
                  }`}
                  onClick={() => { setFilter(f); setPage(0); }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* table header */}
          <div className="sticky top-0 z-10 grid min-w-[760px] grid-cols-[2fr_1.2fr_1.2fr_0.7fr_1fr] items-center border-b border-border-soft bg-card px-6 py-3.5 text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">
            <span>INVERSIONISTA</span>
            <span>CÓDIGO</span>
            <span>CAPITAL</span>
            <span>TASA</span>
            <span>ESTADO</span>
          </div>

          {/* body */}
          <div className="relative min-w-[760px] flex-1 overflow-hidden">
            {initialLoading ? (
              <div className="flex h-full items-center justify-center text-sm font-medium text-text-secondary">
                Cargando inversionistas...
              </div>
            ) : displayInvestors.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-center text-sm font-medium text-text-secondary">
                {search
                  ? `No se encontraron inversionistas para "${search}"`
                  : 'No se encontraron inversionistas.'}
              </div>
            ) : (
              displayInvestors.map((investor) => (
                <div
                  key={investor.id}
                  className="group grid min-h-[64px] cursor-pointer grid-cols-[2fr_1.2fr_1.2fr_0.7fr_1fr] items-center border-b border-border-soft bg-card px-6 transition-colors duration-150 last:border-b-0 hover:bg-surface-subtle"
                  onClick={() => router.push(`/inversionistas/${investor.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0">
                      {investor.photo ? (
                        <div
                          aria-label={investor.name}
                          className="h-full w-full rounded-full bg-cover bg-center"
                          role="img"
                          style={{ backgroundImage: `url(${investor.photo})` }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary-soft">
                          <TrendingUp className="h-4 w-4 text-primary-accent" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold leading-tight text-text-primary">{investor.name}</p>
                      <p className="mt-1 text-xs leading-tight text-text-secondary/70">
                        {investor.cedula ? `Cédula: ${investor.cedula}` : '—'}
                      </p>
                    </div>
                  </div>
                  <span className="[font-variant-numeric:tabular-nums] text-sm text-text-secondary">{investor.code}</span>
                  <span className="text-sm font-bold text-text-primary">{formatInvestorCurrency(investor.capital)}</span>
                  <span className="[font-variant-numeric:tabular-nums] text-sm text-text-secondary">{investor.rate}%</span>
                  <span>
                    <Badge
                      className="min-w-[76px] justify-center py-1.5"
                      dot
                      status={statusLabels[investor.status] ?? investor.status}
                    >
                      {statusLabels[investor.status] ?? investor.status}
                    </Badge>
                  </span>
                </div>
              ))
            )}
          </div>

          {/* footer */}
          <div className="flex min-w-[760px] items-center justify-between border-t border-border-soft bg-card px-6 py-4">
            <p className="text-sm text-text-secondary">
              {!initialLoading && (
                <>
                  Mostrando {displayInvestors.length} de {filteredInvestors.length} inversionista{filteredInvestors.length !== 1 ? 's' : ''}
                </>
              )}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-border bg-card text-text-secondary transition-colors duration-150 hover:bg-surface-subtle disabled:opacity-30"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-text-secondary">
                  {page + 1} / {totalPages}
                </span>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-border bg-card text-text-secondary transition-colors duration-150 hover:bg-surface-subtle disabled:opacity-30"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
