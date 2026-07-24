'use client';

import Link from 'next/link';
import { forwardRef, useCallback, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import {
  ArrowRight,
  BriefcaseBusiness,
  Landmark,
  Plus,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { formatDop } from '@/lib/currency';
import {
  createPortfolio,
  deletePortfolio,
  getPortfolios,
  type PortfolioItem,
} from '@/lib/api/portfolios';
import { useAuth } from '@/lib/auth-context';
import { invalidateCache, useClientCache } from '@/lib/use-client-cache';

const portfolioColors = ['#2F7654', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <section className="flex min-h-[108px] items-center gap-4 rounded-panel border border-border-soft bg-card p-5 shadow-card">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-secondary">{label}</p>
        <p className="mt-2 text-2xl font-bold leading-none text-text-primary">{value}</p>
      </div>
    </section>
  );
}

interface PortfolioCardProps {
  portfolio: PortfolioItem;
  index: number;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
}

const PortfolioCard = forwardRef<HTMLElement, PortfolioCardProps>(function PortfolioCard(
  { portfolio, index, canDelete, deleting, onDelete },
  ref,
) {
  const loans = portfolio.loans ?? [];
  const clients = new Set(loans.map((loan) => loan.client.id)).size;
  const balance = portfolio.totals?.balance ?? loans.reduce((sum, loan) => sum + loan.balance, 0);

  return (
    <motion.article
      animate={{ opacity: 1, x: 0 }}
      className="relative min-h-[230px] rounded-panel border border-border-soft bg-card shadow-card transition hover:border-primary-border hover:shadow-action"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0, x: -16 }}
      layout="position"
      ref={ref}
      transition={{
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1],
        layout: {
          delay: Math.min(index * 0.045, 0.2),
          duration: 0.28,
          ease: [0.16, 1, 0.3, 1],
        },
      }}
    >
      <Link className="group flex min-h-[230px] flex-col p-6" href={`/carteras/${portfolio.id}`}>
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: portfolio.color }}
          >
            <BriefcaseBusiness className="h-6 w-6" />
          </div>
          <ArrowRight className="h-5 w-5 text-text-subtle transition group-hover:translate-x-1 group-hover:text-primary" />
        </div>

        <h2 className="mt-5 text-xl font-bold text-text-primary group-hover:text-primary">
          {portfolio.name}
        </h2>
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
            <p className="mt-1 truncate font-bold text-text-primary">
              {formatDop(balance, { space: true })}
            </p>
          </div>
        </div>
      </Link>
      {canDelete ? (
        <button
          aria-label={`Eliminar cartera ${portfolio.name}`}
          className="absolute right-12 top-5 flex h-9 w-9 items-center justify-center rounded-full text-text-subtle transition hover:bg-state-danger-bg hover:text-state-danger disabled:opacity-40"
          disabled={deleting}
          onClick={onDelete}
          title="Eliminar cartera"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </motion.article>
  );
});

