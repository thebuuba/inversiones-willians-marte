'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Plus,
  Printer,
  Repeat2,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';
import { MovementModal, type MovementFormValues } from './movement-modal';
import {
  createManualCashMovement,
  deleteCashMovement,
  getCashLedger,
  type CashLedgerDay,
  type CashLedgerMovement,
} from '@/lib/api/cash';
import { getStaggerDelay } from '@/lib/animation';
import { formatDop, formatSignedDop, parseCurrencyInput } from '@/lib/currency';
import {
  buildCashClosingPrintDocument,
  buildManualCashMovementDate,
  filterCashMovements,
  shiftCashLedgerDate,
  type CashMovementFilter,
} from './cash-ledger.helpers';
import { getSettings } from '@/lib/api/settings';

type TagTone = 'green' | 'orange' | 'blue' | 'purple' | 'yellow' | 'gray';

const emptyLedger: CashLedgerDay = {
  date: '',
  movements: [],
  totals: { openingBalance: 0, income: 0, expense: 0, balance: 0 },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: getStaggerDelay(index, 0.055) },
  }),
};

function todayInOffice() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' });
}

function formatOfficeDate(date: string) {
  return new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Santo_Domingo',
  }).format(new Date(`${date}T12:00:00-04:00`));
}

function categoryTone(category: string): TagTone {
  const tones: Record<string, TagTone> = {
    'Pago de préstamo': 'green',
    'Entrada manual': 'green',
    Desembolso: 'orange',
    'Salida manual': 'orange',
    'Gasto operativo': 'blue',
    'Ingreso de inversionista': 'purple',
    'Pago a inversionista': 'yellow',
    'Retiro de socio': 'yellow',
  };
  return tones[category] ?? 'gray';
}

function ShellCard({
  children,
  className = '',
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.section
      animate="visible"
      className={`rounded-panel border border-border-soft bg-card shadow-card ${className}`}
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      {children}
    </motion.section>
  );
}

function Header({ onNewMovement, onPrint }: { onNewMovement: () => void; onPrint: () => void }) {
  return (
    <motion.header
      animate="visible"
      className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
      initial="hidden"
      variants={fadeUp}
    >
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-text-primary">
          <span className="h-2 w-2 rounded-full bg-primary-accent" />
          Libro diario de caja
        </span>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-text-primary">Caja</h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Entradas y salidas generadas por las operaciones del negocio.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="flex h-11 items-center gap-2 rounded-full border border-primary-border bg-card px-5 text-sm font-bold text-text-primary transition hover:bg-primary-soft"
          onClick={onPrint}
          type="button"
        >
          <Printer className="h-4 w-4" />
          Imprimir cuadre
        </button>
        <button
          className="flex h-11 items-center gap-2 rounded-full bg-primary-accent px-6 text-sm font-bold text-white shadow-action transition hover:-translate-y-0.5"
          onClick={onNewMovement}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Movimiento manual
        </button>
      </div>
    </motion.header>
  );
}

