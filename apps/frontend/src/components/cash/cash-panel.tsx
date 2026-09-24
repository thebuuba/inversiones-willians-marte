'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Banknote,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileCheck2,
  LockKeyhole,
  MoreHorizontal,
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
import {
  formatCurrencyInput,
  formatDop,
  formatSignedDop,
  parseCurrencyInput,
} from '@/lib/currency';
import {
  buildCashClosingPrintDocument,
  buildManualCashMovementDate,
  filterCashMovements,
  shiftCashLedgerDate,
  type CashMovementFilter,
} from './cash-ledger.helpers';
import { getSettings } from '@/lib/api/settings';
import { CircleProgress } from '@/components/ui/circle-progress';
import { cn } from '@/lib/utils';

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
      className={cn('rounded-panel bg-card shadow-card', className)}
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
      className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"
      initial="hidden"
      variants={fadeUp}
    >
      <div>
        <h1 className="text-[30px] font-extrabold leading-tight text-text-primary">Caja</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Entradas y salidas generadas por las operaciones del negocio.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="flex h-11 items-center gap-2 rounded-[18px] bg-card px-5 text-sm font-bold text-text-primary shadow-card transition hover:bg-surface-subtle"
          onClick={onPrint}
          type="button"
        >
          <Printer className="h-4 w-4 text-brand-sky" />
          Imprimir cuadre
        </button>
        <button
          className="flex h-11 items-center gap-2 rounded-[18px] bg-brand-sky px-5 text-sm font-bold text-white shadow-action transition hover:bg-primary"
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
  percent,
}: {
  variant: 'balance' | 'income' | 'expense' | 'external';
  icon: ReactNode;
  title: string;
  value: string;
  detail: ReactNode;
  index: number;
  percent: number;
}) {
  const isBalance = variant === 'balance';
  const iconTone = isBalance
    ? 'bg-card text-brand-sky'
    : variant === 'expense'
      ? 'bg-rose-100 text-rose-500'
      : variant === 'external'
        ? 'bg-amber-100 text-amber-600'
        : 'bg-emerald-100 text-emerald-600';
  const ringColor = isBalance
    ? '#fff'
    : variant === 'income'
      ? '#0eaa7d'
      : variant === 'expense'
        ? '#ef4265'
        : '#e9eef6';

  return (
    <ShellCard
      className={cn(
        'relative flex h-[160px] flex-col justify-between overflow-hidden p-5',
        isBalance
          ? 'bg-brand-sky text-white shadow-[0_20px_25px_-5px_rgba(65,159,236,0.30),0_8px_10px_-6px_rgba(65,159,236,0.30)]'
          : 'bg-card',
      )}
      index={index}
    >
      {isBalance && (
        <>
          <span className="pointer-events-none absolute -right-5 -top-12 h-32 w-32 rounded-full bg-white/10" />
          <span className="pointer-events-none absolute -bottom-16 right-10 h-28 w-28 rounded-full bg-white/10" />
        </>
      )}
      <div className="relative">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconTone}`}
        >
          {icon}
        </div>
      </div>
      <div className="relative flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-1 text-lg font-extrabold leading-none">{value}</p>
          <div
            className={`mt-1.5 truncate text-xs ${isBalance ? 'text-white/85' : 'text-text-secondary'}`}
          >
            {detail}
          </div>
        </div>
        <CircleProgress value={percent} color={ringColor} blue={isBalance} />
      </div>
    </ShellCard>
  );
}

function FilterBar({
  date,
  filter,
  search,
  category,
  categories,
  counts,
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
  counts: Record<CashMovementFilter, number>;
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
    <ShellCard className="mb-7 p-3" index={4}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="grid shrink-0 grid-cols-2 items-center gap-1 rounded-[20px] bg-surface-subtle p-1 sm:flex">
          {tabs.map((tab) => (
            <button
              className={`h-11 rounded-[16px] px-4 text-sm font-semibold transition sm:h-9 ${
                filter === tab.value
                  ? 'bg-card text-brand-sky shadow-card'
                  : 'text-text-secondary hover:bg-card'
              }`}
              key={tab.value}
              onClick={() => onFilterChange(tab.value)}
              type="button"
            >
              {tab.label}{' '}
              <span
                className={`ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${filter === tab.value ? 'bg-brand-sky text-white' : 'bg-slate-200/60 text-text-secondary'}`}
              >
                {counts[tab.value]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex h-10 items-center rounded-full bg-surface-subtle text-text-secondary">
          <button
            aria-label="Día anterior"
            className="flex h-10 w-10 items-center justify-center rounded-l-full transition hover:bg-blue-100 hover:text-text-primary"
            onClick={onPreviousDate}
            title="Día anterior"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <label className="flex h-10 items-center gap-2 px-2">
            <Calendar className="h-4 w-4 text-brand-sky" />
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
            className="flex h-10 w-10 items-center justify-center rounded-r-full transition hover:bg-blue-100 hover:text-text-primary"
            onClick={onNextDate}
            title="Día siguiente"
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <label className="flex h-10 flex-1 items-center gap-3 rounded-[18px] bg-surface-subtle px-4 text-text-secondary xl:ml-auto xl:max-w-[340px]">
          <Search className="h-4 w-4 shrink-0" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar persona o concepto..."
            value={search}
          />
        </label>
        <select
          className="h-10 rounded-[18px] bg-surface-subtle px-4 text-sm font-semibold text-text-primary outline-none"
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

function Tag({ label, tone }: { label: string; tone: TagTone }) {
  const styles = {
    green: 'bg-emerald-100 text-emerald-700',
    orange: 'bg-rose-100 text-rose-600',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-violet-100 text-violet-700',
    yellow: 'bg-amber-100 text-amber-700',
    gray: 'bg-surface-subtle text-text-secondary',
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles}`}
    >
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
  const time = new Intl.DateTimeFormat('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santo_Domingo',
  }).format(new Date(movement.movementDate));

  return (
    <div
      className={`grid min-h-[77px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border-soft px-5 py-3 last:border-b-0 hover:bg-surface-subtle ${!movement.affectsBalance ? 'bg-amber-50/50' : ''}`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] ${!movement.affectsBalance ? 'bg-amber-100 text-amber-600' : isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}
        >
          <DirectionIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-sm font-bold text-text-primary">{movement.person}</h3>
            <Tag label={movement.category} tone={categoryTone(movement.category)} />
            {!movement.affectsBalance && <Tag label="Externo" tone="yellow" />}
          </div>
          <p className="mt-1 truncate text-xs text-text-secondary">
            {time} <span className="px-1">·</span> {movement.paymentMethod || 'Sin método'}{' '}
            <span className="px-1">·</span> {movement.description} <span className="px-1">·</span>{' '}
            por {movement.registeredBy}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-right">
        <p
          className={`text-sm font-extrabold tabular-nums ${!movement.affectsBalance ? 'text-text-muted' : isIncome ? 'text-emerald-700' : 'text-rose-500'}`}
        >
          {formatSignedDop(movement.amount, { negative: !isIncome })}
        </p>
        <details className="relative">
          <summary
            aria-label={`Opciones de ${movement.person}`}
            className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-text-secondary hover:bg-surface-subtle"
          >
            <MoreHorizontal className="h-4 w-4" />
          </summary>
          <div className="absolute right-0 top-full z-10 min-w-40 rounded-[16px] bg-white p-1 shadow-card">
            <button
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              disabled={deleting}
              onClick={() => onDelete(movement)}
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar movimiento
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}

