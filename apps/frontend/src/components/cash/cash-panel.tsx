'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Calendar,
  CreditCard,
  Plus,
  Repeat2,
  Search,
  Wallet,
} from 'lucide-react';
import { MovementModal, type MovementFormValues } from './movement-modal';
import {
  createManualCashMovement,
  getCashLedger,
  type CashLedgerDay,
  type CashLedgerMovement,
} from '@/lib/api/cash';
import { getStaggerDelay } from '@/lib/animation';
import { formatDop, formatSignedDop, parseCurrencyInput } from '@/lib/currency';
import {
  buildManualCashMovementDate,
  filterCashMovements,
  type CashMovementFilter,
} from './cash-ledger.helpers';

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

function formatOfficeTime(date: string) {
  return new Intl.DateTimeFormat('es-DO', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Santo_Domingo',
  }).format(new Date(date));
}

function categoryTone(category: string): TagTone {
  const tones: Record<string, TagTone> = {
    'Pago de préstamo': 'green',
    Desembolso: 'orange',
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
      className={`rounded-2xl border border-border-soft bg-card shadow-sm ${className}`}
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      {children}
    </motion.section>
  );
}

function Header({ onNewMovement }: { onNewMovement: () => void }) {
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
        <h1 className="mt-3 text-[28px] font-bold leading-tight text-text-primary">Caja</h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Entradas y salidas generadas por las operaciones del negocio.
        </p>
      </div>
      <button
        className="flex h-11 items-center gap-2 rounded-full bg-primary-accent px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.22)] transition hover:-translate-y-0.5"
        onClick={onNewMovement}
        type="button"
      >
        <Plus className="h-4 w-4" />
        Movimiento manual
      </button>
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
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${iconTone}`}>
          {icon}
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.09em] text-text-secondary">{title}</p>
      </div>
      <p className={`mt-6 text-[28px] font-bold leading-none ${value.includes('-') ? 'text-state-danger' : 'text-text-primary'}`}>
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
        <div className="flex shrink-0 items-center gap-1 rounded-[12px] bg-surface-subtle p-1">
          {tabs.map((tab) => (
            <button
              className={`h-9 rounded-[10px] px-4 text-sm font-semibold transition ${
                filter === tab.value
                  ? 'bg-primary-soft text-text-primary shadow-sm'
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
        <label className="flex h-10 items-center gap-2 rounded-full border border-primary-border bg-card px-4 text-text-secondary">
          <Calendar className="h-4 w-4" />
          <input
            className="bg-transparent text-sm font-semibold text-text-primary outline-none"
            onChange={(event) => onDateChange(event.target.value)}
            type="date"
            value={date}
          />
        </label>
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
    green: 'bg-primary-soft text-text-primary',
    orange: 'bg-[#FFE3D2] text-state-danger',
    blue: 'bg-[#D8E9FF] text-state-info',
    purple: 'bg-[#E8DDF6] text-[#6F55A5]',
    yellow: 'bg-state-warning-bg text-state-warning',
    gray: 'bg-surface-muted-ui text-text-secondary border border-primary-border',
  }[tone];
  const Icon =
    icon === 'Transferencia' ? Repeat2 : icon === 'Tarjeta' ? CreditCard : icon ? Banknote : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

function TransactionItem({ movement }: { movement: CashLedgerMovement }) {
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
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${isIncome ? 'bg-primary-soft text-text-primary' : 'bg-[#FFE3D2] text-state-danger'}`}
        >
          <DirectionIcon className="h-4 w-4" />
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted-ui text-xs font-bold text-text-secondary">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-text-primary">{movement.person}</h3>
            <span className="text-text-secondary">·</span>
            <span className="text-xs text-text-secondary">{movement.code}</span>
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
      <div className="text-right">
        <p
          className={`text-base font-bold tabular-nums ${!movement.affectsBalance ? 'text-[#7A6A45]' : isIncome ? 'text-text-primary' : 'text-[#A65B3D]'}`}
        >
          {formatSignedDop(movement.amount, { negative: !isIncome })}
        </p>
        <p className="mt-1 text-xs text-[#A9B8AE]">{formatOfficeTime(movement.movementDate)}</p>
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

  const { totals } = ledger;
  const balanceMovements = ledger.movements.filter((movement) => movement.affectsBalance);
  const externalIncomeCount = ledger.movements.filter(
    (movement) => !movement.affectsBalance && movement.type === 'IN',
  ).length;
  const externalExpenseCount = ledger.movements.filter(
    (movement) => !movement.affectsBalance && movement.type === 'OUT',
  ).length;

  return (
    <div className="min-h-screen bg-page p-5 font-sans text-text-primary">
      <Header onNewMovement={() => setIsModalOpen(true)} />

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
        onFilterChange={setFilter}
        onSearchChange={setSearch}
        search={search}
      />

      <motion.section animate="visible" initial="hidden" variants={fadeUp}>
        <div className="mb-3 flex items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-text-secondary" />
            <p className="text-sm font-bold capitalize text-text-primary">
              {formatOfficeDate(date)}
              <span className="px-2 text-text-secondary">·</span>
              <span className="font-medium text-[#A9B8AE]">
                {visibleMovements.length} movimientos
              </span>
            </p>
          </div>
          <div className="hidden items-center gap-5 text-sm font-bold sm:flex">
            <span className="text-text-primary">+{formatDop(totals.income)}</span>
            <span className="text-[#A65B3D]">−{formatDop(totals.expense)}</span>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border-soft bg-card shadow-sm">
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
              <TransactionItem key={`${movement.sourceType}-${movement.id}`} movement={movement} />
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