function SummaryCard({
  variant,
  icon,
  title,
  value,
  detail,
  index,
}: {
  variant: 'balance' | 'income' | 'expense';
  icon: ReactNode;
  title: string;
  value: string;
  detail: ReactNode;
  index: number;
}) {
  const isBalance = variant === 'balance';
  const iconTone = isBalance
    ? 'bg-card text-primary'
    : variant === 'expense'
      ? 'bg-state-danger-bg text-state-danger'
      : 'bg-state-success-bg text-state-success';

  return (
    <ShellCard
      className={isBalance ? 'border-primary-border bg-primary-soft p-5' : 'p-5'}
      index={index}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${iconTone}`}
        >
          {icon}
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.09em] text-text-secondary">{title}</p>
      </div>
      <p
        className={`mt-6 text-3xl font-bold leading-none ${value.includes('-') ? 'text-state-danger' : 'text-text-primary'}`}
      >
        {value}
      </p>
      <div className="mt-4 text-sm font-medium text-text-secondary">{detail}</div>
    </ShellCard>
  );
}

function FilterBar({
  date,
  filter,
  search,
  category,
  categories,
  onDateChange,
  onPreviousDate,
  onNextDate,
  onFilterChange,
  onSearchChange,
  onCategoryChange,
}: {
  date: string;
  filter: CashMovementFilter;
  search: string;
  category: string;
  categories: string[];
  onDateChange: (value: string) => void;
  onPreviousDate: () => void;
  onNextDate: () => void;
  onFilterChange: (value: CashMovementFilter) => void;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}) {
  const tabs: Array<{ label: string; value: CashMovementFilter }> = [
    { label: 'Todos', value: 'all' },
    { label: 'Entradas', value: 'in' },
    { label: 'Salidas', value: 'out' },
    { label: 'Externos', value: 'external' },
  ];

  return (
    <ShellCard className="mb-5 p-3.5" index={4}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="grid shrink-0 grid-cols-2 items-center gap-1 rounded-control bg-surface-subtle p-1 sm:flex">
          {tabs.map((tab) => (
            <button
              className={`h-11 rounded-control px-4 text-sm font-semibold transition sm:h-9 ${
                filter === tab.value
                  ? 'bg-primary-soft text-text-primary shadow-card'
                  : 'text-text-secondary hover:bg-card'
              }`}
              key={tab.value}
              onClick={() => onFilterChange(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex h-10 items-center rounded-full border border-primary-border bg-card text-text-secondary">
          <button
            aria-label="Día anterior"
            className="flex h-10 w-10 items-center justify-center rounded-l-full transition hover:bg-primary-soft hover:text-text-primary"
            onClick={onPreviousDate}
            title="Día anterior"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <label className="flex h-10 items-center gap-2 border-x border-primary-border px-3">
            <Calendar className="h-4 w-4" />
            <input
              className="w-[126px] bg-transparent text-sm font-semibold text-text-primary outline-none"
              onChange={(event) => {
                if (event.target.value) onDateChange(event.target.value);
              }}
              type="date"
              value={date}
            />
          </label>
          <button
            aria-label="Día siguiente"
            className="flex h-10 w-10 items-center justify-center rounded-r-full transition hover:bg-primary-soft hover:text-text-primary"
            onClick={onNextDate}
            title="Día siguiente"
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <label className="flex h-10 flex-1 items-center gap-3 rounded-full border border-primary-border bg-surface-subtle px-4 text-text-secondary xl:ml-auto xl:max-w-[340px]">
          <Search className="h-4 w-4 shrink-0" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar persona o concepto..."
            value={search}
          />
        </label>
        <select
          className="h-10 rounded-full border border-primary-border bg-card px-4 text-sm font-semibold text-text-primary outline-none"
          onChange={(event) => onCategoryChange(event.target.value)}
          value={category}
        >
          <option value="">Todas las categorías</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </ShellCard>
  );
}

function Tag({ label, tone, icon }: { label: string; tone: TagTone; icon?: string | null }) {
  const styles = {
    green: 'border border-[#79c99d] bg-[#dff5e7] text-[#08783f]',
    orange: 'border border-[#f0a39b] bg-[#fde8e6] text-[#b42318]',
    blue: 'bg-state-info-bg text-state-info',
    purple: 'bg-state-neutral-bg text-text-secondary',
    yellow: 'bg-state-warning-bg text-state-warning',
    gray: 'bg-surface-muted-ui text-text-secondary border border-primary-border',
  }[tone];
  const Icon =
    icon === 'Transferencia' ? Repeat2 : icon === 'Tarjeta' ? CreditCard : icon ? Banknote : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

function TransactionItem({
  movement,
  deleting,
  onDelete,
}: {
  movement: CashLedgerMovement;
  deleting: boolean;
  onDelete: (movement: CashLedgerMovement) => void;
}) {
  const isIncome = movement.type === 'IN';
  const DirectionIcon = isIncome ? ArrowDownLeft : ArrowUpRight;
  const initials = movement.person
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="grid min-h-[76px] grid-cols-[1fr_auto] items-center gap-4 border-b border-border-soft px-5 py-3.5 last:border-b-0 hover:bg-surface-subtle">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control border ${isIncome ? 'border-[#79c99d] bg-[#dff5e7] text-[#08783f]' : 'border-[#f0a39b] bg-[#fde8e6] text-[#b42318]'}`}
        >
          <DirectionIcon className="h-4 w-4" />
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted-ui text-xs font-bold text-text-secondary">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-text-primary">{movement.person}</h3>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">{movement.description}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Tag label={movement.category} tone={categoryTone(movement.category)} />
            {!movement.affectsBalance && (
              <Tag label="Externo · No afecta el cuadre" tone="yellow" />
            )}
            {movement.paymentMethod && (
              <Tag icon={movement.paymentMethod} label={movement.paymentMethod} tone="gray" />
            )}
            <Tag label={`Registrado por ${movement.registeredBy}`} tone="gray" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-right">
        <p
          className={`text-base font-bold tabular-nums ${!movement.affectsBalance ? 'text-text-muted' : isIncome ? 'text-[#08783f]' : 'text-[#b42318]'}`}
        >
          {formatSignedDop(movement.amount, { negative: !isIncome })}
        </p>
        <button
          aria-label={`Eliminar movimiento de ${movement.person}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-[#b42318] transition hover:bg-[#fde8e6] disabled:cursor-wait disabled:opacity-50"
          disabled={deleting}
          onClick={() => onDelete(movement)}
          title="Eliminar movimiento"
          type="button"
        >
          <Trash2 className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}

export function CashPanel() {
  const [date, setDate] = useState(todayInOffice);
  const [ledger, setLedger] = useState<CashLedgerDay>(emptyLedger);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<CashMovementFilter>('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [companyName, setCompanyName] = useState('Inversiones Willians Marte');
  const requestIdRef = useRef(0);

  const loadLedger = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const result = await getCashLedger(date);
      if (requestId === requestIdRef.current) setLedger(result);
    } catch {
      if (requestId === requestIdRef.current) setError('No se pudo cargar el libro de caja.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    queueMicrotask(() => void loadLedger());
  }, [loadLedger]);

  useEffect(() => {
    getSettings()
      .then((settings) => setCompanyName(settings.companyName))
      .catch(() => undefined);
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(ledger.movements.map((movement) => movement.category))).sort(),
    [ledger.movements],
  );
  const visibleMovements = useMemo(
    () => filterCashMovements(ledger.movements, filter, search, category),
    [category, filter, ledger.movements, search],
  );

  const handleCreateMovement = useCallback(
    async (values: MovementFormValues) => {
      if (!values.type) return;
      const amount = parseCurrencyInput(values.amount);
      await createManualCashMovement({
        type: values.type === 'in' ? 'IN' : 'OUT',
        person: values.person,
        amount,
        movementDate: buildManualCashMovementDate(date),
        paymentMethod: values.method,
        description: values.description,
        affectsBalance: values.affectsBalance,
      });

      await loadLedger();
      setIsModalOpen(false);
    },
    [date, loadLedger],
  );

  const handleDeleteMovement = useCallback(
    async (movement: CashLedgerMovement) => {
      if (
        !window.confirm(
          `¿Eliminar de Caja el movimiento de ${movement.person} por ${formatDop(movement.amount)}?`,
        )
      ) {
        return;
      }

      setDeletingId(movement.id);
      setMutationError('');
      try {
        await deleteCashMovement(movement.id, movement.sourceType);
        await loadLedger();
      } catch {
        setMutationError('No se pudo eliminar el movimiento de Caja.');
      } finally {
        setDeletingId('');
      }
    },
    [loadLedger],
  );

  function handlePrint() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.opener = null;
    printWindow.document.write(buildCashClosingPrintDocument({ ...ledger, date }, companyName));
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  const { totals } = ledger;
  const balanceMovements = ledger.movements.filter((movement) => movement.affectsBalance);
  const externalIncomeCount = ledger.movements.filter(
    (movement) => !movement.affectsBalance && movement.type === 'IN',
  ).length;
  const externalExpenseCount = ledger.movements.filter(
    (movement) => !movement.affectsBalance && movement.type === 'OUT',
  ).length;

  return (
    <div className="min-h-screen overflow-x-hidden bg-page p-4 font-sans text-text-primary sm:p-5">
      <Header onNewMovement={() => setIsModalOpen(true)} onPrint={handlePrint} />

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SummaryCard
          detail={<span>Entradas del día menos salidas del día</span>}
          icon={<Wallet className="h-5 w-5" />}
          index={1}
          title="CUADRE DEL DÍA"
          value={formatDop(totals.balance)}
          variant="balance"
        />
        <SummaryCard
          detail={
            <span>
              {balanceMovements.filter((movement) => movement.type === 'IN').length} entradas en el
              cuadre
              {externalIncomeCount > 0 ? ` · ${externalIncomeCount} externas registradas` : ''}
            </span>
          }
          icon={<ArrowDownLeft className="h-5 w-5" />}
          index={2}
          title="ENTRADAS"
          value={formatDop(totals.income)}
          variant="income"
        />
        <SummaryCard
          detail={
            <span>
              {balanceMovements.filter((movement) => movement.type === 'OUT').length} salidas en el
              cuadre
              {externalExpenseCount > 0 ? ` · ${externalExpenseCount} externas registradas` : ''}
            </span>
          }
          icon={<ArrowUpRight className="h-5 w-5" />}
          index={3}
          title="SALIDAS"
          value={formatDop(totals.expense)}
          variant="expense"
        />
      </div>

      <FilterBar
        categories={categories}
        category={category}
        date={date}
        filter={filter}
        onCategoryChange={setCategory}
        onDateChange={setDate}
        onNextDate={() => setDate((current) => shiftCashLedgerDate(current, 1))}
        onPreviousDate={() => setDate((current) => shiftCashLedgerDate(current, -1))}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
        search={search}
      />

      {mutationError && (
        <p className="mb-4 rounded-control border border-state-danger/30 bg-state-danger-bg px-4 py-3 text-sm font-semibold text-state-danger">
          {mutationError}
        </p>
      )}

      <motion.section animate="visible" initial="hidden" variants={fadeUp}>
        <div className="mb-3 flex items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-text-secondary" />
            <p className="text-sm font-bold capitalize text-text-primary">
              {formatOfficeDate(date)}
              <span className="px-2 text-text-secondary">·</span>
              <span className="font-medium text-text-muted">
                {visibleMovements.length} movimientos
              </span>
            </p>
          </div>
          <div className="hidden items-center gap-5 text-sm font-bold sm:flex">
            <span className="text-text-primary">+{formatDop(totals.income)}</span>
            <span className="text-text-secondary">−{formatDop(totals.expense)}</span>
          </div>
        </div>
        <div className="overflow-hidden rounded-panel border border-border-soft bg-card shadow-card">
          {loading && (
            <p className="px-5 py-16 text-center text-sm font-medium text-text-secondary">
              Cargando movimientos...
            </p>
          )}
          {!loading && error && (
            <p className="px-5 py-16 text-center text-sm font-medium text-state-danger">{error}</p>
          )}
          {!loading && !error && visibleMovements.length === 0 && (
            <p className="px-5 py-16 text-center text-sm font-medium text-text-secondary">
              No hay movimientos para esta fecha y filtros.
            </p>
          )}
          {!loading &&
            !error &&
            visibleMovements.map((movement) => (
              <TransactionItem
                deleting={deletingId === movement.id}
                key={`${movement.sourceType}-${movement.id}`}
                movement={movement}
                onDelete={handleDeleteMovement}
              />
            ))}
        </div>
      </motion.section>

      <MovementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateMovement}
      />
    </div>
  );
}