function MethodSummary({ movements }: { movements: CashLedgerMovement[] }) {
  const methods = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta'];
  const rows = methods
    .map((method) => ({
      method,
      amount: movements
        .filter(
          (movement) =>
            movement.affectsBalance &&
            movement.paymentMethod?.toLocaleLowerCase('es') === method.toLocaleLowerCase('es'),
        )
        .reduce((sum, movement) => sum + movement.amount * (movement.type === 'IN' ? 1 : -1), 0),
    }))
    .filter((row) => row.method !== 'Tarjeta' || row.amount !== 0);
  const unclassified = movements.filter(
    (movement) =>
      movement.affectsBalance &&
      (!movement.paymentMethod ||
        !methods.some(
          (method) =>
            method.toLocaleLowerCase('es') === movement.paymentMethod?.toLocaleLowerCase('es'),
        )),
  );
  if (unclassified.length > 0)
    rows.push({
      method: 'Sin método',
      amount: unclassified.reduce(
        (sum, movement) => sum + movement.amount * (movement.type === 'IN' ? 1 : -1),
        0,
      ),
    });
  const icons = {
    Efectivo: Banknote,
    Transferencia: Repeat2,
    Cheque: FileCheck2,
    Tarjeta: CreditCard,
    'Sin método': Wallet,
  };
  const tones = {
    Efectivo: 'bg-emerald-500',
    Transferencia: 'bg-sky-500',
    Cheque: 'bg-violet-500',
    Tarjeta: 'bg-indigo-500',
    'Sin método': 'bg-slate-400',
  };
  return (
    <ShellCard className="p-5">
      <h2 className="font-extrabold text-text-primary">Por método de pago</h2>
      <p className="mt-0.5 text-xs text-text-secondary">Neto del día (sin externos)</p>
      <div className="mt-5 space-y-4">
        {rows.map(({ method, amount }) => {
          const Icon = icons[method as keyof typeof icons];
          return (
            <div className="flex items-center gap-3" key={method}>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-card ${tones[method as keyof typeof tones]}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-sm font-semibold text-text-primary">{method}</span>
              <span
                className={`text-sm font-bold tabular-nums ${amount > 0 ? 'text-emerald-700' : amount < 0 ? 'text-rose-500' : 'text-text-secondary'}`}
              >
                {amount > 0 ? '+' : amount < 0 ? '−' : ''}
                {formatDop(Math.abs(amount))}
              </span>
            </div>
          );
        })}
      </div>
    </ShellCard>
  );
}

