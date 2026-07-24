'use client';

import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Phone, Sparkles, UserRound, X } from 'lucide-react';
import { getPortfolio, type PortfolioLoan } from '@/lib/api/portfolios';
import { formatDop } from '@/lib/currency';
import { useClientCache } from '@/lib/use-client-cache';

interface ClientGroup {
  id: number;
  name: string;
  identification: string | null;
  phone: string | null;
  loans: PortfolioLoan[];
  balance: number;
}

function groupByClient(loans: PortfolioLoan[]) {
  const groups = new Map<number, ClientGroup>();
  for (const loan of loans) {
    const current = groups.get(loan.client.id);
    if (current) {
      current.loans.push(loan);
      current.balance += loan.balance;
    } else {
      groups.set(loan.client.id, {
        id: loan.client.id,
        name: `${loan.client.firstName} ${loan.client.lastName}`.trim(),
        identification: loan.client.identification,
        phone: loan.client.phone,
        loans: [loan],
        balance: loan.balance,
      });
    }
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const statusNames: Record<string, string> = {
  ACTIVE: 'Activo',
  OVERDUE: 'Atrasado',
  PAID: 'Pagado',
  RESTRUCTURED: 'Reestructurado',
  WRITTEN_OFF: 'Castigado',
};

export function PortfolioDetailPage({ portfolioId }: { portfolioId: string }) {
  const fetcher = useCallback(() => getPortfolio(portfolioId), [portfolioId]);
  const { data: portfolio, loading, error } = useClientCache(`portfolio:${portfolioId}`, fetcher, 30_000, 'Error al cargar la cartera');
  const clients = useMemo(() => groupByClient(portfolio?.loans ?? []), [portfolio]);

  if (loading) return <main className="min-h-screen bg-page p-5 text-center text-sm text-text-secondary">Cargando cartera...</main>;
  if (error || !portfolio) return <main className="min-h-screen bg-page p-5 text-sm font-bold text-state-danger">{error || 'Cartera no encontrada'}</main>;

  return (
    <main className="min-h-screen bg-page px-4 py-4 font-sans text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px]">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-primary" href="/carteras">
          <ArrowLeft className="h-4 w-4" />
          Volver a carteras
        </Link>

        <header className="mt-4 flex flex-col gap-4 rounded-panel border border-border-soft bg-card px-5 py-4 shadow-card md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: portfolio.color }}>
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">{portfolio.name}</h1>
              <p className="mt-0.5 text-sm font-medium text-text-secondary">{portfolio.description ?? 'Listado personalizado de clientes y préstamos.'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div><p className="text-[11px] font-bold uppercase text-text-secondary">Clientes</p><p className="mt-0.5 text-lg font-bold">{clients.length}</p></div>
            <div><p className="text-[11px] font-bold uppercase text-text-secondary">Préstamos</p><p className="mt-0.5 text-lg font-bold">{portfolio._count.loans}</p></div>
            <div><p className="text-[11px] font-bold uppercase text-text-secondary">Balance</p><p className="mt-0.5 text-lg font-bold">{formatDop(portfolio.totals?.balance ?? 0, { space: true })}</p></div>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button className="inline-flex h-10 items-center gap-2 rounded-full border border-primary-border bg-primary-soft px-4 text-sm font-bold text-primary transition hover:bg-primary hover:text-white" type="button">
                  <Sparkles className="h-4 w-4" />
                  Asistente IA
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
                <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border-soft bg-card p-5 shadow-2xl">
                  <div className="flex items-start justify-between gap-4 border-b border-border-soft pb-4">
                    <div>
                      <span className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">Próximamente</span>
                      <Dialog.Title className="mt-3 flex items-center gap-2 text-xl font-bold">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Asistente de cartera
                      </Dialog.Title>
                      <Dialog.Description className="mt-1 text-sm font-medium text-text-secondary">
                        Preparado para trabajar únicamente con {portfolio.name}.
                      </Dialog.Description>
                    </div>
                    <Dialog.Close className="rounded-full p-2 text-text-secondary transition hover:bg-surface-subtle hover:text-text-primary" aria-label="Cerrar">
                      <X className="h-5 w-5" />
                    </Dialog.Close>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-panel bg-surface-subtle p-3"><p className="text-[10px] font-bold uppercase text-text-secondary">Clientes</p><p className="mt-1 text-lg font-bold">{clients.length}</p></div>
                    <div className="rounded-panel bg-surface-subtle p-3"><p className="text-[10px] font-bold uppercase text-text-secondary">Préstamos</p><p className="mt-1 text-lg font-bold">{portfolio._count.loans}</p></div>
                    <div className="rounded-panel bg-surface-subtle p-3"><p className="text-[10px] font-bold uppercase text-text-secondary">Balance</p><p className="mt-1 truncate text-sm font-bold">{formatDop(portfolio.totals?.balance ?? 0, { space: true })}</p></div>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Ejemplos de órdenes</p>
                    <div className="mt-3 space-y-2">
                      {[
                        'Aplicar RD$1,000 a cada préstamo activo',
                        'Cobrar las cuotas vencidas',
                        'Distribuir RD$20,000 entre los préstamos atrasados',
                      ].map((example) => (
                        <div className="rounded-panel border border-border-soft px-4 py-3 text-sm font-medium text-text-primary" key={example}>
                          “{example}”
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto rounded-panel border border-primary-border bg-primary-soft p-4">
                    <p className="text-sm font-bold text-primary">Los cobros todavía no están habilitados</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-text-secondary">
                      Antes de activarlos se añadirá la vista previa, validación y confirmación de cada pago.
                    </p>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </header>

        <section className="mt-4 space-y-3">
          {clients.length === 0 ? (
            <div className="rounded-panel border border-dashed border-primary-border bg-card p-10 text-center text-sm font-medium text-text-secondary">Esta cartera todavía no tiene préstamos.</div>
          ) : clients.map((client) => (
            <article className="grid overflow-hidden rounded-panel border border-border-soft bg-card shadow-card lg:grid-cols-[minmax(260px,0.8fr)_minmax(520px,2.2fr)]" key={client.id}>
              <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3 lg:border-b-0 lg:border-r">
                <Link className="group flex min-w-0 items-center gap-3" href={`/clientes/${client.id}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"><UserRound className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold group-hover:text-primary">{client.name}<ArrowRight className="h-3.5 w-3.5 shrink-0" /></p>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-text-secondary">
                      {client.identification ?? 'Sin cédula'}
                      {client.phone ? <span className="ml-2 inline-flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span> : null}
                    </p>
                  </div>
                </Link>
                <div className="shrink-0 text-right lg:hidden"><p className="text-[10px] font-bold uppercase text-text-secondary">Balance</p><p className="text-sm font-bold">{formatDop(client.balance, { space: true })}</p></div>
              </div>

              <div className="divide-y divide-border-soft">
                {client.loans.map((loan) => (
                  <Link className="grid gap-2 px-4 py-3 transition hover:bg-surface-subtle sm:grid-cols-[1.4fr_0.7fr_0.9fr] sm:items-center" href={`/prestamos/${loan.id}`} key={loan.id}>
                    <div><p className="text-sm font-bold">Préstamo #{loan.loanNumber}</p><p className="mt-0.5 text-[11px] font-medium text-text-secondary">{loan.product.name}</p></div>
                    <div><p className="text-[10px] font-bold uppercase text-text-secondary">Estado</p><p className="mt-0.5 text-sm font-bold">{statusNames[loan.status] ?? loan.status}</p></div>
                    <div className="sm:text-right"><p className="text-[10px] font-bold uppercase text-text-secondary">Balance</p><p className="mt-0.5 text-sm font-bold">{formatDop(loan.balance, { space: true })}</p></div>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
