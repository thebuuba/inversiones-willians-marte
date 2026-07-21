'use client';

import Link from 'next/link';
import { useCallback, useMemo, type ReactNode } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Landmark,
  Phone,
  Plus,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { formatDop } from '@/lib/currency';
import { getPortfolios, type PortfolioItem, type PortfolioLoan } from '@/lib/api/portfolios';
import { useClientCache } from '@/lib/use-client-cache';

interface PortfolioClientGroup {
  id: number;
  name: string;
  identification: string | null;
  phone: string | null;
  loans: PortfolioLoan[];
  principal: number;
  balance: number;
}

function groupLoansByClient(loans: PortfolioLoan[]): PortfolioClientGroup[] {
  const groups = new Map<number, PortfolioClientGroup>();

  for (const loan of loans) {
    const clientName = `${loan.client.firstName} ${loan.client.lastName}`.trim();
    const existing = groups.get(loan.client.id);

    if (existing) {
      existing.loans.push(loan);
      existing.principal += loan.principal;
      existing.balance += loan.balance;
      continue;
    }

    groups.set(loan.client.id, {
      id: loan.client.id,
      name: clientName || 'Cliente sin nombre',
      identification: loan.client.identification,
      phone: loan.client.phone,
      loans: [loan],
      principal: loan.principal,
      balance: loan.balance,
    });
  }

  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: 'Activo',
    OVERDUE: 'Atrasado',
    PAID: 'Pagado',
    RESTRUCTURED: 'Reestructurado',
    WRITTEN_OFF: 'Castigado',
  };

  return labels[status] ?? status;
}

function statusClass(status: string) {
  if (status === 'ACTIVE') return 'bg-primary-soft text-primary';
  if (status === 'OVERDUE') return 'bg-state-danger-bg text-state-danger';
  if (status === 'PAID') return 'bg-state-neutral-bg text-state-neutral';
  return 'bg-state-warning-bg text-state-warning';
}

function SummaryCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <section className="flex min-h-[116px] items-center gap-4 rounded-panel border border-border-soft bg-card p-5 shadow-card">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-secondary">{label}</p>
        <p className="mt-2 truncate text-2xl font-bold leading-none text-text-primary">{value}</p>
        <p className="mt-2 truncate text-sm font-medium text-text-secondary">{subtext}</p>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="rounded-panel border border-dashed border-primary-border bg-card p-10 text-center shadow-card">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <BriefcaseBusiness className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-text-primary">No hay carteras creadas</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-text-secondary">
        Crea una cartera al registrar un préstamo nuevo para ver aquí sus clientes y códigos de préstamos.
      </p>
      <Link
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-text-inverse shadow-action transition hover:bg-primary"
        href="/prestamos/nuevo"
      >
        <Plus className="h-4 w-4" />
        Nuevo préstamo
      </Link>
    </section>
  );
}