export function PortfoliosPage() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [createdPortfolios, setCreatedPortfolios] = useState<PortfolioItem[]>([]);
  const [deletedPortfolioIds, setDeletedPortfolioIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState('');
  const [actionError, setActionError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(portfolioColors[0]);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const fetcher = useCallback(() => getPortfolios(), []);
  const { data, loading, error } = useClientCache(
    'portfolios:with-loans',
    fetcher,
    30_000,
    'Error al cargar carteras',
  );
  const portfolios = useMemo(
    () =>
      [...createdPortfolios, ...(data ?? [])].filter(
        (portfolio) => !deletedPortfolioIds.has(portfolio.id),
      ),
    [createdPortfolios, data, deletedPortfolioIds],
  );
  const totals = useMemo(() => {
    const loans = portfolios.flatMap((portfolio) => portfolio.loans ?? []);
    return {
      clients: new Set(loans.map((loan) => loan.client.id)).size,
      loans: loans.length,
      balance: portfolios.reduce((sum, portfolio) => sum + (portfolio.totals?.balance ?? 0), 0),
    };
  }, [portfolios]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2 || saving) return;
    setSaving(true);
    setCreateError('');
    try {
      const portfolio = await createPortfolio({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      setCreatedPortfolios((current) => [
        {
          ...portfolio,
          _count: { loans: 0 },
          totals: { principal: 0, balance: 0 },
          loans: [],
        },
        ...current,
      ]);
      invalidateCache('portfolios:with-loans');
      setCreateOpen(false);
      setName('');
      setDescription('');
      setColor(portfolioColors[0]);
    } catch {
      setCreateError('No se pudo crear la cartera. Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(portfolio: PortfolioItem) {
    if (
      !window.confirm(
        `¿Eliminar la cartera “${portfolio.name}”? Los préstamos asociados no se eliminarán.`,
      )
    ) {
      return;
    }

    setDeletingId(portfolio.id);
    setActionError('');
    setDeletedPortfolioIds((current) => new Set(current).add(portfolio.id));
    try {
      await deletePortfolio(portfolio.id);
      invalidateCache('portfolios:with-loans');
    } catch {
      setDeletedPortfolioIds((current) => {
        const restored = new Set(current);
        restored.delete(portfolio.id);
        return restored;
      });
      setActionError('No se pudo eliminar la cartera. Inténtalo nuevamente.');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <main className="min-h-screen bg-page p-5 font-sans text-text-primary">
      <div className="mx-auto max-w-[1640px]">
        <header className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-secondary">
              GESTIÓN
            </p>
            <h1 className="mt-1.5 text-[28px] font-bold leading-tight">Carteras</h1>
            <p className="mt-1.5 text-base font-medium text-text-secondary">
              Listados personalizados de clientes y sus préstamos.
            </p>
          </div>
          <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
            <Dialog.Trigger asChild>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-text-inverse shadow-action transition hover:bg-primary"
                type="button"
              >
                <Plus className="h-4 w-4" />
                Nueva cartera
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-panel border border-border-soft bg-card p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-xl font-bold">Nueva cartera</Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm font-medium text-text-secondary">
                      Crea un listado para organizar clientes y préstamos.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close
                    className="rounded-full p-2 text-text-secondary hover:bg-surface-subtle"
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </Dialog.Close>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleCreate}>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase text-text-secondary">
                      Nombre
                    </span>
                    <input
                      autoFocus
                      className="h-11 w-full rounded-control border border-primary-border bg-card px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ej. Cobros especiales"
                      required
                      minLength={2}
                      value={name}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase text-text-secondary">
                      Descripción opcional
                    </span>
                    <textarea
                      className="min-h-20 w-full resize-none rounded-control border border-primary-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Para qué utilizarás esta cartera"
                      value={description}
                    />
                  </label>
                  <fieldset>
                    <legend className="mb-2 text-xs font-bold uppercase text-text-secondary">
                      Color
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {portfolioColors.map((option) => (
                        <button
                          aria-label={`Seleccionar color ${option}`}
                          className={`h-8 w-8 rounded-full border-2 transition ${color === option ? 'scale-110 border-text-primary' : 'border-transparent'}`}
                          key={option}
                          onClick={() => setColor(option)}
                          style={{ backgroundColor: option }}
                          type="button"
                        />
                      ))}
                    </div>
                  </fieldset>

                  {createError ? (
                    <p className="rounded-control bg-state-danger-bg px-3 py-2 text-sm font-bold text-state-danger">
                      {createError}
                    </p>
                  ) : null}

                  <div className="flex justify-end gap-3 pt-2">
                    <Dialog.Close
                      className="h-10 rounded-full border border-primary-border px-5 text-sm font-bold text-text-secondary hover:bg-surface-subtle"
                      type="button"
                    >
                      Cancelar
                    </Dialog.Close>
                    <button
                      className="h-10 rounded-full bg-primary-accent px-5 text-sm font-bold text-white hover:bg-primary disabled:opacity-50"
                      disabled={name.trim().length < 2 || saving}
                      type="submit"
                    >
                      {saving ? 'Creando...' : 'Crear cartera'}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </header>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<BriefcaseBusiness className="h-6 w-6" />}
            label="Carteras"
            value={String(portfolios.length)}
          />
          <SummaryCard
            icon={<UserRound className="h-6 w-6" />}
            label="Clientes"
            value={String(totals.clients)}
          />
          <SummaryCard
            icon={<Landmark className="h-6 w-6" />}
            label="Préstamos"
            value={String(totals.loans)}
          />
          <SummaryCard
            icon={<WalletCards className="h-6 w-6" />}
            label="Balance"
            value={formatDop(totals.balance, { space: true })}
          />
        </div>

        {error ? (
          <section className="rounded-panel border border-state-danger/30 bg-state-danger-bg p-6 text-sm font-bold text-state-danger">
            {error}
          </section>
        ) : null}
        {actionError ? (
          <section className="mb-5 rounded-panel border border-state-danger/30 bg-state-danger-bg p-4 text-sm font-bold text-state-danger">
            {actionError}
          </section>
        ) : null}
        {loading && portfolios.length === 0 ? (
          <div className="py-20 text-center text-sm font-medium text-text-secondary">
            Cargando carteras...
          </div>
        ) : portfolios.length === 0 ? (
          <section className="rounded-panel border border-dashed border-primary-border bg-card p-10 text-center shadow-card">
            <BriefcaseBusiness className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 text-lg font-bold">No hay carteras creadas</h2>
            <p className="mt-2 text-sm font-medium text-text-secondary">
              Usa “Nueva cartera” para crear tu primer listado.
            </p>
          </section>
        ) : (
          <MotionConfig reducedMotion="user">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              <AnimatePresence initial={false} mode="popLayout">
                {portfolios.map((portfolio, index) => (
                  <PortfolioCard
                    canDelete={user?.role === 'ADMIN'}
                    deleting={deletingId === portfolio.id}
                    index={index}
                    key={portfolio.id}
                    onDelete={() => void handleDelete(portfolio)}
                    portfolio={portfolio}
                  />
                ))}
              </AnimatePresence>
            </div>
          </MotionConfig>
        )}
      </div>
    </main>
  );
}
