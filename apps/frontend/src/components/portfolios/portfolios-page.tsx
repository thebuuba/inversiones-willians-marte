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
  if (status === 'ACTIVE') return 'bg-[#EAF6EF] text-[#285C43]';
  if (status === 'OVERDUE') return 'bg-[#FADCCB] text-[#9F3F25]';
  if (status === 'PAID') return 'bg-[#EEF0F2] text-[#555A58]';
  return 'bg-[#FFF1C7] text-[#7A5A0A]';
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
    <section className="flex min-h-[116px] items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF6EF] text-[#285C43]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A7F7D]">{label}</p>
        <p className="mt-2 truncate text-2xl font-bold leading-none text-[#151918]">{value}</p>
        <p className="mt-2 truncate text-sm font-medium text-[#5C6D63]">{subtext}</p>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-[#BFD7CB] bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF6EF] text-[#285C43]">
        <BriefcaseBusiness className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-[#173D2C]">No hay carteras creadas</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-[#5C6D63]">
        Crea una cartera al registrar un préstamo nuevo para ver aquí sus clientes y códigos de préstamos.
      </p>
      <Link
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2f7654] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.22)] transition hover:bg-[#285c43]"
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
    <div className="rounded-2xl border border-[#EDF2EF] bg-[#FBFCFB] p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <Link className="group flex min-w-0 items-center gap-3" href={`/clientes/${group.id}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF6EF] text-[#285C43]">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-[#151918] group-hover:text-[#285C43]">{group.name}</p>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#A7B5AD] transition group-hover:translate-x-0.5 group-hover:text-[#285C43]" />
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-[#5C6D63]">
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
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#5C6D63]">Prestado</p>
            <p className="mt-1 font-bold text-[#151918]">{formatDop(group.principal, { space: true })}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#5C6D63]">Balance</p>
            <p className="mt-1 font-bold text-[#151918]">{formatDop(group.balance, { space: true })}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {group.loans.map((loan) => (
          <Link
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#DDEBE3] bg-white px-3 text-xs font-bold text-[#3F4542] shadow-[0_4px_10px_rgba(40,92,67,0.06)] transition hover:-translate-y-0.5 hover:border-[#B8DCC5] hover:text-[#285C43]"
            href={`/prestamos/${loan.id}`}
            key={loan.id}
            title={`Abrir prestamo #${loan.loanNumber}`}
          >
            <span>#{loan.loanNumber}</span>
            <span className={`rounded-full px-2 py-1 ${statusClass(loan.status)}`}>{statusLabel(loan.status)}</span>
            <span className="text-[#5C6D63]">{formatDop(loan.balance, { space: true })}</span>
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
    <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#EDF2EF] px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: portfolio.color }}
          >
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-[#173D2C]">{portfolio.name}</h2>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[#5C6D63]">
              {portfolio.description ?? 'Cartera de prestamos'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right text-sm max-sm:text-left">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#5C6D63]">Clientes</p>
            <p className="mt-1 font-bold text-[#151918]">{clientGroups.length}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#5C6D63]">Prestamos</p>
            <p className="mt-1 font-bold text-[#151918]">{portfolio._count.loans}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#5C6D63]">Balance</p>
            <p className="mt-1 font-bold text-[#151918]">{formatDop(totalBalance, { space: true })}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {clientGroups.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#DDEBE3] bg-[#FBFCFB] px-4 py-8 text-center text-sm font-medium text-[#5C6D63]">
            Sin prestamos asignados
          </p>
        ) : (
          clientGroups.map((group) => <ClientRow group={group} key={group.id} />)
        )}
      </div>

      {clientGroups.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDF2EF] px-6 py-4 text-sm font-medium text-[#5C6D63]">
          <span>Total colocado: <strong className="text-[#151918]">{formatDop(totalPrincipal, { space: true })}</strong></span>
          <span>Balance pendiente: <strong className="text-[#151918]">{formatDop(totalBalance, { space: true })}</strong></span>
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
    <main className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#173D2C]">
      <div className="mx-auto max-w-[1640px]">
        <header className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#5C6D63]">GESTION</p>
            <h1 className="mt-1.5 text-[28px] font-bold leading-tight text-[#151918]">Carteras</h1>
            <p className="mt-1.5 text-base font-medium text-[#7A7F7D]">
              Consulta las carteras creadas, sus clientes y los prestamos asociados.
            </p>
          </div>
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2f7654] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.22)] transition hover:-translate-y-0.5 hover:bg-[#285c43]"
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
          <section className="rounded-2xl border border-[#FADCCB] bg-white p-6 text-sm font-bold text-[#9F3F25] shadow-sm">
            {error}
          </section>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm font-medium text-[#5C6D63]">Cargando carteras...</div>
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