function ClientRow({ group }: { group: PortfolioClientGroup }) {
  return (
    <div className="rounded-panel border border-border-soft bg-surface-subtle p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <Link className="group flex min-w-0 items-center gap-3" href={`/clientes/${group.id}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-text-primary group-hover:text-primary">{group.name}</p>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-subtle transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-text-secondary">
              <span>{group.identification ?? 'Sin cedula'}</span>
              {group.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {group.phone}
                </span>
              ) : null}
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[320px]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">Prestado</p>
            <p className="mt-1 font-bold text-text-primary">{formatDop(group.principal, { space: true })}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">Balance</p>
            <p className="mt-1 font-bold text-text-primary">{formatDop(group.balance, { space: true })}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {group.loans.map((loan) => (
          <Link
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary-border bg-card px-3 text-xs font-bold text-text-primary shadow-soft transition hover:border-border-strong-ui hover:text-primary"
            href={`/prestamos/${loan.id}`}
            key={loan.id}
            title={`Abrir prestamo #${loan.loanNumber}`}
          >
            <span>#{loan.loanNumber}</span>
            <span className={`rounded-full px-2 py-1 ${statusClass(loan.status)}`}>{statusLabel(loan.status)}</span>
            <span className="text-text-secondary">{formatDop(loan.balance, { space: true })}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PortfolioCard({ portfolio }: { portfolio: PortfolioItem }) {
  const loans = portfolio.loans ?? [];
  const clientGroups = groupLoansByClient(loans);
  const totalPrincipal = portfolio.totals?.principal ?? loans.reduce((sum, loan) => sum + loan.principal, 0);
  const totalBalance = portfolio.totals?.balance ?? loans.reduce((sum, loan) => sum + loan.balance, 0);

  return (
    <section className="overflow-hidden rounded-panel border border-border-soft bg-card shadow-card">
      <div className="flex flex-col gap-4 border-b border-border-soft px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: portfolio.color }}
          >
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-text-primary">{portfolio.name}</h2>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-text-secondary">
              {portfolio.description ?? 'Cartera de prestamos'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right text-sm max-sm:text-left">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">Clientes</p>
            <p className="mt-1 font-bold text-text-primary">{clientGroups.length}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">Prestamos</p>
            <p className="mt-1 font-bold text-text-primary">{portfolio._count.loans}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">Balance</p>
            <p className="mt-1 font-bold text-text-primary">{formatDop(totalBalance, { space: true })}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {clientGroups.length === 0 ? (
          <p className="rounded-panel border border-dashed border-primary-border bg-surface-subtle px-4 py-8 text-center text-sm font-medium text-text-secondary">
            Sin prestamos asignados
          </p>
        ) : (
          clientGroups.map((group) => <ClientRow group={group} key={group.id} />)
        )}
      </div>

      {clientGroups.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-6 py-4 text-sm font-medium text-text-secondary">
          <span>Total colocado: <strong className="text-text-primary">{formatDop(totalPrincipal, { space: true })}</strong></span>
          <span>Balance pendiente: <strong className="text-text-primary">{formatDop(totalBalance, { space: true })}</strong></span>
        </div>
      ) : null}
    </section>
  );
}

export function PortfoliosPage() {
  const fetcher = useCallback(() => getPortfolios(), []);
  const { data, loading, error } = useClientCache('portfolios:with-loans', fetcher, 30_000, 'Error al cargar carteras');
  const portfolios = useMemo(() => data ?? [], [data]);
  const totals = useMemo(() => {
    const loans = portfolios.flatMap((portfolio) => portfolio.loans ?? []);
    const clientIds = new Set(loans.map((loan) => loan.client.id));

    return {
      portfolios: portfolios.length,
      clients: clientIds.size,
      loans: loans.length,
      balance: portfolios.reduce((sum, portfolio) => sum + (portfolio.totals?.balance ?? 0), 0),
    };
  }, [portfolios]);

  return (
    <main className="min-h-screen bg-page p-5 font-sans text-text-primary">
      <div className="mx-auto max-w-[1640px]">
        <header className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-secondary">GESTION</p>
            <h1 className="mt-1.5 text-[28px] font-bold leading-tight text-text-primary">Carteras</h1>
            <p className="mt-1.5 text-base font-medium text-text-secondary">
              Consulta las carteras creadas, sus clientes y los prestamos asociados.
            </p>
          </div>
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-text-inverse shadow-action transition hover:bg-primary"
            href="/prestamos/nuevo"
          >
            <Plus className="h-4 w-4" />
            Nuevo prestamo
          </Link>
        </header>

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <SummaryCard icon={<BriefcaseBusiness className="h-6 w-6" />} label="Carteras" subtext="creadas" value={String(totals.portfolios)} />
          <SummaryCard icon={<UserRound className="h-6 w-6" />} label="Clientes" subtext="con prestamos asignados" value={String(totals.clients)} />
          <SummaryCard icon={<Landmark className="h-6 w-6" />} label="Prestamos" subtext="en carteras" value={String(totals.loans)} />
          <SummaryCard icon={<WalletCards className="h-6 w-6" />} label="Balance" subtext="pendiente" value={formatDop(totals.balance, { space: true })} />
        </div>

        {error ? (
          <section className="rounded-panel border border-state-danger/30 bg-state-danger-bg p-6 text-sm font-bold text-state-danger shadow-card">
            {error}
          </section>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm font-medium text-text-secondary">Cargando carteras...</div>
        ) : portfolios.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-5">
            {portfolios.map((portfolio) => (
              <PortfolioCard key={portfolio.id} portfolio={portfolio} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
