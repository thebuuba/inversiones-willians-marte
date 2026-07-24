'use client';

import Link from 'next/link';
import { useCallback, useMemo, type ReactNode } from 'react';
import { ArrowRight, BriefcaseBusiness, Landmark, Plus, UserRound, WalletCards } from 'lucide-react';
import { formatDop } from '@/lib/currency';
import { getPortfolios, type PortfolioItem } from '@/lib/api/portfolios';
import { useClientCache } from '@/lib/use-client-cache';

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <section className="flex min-h-[108px] items-center gap-4 rounded-panel border border-border-soft bg-card p-5 shadow-card">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">{icon}</div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-secondary">{label}</p>
        <p className="mt-2 text-2xl font-bold leading-none text-text-primary">{value}</p>
      </div>
    </section>
  );
}

function PortfolioCard({ portfolio }: { portfolio: PortfolioItem }) {
  const loans = portfolio.loans ?? [];
  const clients = new Set(loans.map((loan) => loan.client.id)).size;
  const balance = portfolio.totals?.balance ?? loans.reduce((sum, loan) => sum + loan.balance, 0);

  return (
    <Link
      className="group flex min-h-[230px] flex-col rounded-panel border border-border-soft bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:border-primary-border hover:shadow-action"
      href={`/carteras/${portfolio.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: portfolio.color }}
        >
          <BriefcaseBusiness className="h-6 w-6" />
        </div>
        <ArrowRight className="h-5 w-5 text-text-subtle transition group-hover:translate-x-1 group-hover:text-primary" />
      </div>

      <h2 className="mt-5 text-xl font-bold text-text-primary group-hover:text-primary">{portfolio.name}</h2>
      <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-text-secondary">
        {portfolio.description ?? 'Listado personalizado de clientes y préstamos.'}
      </p>

      <div className="mt-auto grid grid-cols-3 gap-3 border-t border-border-soft pt-5">
        <div>
          <p className="text-xs font-bold uppercase text-text-secondary">Clientes</p>
          <p className="mt-1 font-bold text-text-primary">{clients}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-text-secondary">Préstamos</p>
          <p className="mt-1 font-bold text-text-primary">{portfolio._count.loans}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-text-secondary">Balance</p>
          <p className="mt-1 truncate font-bold text-text-primary">{formatDop(balance, { space: true })}</p>
        </div>
      </div>
    </Link>
  );
}

export function PortfoliosPage() {
  const fetcher = useCallback(() => getPortfolios(), []);
  const { data, loading, error } = useClientCache('portfolios:with-loans', fetcher, 30_000, 'Error al cargar carteras');
  const portfolios = useMemo(() => data ?? [], [data]);
  const totals = useMemo(() => {
    const loans = portfolios.flatMap((portfolio) => portfolio.loans ?? []);
    return {
      clients: new Set(loans.map((loan) => loan.client.id)).size,
      loans: loans.length,
      balance: portfolios.reduce((sum, portfolio) => sum + (portfolio.totals?.balance ?? 0), 0),
    };
  }, [portfolios]);

  return (
    <main className="min-h-screen bg-page p-5 font-sans text-text-primary">
      <div className="mx-auto max-w-[1640px]">
        <header className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-secondary">GESTIÓN</p>
            <h1 className="mt-1.5 text-[28px] font-bold leading-tight">Carteras</h1>
            <p className="mt-1.5 text-base font-medium text-text-secondary">
              Listados personalizados de clientes y sus préstamos.
            </p>
          </div>
          <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-text-inverse shadow-action transition hover:bg-primary" href="/prestamos/nuevo">
            <Plus className="h-4 w-4" />
            Nuevo préstamo
          </Link>
        </header>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={<BriefcaseBusiness className="h-6 w-6" />} label="Carteras" value={String(portfolios.length)} />
          <SummaryCard icon={<UserRound className="h-6 w-6" />} label="Clientes" value={String(totals.clients)} />
          <SummaryCard icon={<Landmark className="h-6 w-6" />} label="Préstamos" value={String(totals.loans)} />
          <SummaryCard icon={<WalletCards className="h-6 w-6" />} label="Balance" value={formatDop(totals.balance, { space: true })} />
        </div>

        {error ? <section className="rounded-panel border border-state-danger/30 bg-state-danger-bg p-6 text-sm font-bold text-state-danger">{error}</section> : null}
        {loading ? (
          <div className="py-20 text-center text-sm font-medium text-text-secondary">Cargando carteras...</div>
        ) : portfolios.length === 0 ? (
          <section className="rounded-panel border border-dashed border-primary-border bg-card p-10 text-center shadow-card">
            <BriefcaseBusiness className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 text-lg font-bold">No hay carteras creadas</h2>
            <p className="mt-2 text-sm font-medium text-text-secondary">Puedes crear una al registrar un préstamo.</p>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {portfolios.map((portfolio) => <PortfolioCard key={portfolio.id} portfolio={portfolio} />)}
          </div>
        )}
      </div>
    </main>
  );
}