function ClosingSummary({ ledger }: { ledger: CashLedgerDay }) {
  const [counted, setCounted] = useState('');
  const cashNet = ledger.movements
    .filter(
      (movement) =>
        movement.affectsBalance && movement.paymentMethod?.toLocaleLowerCase('es') === 'efectivo',
    )
    .reduce((sum, movement) => sum + movement.amount * (movement.type === 'IN' ? 1 : -1), 0);
  const expected = ledger.totals.openingBalance + cashNet;
  const difference = counted ? parseCurrencyInput(counted) - expected : null;
  return (
    <ShellCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-text-primary">Cierre de caja</h2>
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-brand-sky">
          Abierta
        </span>
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-3 text-text-secondary">
          <dt>Fondo inicial</dt>
          <dd className="font-semibold text-text-primary">
            {formatDop(ledger.totals.openingBalance)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 text-text-secondary">
          <dt>Neto en efectivo</dt>
          <dd className="font-semibold text-text-primary">{formatDop(cashNet)}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-border-soft pt-3 font-bold text-text-primary">
          <dt>Efectivo esperado</dt>
          <dd>{formatDop(expected)}</dd>
        </div>
      </dl>
      <label className="mt-5 block">
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
          Efectivo contado
        </span>
        <span className="flex h-11 items-center gap-2 rounded-[18px] bg-surface-subtle px-4 text-sm text-text-secondary shadow-card">
          RD${' '}
          <input
            className="min-w-0 flex-1 bg-transparent font-semibold text-text-primary outline-none"
            inputMode="decimal"
            onChange={(event) => setCounted(formatCurrencyInput(event.target.value))}
            placeholder="0"
            value={counted}
          />
        </span>
      </label>
      {difference !== null && (
        <p
          className={`mt-2 text-xs font-semibold ${difference === 0 ? 'text-emerald-700' : 'text-rose-500'}`}
        >
          Diferencia: {formatSignedDop(Math.abs(difference), { negative: difference < 0 })}
        </p>
      )}
      <button
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[18px] bg-blue-300 text-sm font-bold text-white"
        disabled
        title="El registro de cierre aún no está disponible"
        type="button"
      >
        <LockKeyhole className="h-4 w-4" />
        Cerrar caja del día
      </button>
    </ShellCard>
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
        category: values.category || undefined,
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
  const externalMovements = ledger.movements.filter((movement) => !movement.affectsBalance);
  const incomeCount = balanceMovements.filter((movement) => movement.type === 'IN').length;
  const expenseCount = balanceMovements.filter((movement) => movement.type === 'OUT').length;
  const externalAmount = externalMovements.reduce((sum, movement) => sum + movement.amount, 0);
  const volume = totals.income + totals.expense;
  const incomePercent = volume ? Math.round((totals.income / volume) * 100) : 0;
  const expensePercent = volume ? Math.round((totals.expense / volume) * 100) : 0;
  const counts: Record<CashMovementFilter, number> = {
    all: ledger.movements.length,
    in: incomeCount,
    out: expenseCount,
    external: externalMovements.length,
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-page p-4 font-sans text-text-primary sm:p-5">
      <Header onNewMovement={() => setIsModalOpen(true)} onPrint={handlePrint} />

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <SummaryCard
          detail={<span>Entradas menos salidas</span>}
          icon={<Wallet className="h-5 w-5" />}
          index={1}
          title="Cuadre del día"
          value={
            totals.balance < 0
              ? `−${formatDop(Math.abs(totals.balance))}`
              : formatDop(totals.balance)
          }
          variant="balance"
          percent={incomePercent}
        />
        <SummaryCard
          detail={<span>{incomeCount} movimientos</span>}
          icon={<ArrowDownLeft className="h-5 w-5" />}
          index={2}
          title="Entradas"
          value={formatDop(totals.income)}
          variant="income"
          percent={incomePercent}
        />
        <SummaryCard
          detail={<span>{expenseCount} movimientos</span>}
          icon={<ArrowUpRight className="h-5 w-5" />}
          index={3}
          title="Salidas"
          value={formatDop(totals.expense)}
          variant="expense"
          percent={expensePercent}
        />
        <SummaryCard
          detail={<span>no afectan el cuadre</span>}
          icon={<AlertTriangle className="h-5 w-5" />}
          index={4}
          title="Externos"
          value={formatDop(externalAmount)}
          variant="external"
          percent={0}
        />
      </div>

      <FilterBar
        categories={categories}
        counts={counts}
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
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
              <span className="text-emerald-700">+{formatDop(totals.income)}</span>
              <span className="text-rose-500">−{formatDop(totals.expense)}</span>
            </div>
          </div>
          <div className="overflow-visible rounded-panel bg-card shadow-card">
            {loading && (
              <p className="px-5 py-16 text-center text-sm font-medium text-text-secondary">
                Cargando movimientos...
              </p>
            )}
            {!loading && error && (
              <p className="px-5 py-16 text-center text-sm font-medium text-state-danger">
                {error}
              </p>
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
        <aside className="space-y-5">
          <MethodSummary movements={ledger.movements} />
          <ClosingSummary key={date} ledger={ledger} />
        </aside>
      </div>

      <MovementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateMovement}
      />
    </div>
  );
}
